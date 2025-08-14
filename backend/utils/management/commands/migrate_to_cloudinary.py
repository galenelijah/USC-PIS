from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone
import os
import shutil
import tempfile
from pathlib import Path


class Command(BaseCommand):
    help = 'Migrate existing media files to Cloudinary for persistent storage'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--backup-first',
            action='store_true',
            help='Create a backup of media files before migration'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it'
        )
        parser.add_argument(
            '--keep-local',
            action='store_true',
            help='Keep local files after migration (for verification)'
        )

    def handle(self, *args, **options):
        backup_first = options['backup_first']
        dry_run = options['dry_run']
        keep_local = options['keep_local']
        
        self.stdout.write(
            self.style.SUCCESS('Starting media files migration to Cloudinary...')
        )
        
        # Check if Cloudinary is configured
        if not self._check_cloudinary_configuration():
            raise CommandError('Cloudinary is not properly configured')
        
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            self.stdout.write(
                self.style.WARNING('No media directory found, nothing to migrate')
            )
            return
        
        # Get list of files to migrate
        files_to_migrate = self._get_media_files(media_root)
        
        if not files_to_migrate:
            self.stdout.write(
                self.style.WARNING('No media files found to migrate')
            )
            return
        
        self.stdout.write(f'Found {len(files_to_migrate)} files to migrate')
        
        if backup_first and not dry_run:
            self._create_migration_backup(media_root)
        
        migration_results = {
            'total_files': len(files_to_migrate),
            'migrated_files': 0,
            'failed_files': 0,
            'skipped_files': 0,
            'failures': [],
            'started_at': timezone.now().isoformat()
        }
        
        try:
            if dry_run:
                self._dry_run_migration(files_to_migrate)
            else:
                migration_results = self._migrate_files(files_to_migrate, keep_local)
            
            self._display_migration_results(migration_results, dry_run)
            
            if not dry_run:
                self._log_migration_results(migration_results)
                self._update_django_settings()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Migration failed: {str(e)}')
            )
            raise CommandError(f'Migration failed: {str(e)}')

    def _check_cloudinary_configuration(self):
        """Check if Cloudinary is properly configured"""
        try:
            import cloudinary
            from cloudinary import config
            
            # Check if environment variables are set
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            api_key = os.environ.get('CLOUDINARY_API_KEY')
            api_secret = os.environ.get('CLOUDINARY_API_SECRET')
            
            if not all([cloud_name, api_key, api_secret]):
                self.stdout.write(
                    self.style.ERROR(
                        'Cloudinary environment variables not set:\n'
                        '  - CLOUDINARY_CLOUD_NAME\n'
                        '  - CLOUDINARY_API_KEY\n'
                        '  - CLOUDINARY_API_SECRET\n'
                    )
                )
                return False
            
            # Test Cloudinary connection
            try:
                result = cloudinary.api.ping()
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Cloudinary connected: {cloud_name}')
                )
                return True
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Cloudinary connection failed: {str(e)}')
                )
                return False
                
        except ImportError:
            self.stdout.write(
                self.style.ERROR(
                    'Cloudinary package not installed. Install with:\n'
                    '  pip install cloudinary django-cloudinary-storage'
                )
            )
            return False

    def _get_media_files(self, media_root):
        """Get list of all media files to migrate"""
        media_files = []
        
        for root, dirs, files in os.walk(media_root):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, media_root)
                
                # Skip certain files
                if self._should_skip_file(rel_path):
                    continue
                
                file_info = {
                    'absolute_path': file_path,
                    'relative_path': rel_path,
                    'size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                }
                media_files.append(file_info)
        
        return media_files

    def _should_skip_file(self, rel_path):
        """Check if a file should be skipped during migration"""
        skip_patterns = [
            '.DS_Store',
            'Thumbs.db',
            '.gitkeep',
            '.gitignore',
        ]
        
        filename = os.path.basename(rel_path)
        return any(pattern in filename for pattern in skip_patterns)

    def _create_migration_backup(self, media_root):
        """Create a backup of media files before migration"""
        self.stdout.write('Creating backup before migration...')
        
        backup_dir = os.path.join(settings.BASE_DIR, 'media_backup_pre_cloudinary')
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        
        shutil.copytree(media_root, backup_dir)
        self.stdout.write(f'✓ Backup created: {backup_dir}')

    def _dry_run_migration(self, files_to_migrate):
        """Show what would be migrated without actually doing it"""
        self.stdout.write('\n--- DRY RUN RESULTS ---')
        
        total_size = sum(f['size'] for f in files_to_migrate)
        total_size_mb = total_size / (1024 * 1024)
        
        self.stdout.write(f'Files to migrate: {len(files_to_migrate)}')
        self.stdout.write(f'Total size: {total_size_mb:.2f} MB')
        
        # Group by directory
        dirs = {}
        for file_info in files_to_migrate:
            dir_name = os.path.dirname(file_info['relative_path']) or 'root'
            dirs.setdefault(dir_name, []).append(file_info)
        
        for dir_name, files in dirs.items():
            dir_size = sum(f['size'] for f in files)
            dir_size_mb = dir_size / (1024 * 1024)
            self.stdout.write(f'  {dir_name}/: {len(files)} files ({dir_size_mb:.2f} MB)')

    def _migrate_files(self, files_to_migrate, keep_local):
        """Actually migrate files to Cloudinary"""
        import cloudinary.uploader
        
        results = {
            'total_files': len(files_to_migrate),
            'migrated_files': 0,
            'failed_files': 0,
            'skipped_files': 0,
            'failures': [],
            'started_at': timezone.now().isoformat()
        }
        
        for i, file_info in enumerate(files_to_migrate, 1):
            rel_path = file_info['relative_path']
            abs_path = file_info['absolute_path']
            
            self.stdout.write(f'[{i}/{len(files_to_migrate)}] Migrating: {rel_path}')
            
            try:
                # Upload to Cloudinary
                # Use the relative path as the public_id to maintain structure
                public_id = rel_path.replace('\\', '/').replace(' ', '_')
                if public_id.startswith('/'):
                    public_id = public_id[1:]
                
                result = cloudinary.uploader.upload(
                    abs_path,
                    public_id=public_id,
                    resource_type='auto',  # Auto-detect image/video/raw
                    folder='usc_pis_media',  # Organize in a folder
                    use_filename=True,
                    unique_filename=False,
                )
                
                self.stdout.write(f'  ✓ Uploaded: {result["secure_url"]}')
                results['migrated_files'] += 1
                
                # Remove local file if not keeping
                if not keep_local:
                    os.remove(abs_path)
                    self.stdout.write(f'  ✓ Removed local file')
                
            except Exception as e:
                error_msg = f'Failed to migrate {rel_path}: {str(e)}'
                self.stdout.write(f'  ✗ {error_msg}')
                results['failed_files'] += 1
                results['failures'].append({
                    'file': rel_path,
                    'error': str(e)
                })
        
        results['completed_at'] = timezone.now().isoformat()
        return results

    def _display_migration_results(self, results, dry_run):
        """Display migration results"""
        if dry_run:
            return
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('MIGRATION RESULTS')
        self.stdout.write('='*50)
        
        self.stdout.write(f'Total files: {results["total_files"]}')
        self.stdout.write(f'✓ Migrated: {results["migrated_files"]}')
        self.stdout.write(f'✗ Failed: {results["failed_files"]}')
        self.stdout.write(f'⊝ Skipped: {results["skipped_files"]}')
        
        if results['failures']:
            self.stdout.write('\nFailures:')
            for failure in results['failures']:
                self.stdout.write(f'  - {failure["file"]}: {failure["error"]}')
        
        if results['failed_files'] == 0:
            self.stdout.write(
                self.style.SUCCESS('\n✓ All files migrated successfully!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠ {results["failed_files"]} files failed to migrate'
                )
            )

    def _update_django_settings(self):
        """Show instructions for updating Django settings"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('NEXT STEPS')
        self.stdout.write('='*50)
        
        self.stdout.write(
            'To complete the migration, update your Django settings:\n\n'
            '1. Add to INSTALLED_APPS:\n'
            '   "cloudinary_storage",\n'
            '   "cloudinary",\n\n'
            '2. Add Cloudinary configuration:\n'
            '   import cloudinary\n'
            '   CLOUDINARY_STORAGE = {\n'
            '       "CLOUD_NAME": os.environ.get("CLOUDINARY_CLOUD_NAME"),\n'
            '       "API_KEY": os.environ.get("CLOUDINARY_API_KEY"),\n'
            '       "API_SECRET": os.environ.get("CLOUDINARY_API_SECRET"),\n'
            '   }\n'
            '   DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"\n\n'
            '3. Deploy your application with the new settings\n'
        )

    def _log_migration_results(self, results):
        """Log migration results to database"""
        try:
            from utils.models import BackupStatus
            
            status = 'success' if results['failed_files'] == 0 else 'warning'
            
            BackupStatus.objects.create(
                backup_type='media',
                status=status,
                completed_at=timezone.now(),
                metadata={
                    'migration_type': 'cloudinary_migration',
                    'results': results
                }
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not log migration results: {str(e)}')
            )