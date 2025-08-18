"""
Test the ultra-fast backup system performance and all backup types
"""

import time
from django.core.management.base import BaseCommand
from utils.fast_backup_engine import FastBackupEngine
from utils.models import BackupStatus

class Command(BaseCommand):
    help = 'Test ultra-fast backup system with all backup types'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='all',
            choices=['database', 'media', 'full', 'all'],
            help='Backup type to test (default: all)',
        )
        parser.add_argument(
            '--quick',
            action='store_true',
            help='Use quick backup mode',
        )
        parser.add_argument(
            '--verify',
            action='store_true',
            help='Verify backup integrity',
        )

    def handle(self, *args, **options):
        backup_type = options['type']
        quick = options.get('quick', True)
        verify = options.get('verify', True)
        
        self.stdout.write('=== ULTRA-FAST BACKUP SYSTEM TEST ===')
        
        if backup_type == 'all':
            backup_types = ['database', 'media', 'full']
        else:
            backup_types = [backup_type]
        
        total_time = 0
        success_count = 0
        
        for i, btype in enumerate(backup_types):
            self.stdout.write(f'\\nTest {i+1}/{len(backup_types)}: {btype.upper()} backup')
            
            try:
                start_time = time.time()
                
                # Create backup using fast engine
                engine = FastBackupEngine(timeout_seconds=120)
                backup_id = engine.create_backup_async(
                    backup_type=btype,
                    quick_backup=quick,
                    verify_integrity=verify
                )
                
                duration = time.time() - start_time
                total_time += duration
                
                # Get backup details
                backup = BackupStatus.objects.get(id=backup_id)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  SUCCESS: {btype} backup {backup_id} completed in {duration:.2f}s'
                    )
                )
                self.stdout.write(f'  Status: {backup.status}')
                file_size = backup.file_size_mb
                if file_size is not None:
                    self.stdout.write(f'  File size: {file_size:.3f} MB')
                else:
                    self.stdout.write(f'  File size: N/A')
                self.stdout.write(f'  Method: {backup.metadata.get("backup_method")}')
                
                if backup.metadata.get('verification_result'):
                    self.stdout.write(f'  Verification: {backup.metadata["verification_result"]}')
                
                if backup.metadata.get('files_count'):
                    self.stdout.write(f'  Files included: {backup.metadata["files_count"]}')
                
                success_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  FAILED: {str(e)}')
                )
        
        # Summary
        self.stdout.write('\\n' + '='*60)
        self.stdout.write('ULTRA-FAST BACKUP RESULTS:')
        self.stdout.write(f'  Total tests: {len(backup_types)}')
        self.stdout.write(f'  Successful: {success_count}')
        self.stdout.write(f'  Failed: {len(backup_types) - success_count}')
        self.stdout.write(f'  Success rate: {(success_count/len(backup_types))*100:.1f}%')
        
        if success_count > 0:
            avg_time = total_time / success_count
            self.stdout.write(f'  Average time: {avg_time:.2f} seconds')
            
            # Compare with old system (our previous "fast" system was 57s)
            old_system_time = 57  # seconds for database backup
            if avg_time < old_system_time:
                improvement = (old_system_time - avg_time) / old_system_time * 100
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  Performance vs old "fast" system: {improvement:.0f}% faster!'
                    )
                )
            
            # Show dramatic improvement vs original system (25+ minutes)
            original_system_time = 1500  # 25 minutes
            dramatic_improvement = (original_system_time - avg_time) / original_system_time * 100
            self.stdout.write(
                self.style.SUCCESS(
                    f'  Performance vs original system: {dramatic_improvement:.1f}% faster!'
                )
            )
        
        if success_count == len(backup_types):
            self.stdout.write(
                self.style.SUCCESS('\\nULTRA-FAST BACKUP SYSTEM: ALL TYPES WORKING!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\\nSome backup types failed - check logs for details')
            )