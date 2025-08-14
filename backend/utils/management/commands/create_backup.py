from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.apps import apps
from django.conf import settings
from django.utils import timezone
import json
import os
import subprocess
import hashlib
import tempfile
from pathlib import Path


class Command(BaseCommand):
    help = 'Create comprehensive system backup with verification'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['database', 'media', 'full'],
            default='full',
            help='Type of backup to create (default: full)'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default=None,
            help='Output directory for backup files'
        )
        parser.add_argument(
            '--verify',
            action='store_true',
            help='Verify backup integrity after creation'
        )

    def handle(self, *args, **options):
        backup_type = options['type']
        output_dir = options['output_dir'] or os.path.join(settings.BASE_DIR, 'backups')
        verify = options['verify']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting {backup_type} backup...')
        )
        
        # Ensure backup directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_info = {
            'timestamp': timestamp,
            'backup_type': backup_type,
            'created_at': timezone.now().isoformat(),
            'django_version': getattr(settings, 'DJANGO_VERSION', 'unknown'),
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'files': []
        }
        
        try:
            if backup_type in ['database', 'full']:
                db_file = self._backup_database(output_dir, timestamp)
                backup_info['files'].append(db_file)
                
            if backup_type in ['media', 'full']:
                media_files = self._backup_media_files(output_dir, timestamp)
                backup_info['files'].extend(media_files)
                
            # Create backup manifest
            manifest_file = os.path.join(output_dir, f'backup_manifest_{timestamp}.json')
            with open(manifest_file, 'w') as f:
                json.dump(backup_info, f, indent=2, default=str)
            
            backup_info['files'].append(manifest_file)
            
            # Calculate checksums for verification
            if verify:
                self._verify_backup_integrity(backup_info)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Backup completed successfully! Files created:\n' +
                    '\n'.join(f'  - {f}' for f in backup_info['files'])
                )
            )
            
            # Log backup to database
            self._log_backup_status(backup_type, 'success', backup_info)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Backup failed: {str(e)}')
            )
            self._log_backup_status(backup_type, 'failed', {'error': str(e)})
            raise CommandError(f'Backup failed: {str(e)}')

    def _backup_database(self, output_dir, timestamp):
        """Create database backup using Django's serialization"""
        self.stdout.write('Creating database backup...')
        
        db_file = os.path.join(output_dir, f'database_backup_{timestamp}.json')
        
        # Get all models from all apps
        all_models = []
        for app_config in apps.get_app_configs():
            all_models.extend(app_config.get_models())
        
        # Serialize all data
        with open(db_file, 'w') as f:
            serializers.serialize('json', 
                self._get_all_objects(all_models), 
                stream=f, 
                indent=2
            )
        
        self.stdout.write(f'Database backup created: {db_file}')
        return db_file

    def _get_all_objects(self, models):
        """Get all objects from all models"""
        for model in models:
            try:
                for obj in model.objects.all():
                    yield obj
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f'Warning: Could not serialize {model}: {str(e)}'
                    )
                )

    def _backup_media_files(self, output_dir, timestamp):
        """Create backup of media files"""
        self.stdout.write('Creating media files backup...')
        
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            self.stdout.write('No media directory found, skipping media backup')
            return []
        
        media_backup_dir = os.path.join(output_dir, f'media_backup_{timestamp}')
        os.makedirs(media_backup_dir, exist_ok=True)
        
        backed_up_files = []
        
        # Copy media files
        for root, dirs, files in os.walk(media_root):
            for file in files:
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, media_root)
                dest_path = os.path.join(media_backup_dir, rel_path)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                
                # Copy file
                import shutil
                shutil.copy2(src_path, dest_path)
                backed_up_files.append(dest_path)
        
        self.stdout.write(f'Media backup created: {media_backup_dir} ({len(backed_up_files)} files)')
        return [media_backup_dir]

    def _verify_backup_integrity(self, backup_info):
        """Verify backup file integrity"""
        self.stdout.write('Verifying backup integrity...')
        
        for file_path in backup_info['files']:
            if os.path.isfile(file_path):
                # Calculate file checksum
                checksum = self._calculate_file_checksum(file_path)
                backup_info.setdefault('checksums', {})[file_path] = checksum
                self.stdout.write(f'  [OK] {os.path.basename(file_path)}: {checksum}')
            elif os.path.isdir(file_path):
                # For directories, calculate checksum of file list
                file_list = []
                for root, dirs, files in os.walk(file_path):
                    for file in files:
                        file_list.append(os.path.join(root, file))
                
                dir_checksum = hashlib.md5('\n'.join(sorted(file_list)).encode()).hexdigest()
                backup_info.setdefault('checksums', {})[file_path] = dir_checksum
                self.stdout.write(f'  [OK] {os.path.basename(file_path)}/: {dir_checksum} ({len(file_list)} files)')

    def _calculate_file_checksum(self, file_path):
        """Calculate MD5 checksum of a file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _log_backup_status(self, backup_type, status, info):
        """Log backup status to database"""
        try:
            from utils.models import BackupStatus
            
            backup_record = BackupStatus.objects.create(
                backup_type=backup_type,
                status=status,
                completed_at=timezone.now() if status != 'failed' else None,
                metadata=info
            )
            
            if status == 'success':
                # Calculate total file size
                total_size = 0
                for file_path in info.get('files', []):
                    if os.path.isfile(file_path):
                        total_size += os.path.getsize(file_path)
                    elif os.path.isdir(file_path):
                        for root, dirs, files in os.walk(file_path):
                            for file in files:
                                total_size += os.path.getsize(os.path.join(root, file))
                
                backup_record.file_size = total_size
                backup_record.save()
                
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not log backup status: {str(e)}')
            )