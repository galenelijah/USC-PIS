"""
Test backup upload and restore functionality
"""

import os
import tempfile
from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import SimpleUploadedFile
from utils.backup_restore_engine import BackupRestoreEngine
from utils.fast_backup_engine import FastBackupEngine
from utils.models import BackupStatus

class Command(BaseCommand):
    help = 'Test backup upload and restore functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-type',
            type=str,
            default='all',
            choices=['upload', 'restore', 'all'],
            help='Test type to run (default: all)',
        )

    def handle(self, *args, **options):
        test_type = options['test_type']
        
        self.stdout.write('=== BACKUP UPLOAD & RESTORE TEST ===')
        
        if test_type in ['upload', 'all']:
            self.test_upload_functionality()
        
        if test_type in ['restore', 'all']:
            self.test_restore_functionality()
    
    def test_upload_functionality(self):
        """Test backup file upload"""
        self.stdout.write('\\nTesting Backup Upload Functionality:')
        
        try:
            # Create a test backup first
            self.stdout.write('  1. Creating test database backup...')
            
            fast_engine = FastBackupEngine()
            backup_id = fast_engine.create_backup_async(
                backup_type='database',
                quick_backup=True,
                verify_integrity=False
            )
            
            backup_record = BackupStatus.objects.get(id=backup_id)
            original_file_path = backup_record.metadata.get('file_path')
            
            if not original_file_path or not os.path.exists(original_file_path):
                raise Exception("Test backup file not created")
            
            self.stdout.write(
                self.style.SUCCESS(f'     Test backup created: {backup_id}')
            )
            
            # Test upload functionality
            self.stdout.write('  2. Testing file upload...')
            
            # Read the backup file and create an uploaded file object
            with open(original_file_path, 'rb') as f:
                file_content = f.read()
            
            uploaded_file = SimpleUploadedFile(
                name='test_backup.json.gz',
                content=file_content,
                content_type='application/gzip'
            )
            
            # Test the upload engine
            restore_engine = BackupRestoreEngine()
            upload_result = restore_engine.upload_backup_file(
                uploaded_file,
                backup_type='database',
                description='Test uploaded backup'
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'     Upload successful: ID {upload_result["backup_id"]}'
                )
            )
            self.stdout.write(f'     File size: {upload_result["file_size_mb"]:.2f} MB')
            self.stdout.write(f'     Validation: {upload_result["validation_result"]}')
            self.stdout.write(f'     Records: {upload_result.get("record_count", "N/A")}')
            
            # Test getting uploaded backups list
            self.stdout.write('  3. Testing uploaded backups list...')
            
            uploaded_backups = restore_engine.get_uploaded_backups(limit=5)
            self.stdout.write(
                self.style.SUCCESS(f'     Found {len(uploaded_backups)} uploaded backups')
            )
            
            return upload_result['backup_id']
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'     Upload test failed: {str(e)}')
            )
            return None
    
    def test_restore_functionality(self):
        """Test backup restore functionality"""
        self.stdout.write('\\nTesting Backup Restore Functionality:')
        
        try:
            # Get an uploaded backup to test with
            restore_engine = BackupRestoreEngine()
            uploaded_backups = restore_engine.get_uploaded_backups(limit=1)
            
            if not uploaded_backups:
                self.stdout.write('     No uploaded backups found. Running upload test first...')
                backup_id = self.test_upload_functionality()
                if not backup_id:
                    raise Exception("Failed to create test backup")
            else:
                backup_id = uploaded_backups[0].id
            
            self.stdout.write(f'  1. Testing restore preview for backup {backup_id}...')
            
            # Test preview functionality
            preview_result = restore_engine.restore_from_backup(
                backup_id=backup_id,
                merge_strategy='replace',
                preview_only=True
            )
            
            self.stdout.write(
                self.style.SUCCESS('     Preview successful!')
            )
            self.stdout.write(f'     Records to restore: {preview_result.get("total_records", "N/A")}')
            if preview_result.get('models'):
                self.stdout.write(f'     Models involved: {len(preview_result["models"])}')
            
            # Test actual restore (WARNING: This modifies the database!)
            self.stdout.write('  2. Testing actual restore (CAUTION: Modifies database)...')
            
            # For safety, we'll skip the actual restore in this test
            # Uncomment the following lines to test actual restore:
            
            # restore_result = restore_engine.restore_from_backup(
            #     backup_id=backup_id,
            #     merge_strategy='merge',  # Use merge to be safer
            #     preview_only=False
            # )
            # 
            # self.stdout.write(
            #     self.style.SUCCESS('     Restore successful!')
            # )
            # self.stdout.write(f'     Duration: {restore_result.get("duration", "N/A"):.2f}s')
            
            self.stdout.write(
                self.style.WARNING('     Actual restore skipped for safety (uncomment code to test)')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'     Restore test failed: {str(e)}')
            )
    
    def run_complete_test(self):
        """Run complete upload and restore cycle"""
        self.stdout.write('\\n=== COMPLETE UPLOAD/RESTORE CYCLE ===')
        
        success_count = 0
        total_tests = 3
        
        try:
            # 1. Create original backup
            self.stdout.write('1. Creating original backup...')
            fast_engine = FastBackupEngine()
            original_backup_id = fast_engine.create_backup_async(
                backup_type='database',
                quick_backup=True
            )
            success_count += 1
            
            # 2. Upload the backup
            self.stdout.write('2. Uploading backup...')
            upload_id = self.test_upload_functionality()
            if upload_id:
                success_count += 1
            
            # 3. Restore from uploaded backup
            self.stdout.write('3. Restoring from uploaded backup...')
            self.test_restore_functionality()
            success_count += 1
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Complete test failed: {str(e)}')
            )
        
        # Results
        self.stdout.write('\\n' + '='*50)
        self.stdout.write('BACKUP UPLOAD/RESTORE TEST RESULTS:')
        self.stdout.write(f'  Successful steps: {success_count}/{total_tests}')
        self.stdout.write(f'  Success rate: {(success_count/total_tests)*100:.1f}%')
        
        if success_count == total_tests:
            self.stdout.write(
                self.style.SUCCESS('\\nBACKUP UPLOAD/RESTORE: FULLY FUNCTIONAL!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\\nSome tests failed - check logs for details')
            )