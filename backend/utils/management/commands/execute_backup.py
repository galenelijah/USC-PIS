"""
Management command to execute pending backup operations
"""

import os
import json
import time
import logging
from django.core.management.base import BaseCommand
from django.core import serializers
from django.conf import settings
from django.utils import timezone
from django.apps import apps
from utils.models import BackupStatus
import hashlib
import shutil

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Execute pending backup operations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--backup-id',
            type=int,
            help='Execute specific backup by ID',
        )
        parser.add_argument(
            '--auto',
            action='store_true',
            help='Automatically execute all pending backups',
        )

    def handle(self, *args, **options):
        backup_id = options.get('backup_id')
        auto_mode = options.get('auto')

        if backup_id:
            self.execute_backup(backup_id)
        elif auto_mode:
            self.execute_pending_backups()
        else:
            self.stdout.write(
                self.style.ERROR('Please specify --backup-id or --auto')
            )

    def execute_pending_backups(self):
        """Execute all pending backup operations"""
        pending_backups = BackupStatus.objects.filter(status='in_progress')
        
        if not pending_backups.exists():
            self.stdout.write(self.style.SUCCESS('No pending backups found'))
            return

        for backup in pending_backups:
            self.stdout.write(f'Executing backup {backup.id}...')
            try:
                self.execute_backup(backup.id)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to execute backup {backup.id}: {e}')
                )

    def execute_backup(self, backup_id):
        """Execute a specific backup operation"""
        try:
            backup = BackupStatus.objects.get(id=backup_id)
        except BackupStatus.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Backup {backup_id} not found')
            )
            return

        if backup.status != 'in_progress':
            self.stdout.write(
                self.style.WARNING(f'Backup {backup_id} is not in progress')
            )
            return

        start_time = time.time()
        
        try:
            # Create backup directory if it doesn't exist
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            os.makedirs(backup_dir, exist_ok=True)

            if backup.backup_type == 'database':
                self.execute_database_backup(backup, backup_dir)
            elif backup.backup_type == 'media':
                self.execute_media_backup(backup, backup_dir)
            elif backup.backup_type == 'full':
                self.execute_full_backup(backup, backup_dir)
            else:
                raise ValueError(f'Unknown backup type: {backup.backup_type}')

            # Update backup record with success
            backup.status = 'success'
            backup.completed_at = timezone.now()
            backup.duration_seconds_stored = time.time() - start_time
            backup.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Backup {backup_id} completed successfully in {backup.duration_seconds:.2f}s'
                )
            )

        except Exception as e:
            # Update backup record with failure
            backup.status = 'failed'
            backup.completed_at = timezone.now()
            backup.duration_seconds_stored = time.time() - start_time
            backup.error_message = str(e)
            backup.save()

            logger.error(f'Backup {backup_id} failed: {e}', exc_info=True)
            self.stdout.write(
                self.style.ERROR(f'Backup {backup_id} failed: {e}')
            )

    def execute_database_backup(self, backup, backup_dir):
        """Execute database backup"""
        self.stdout.write('Creating database backup...')
        
        # Define models to skip for faster backups
        skip_apps = ['contenttypes', 'sessions', 'admin']
        skip_models = []
        
        # Check if this is a quick backup (from metadata)
        quick_backup = backup.metadata.get('quick_backup', False)
        if quick_backup:
            # For quick backups, skip large log tables and non-essential data
            skip_models.extend([
                'notifications.NotificationLog',
                'reports.GeneratedReport'
            ])
            self.stdout.write('  Running quick backup (excluding logs and reports)...')
        
        # Get all models to backup
        models_to_backup = []
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                # Skip system models
                if model._meta.app_label in skip_apps:
                    continue
                # Skip specific models for quick backup
                if quick_backup and model._meta.label in skip_models:
                    continue
                models_to_backup.append(model)

        # Serialize all data in smaller batches for better performance
        data = []
        total_records = 0
        
        for model in models_to_backup:
            queryset = model.objects.all()
            if queryset.exists():
                # Process in batches of 1000 for large tables
                batch_size = 1000
                record_count = queryset.count()
                
                if record_count > batch_size:
                    for i in range(0, record_count, batch_size):
                        batch = queryset[i:i + batch_size]
                        model_data = serializers.serialize('python', batch)
                        data.extend(model_data)
                else:
                    model_data = serializers.serialize('python', queryset)
                    data.extend(model_data)
                
                total_records += record_count
                self.stdout.write(f'  Backed up {record_count} {model._meta.label} records')

        # Save to file
        timestamp = backup.started_at.strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'database_backup_{timestamp}.json')
        
        with open(backup_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)

        # Calculate file size and checksum
        file_size = os.path.getsize(backup_file)
        with open(backup_file, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()

        # Update backup record
        backup.file_size = file_size
        backup.checksum = file_hash
        backup.metadata = {
            **backup.metadata,
            'total_records': total_records,
            'total_models': len(models_to_backup),
            'backup_file': backup_file
        }
        backup.save()

        self.stdout.write(f'Database backup saved: {backup_file} ({backup.file_size_mb:.2f} MB)')

    def execute_media_backup(self, backup, backup_dir):
        """Execute media files backup"""
        self.stdout.write('Creating media backup...')
        
        # Get media root directory
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            self.stdout.write('No media files to backup')
            return

        # Create media backup directory
        timestamp = backup.started_at.strftime('%Y%m%d_%H%M%S')
        media_backup_dir = os.path.join(backup_dir, f'media_backup_{timestamp}')
        
        # Copy media files
        shutil.copytree(media_root, media_backup_dir)
        
        # Calculate total size
        total_size = 0
        file_count = 0
        for root, dirs, files in os.walk(media_backup_dir):
            for file in files:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
                file_count += 1

        # Update backup record
        backup.file_size = total_size
        backup.metadata = {
            **backup.metadata,
            'total_files': file_count,
            'backup_directory': media_backup_dir
        }
        backup.save()

        self.stdout.write(f'Media backup saved: {media_backup_dir} ({file_count} files, {backup.file_size_mb:.2f} MB)')

    def execute_full_backup(self, backup, backup_dir):
        """Execute full system backup (database + media)"""
        self.stdout.write('Creating full system backup...')
        
        # Execute database backup
        self.execute_database_backup(backup, backup_dir)
        
        # Execute media backup
        self.execute_media_backup(backup, backup_dir)
        
        # Create backup manifest
        timestamp = backup.started_at.strftime('%Y%m%d_%H%M%S')
        manifest_file = os.path.join(backup_dir, f'backup_manifest_{timestamp}.json')
        
        manifest = {
            'backup_id': backup.id,
            'backup_type': 'full',
            'created_at': backup.started_at.isoformat(),
            'database_backup': f'database_backup_{timestamp}.json',
            'media_backup': f'media_backup_{timestamp}',
            'total_size_mb': backup.file_size / (1024 * 1024) if backup.file_size else 0,
            'metadata': backup.metadata
        }
        
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)

        self.stdout.write(f'Full backup completed with manifest: {manifest_file}')