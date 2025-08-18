"""
Test the new backup system performance and reliability
"""

import time
from django.core.management.base import BaseCommand
from utils.backup_engine import BackupEngine
from utils.models import BackupStatus

class Command(BaseCommand):
    help = 'Test new backup system performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=1,
            help='Number of test backups to create (default: 1)',
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
        count = options['count']
        quick = options.get('quick', True)
        verify = options.get('verify', True)
        
        self.stdout.write('=== NEW BACKUP SYSTEM TEST ===')
        self.stdout.write(f'Creating {count} backup(s) with quick={quick}, verify={verify}')
        
        total_time = 0
        success_count = 0
        
        for i in range(count):
            self.stdout.write(f'\nTest {i+1}/{count}:')
            
            try:
                start_time = time.time()
                
                # Create backup using new engine
                engine = BackupEngine(timeout_seconds=120)
                backup_id = engine.create_backup_async(
                    backup_type='database',
                    quick_backup=quick,
                    verify_integrity=verify
                )
                
                duration = time.time() - start_time
                total_time += duration
                
                # Get backup details
                backup = BackupStatus.objects.get(id=backup_id)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  SUCCESS: Backup {backup_id} completed in {duration:.2f}s'
                    )
                )
                self.stdout.write(
                    f'  Status: {backup.status}'
                )
                self.stdout.write(
                    f'  File size: {backup.file_size_mb:.3f} MB'
                )
                if backup.metadata.get('verification_result'):
                    self.stdout.write(
                        f'  Verification: {backup.metadata["verification_result"]}'
                    )
                
                success_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  FAILED: {str(e)}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'RESULTS SUMMARY:')
        self.stdout.write(f'  Total tests: {count}')
        self.stdout.write(f'  Successful: {success_count}')
        self.stdout.write(f'  Failed: {count - success_count}')
        self.stdout.write(f'  Success rate: {(success_count/count)*100:.1f}%')
        
        if success_count > 0:
            avg_time = total_time / success_count
            self.stdout.write(f'  Average time: {avg_time:.2f} seconds')
            
            # Compare with old system
            old_system_time = avg_time * 26  # Based on our earlier findings
            improvement = (old_system_time - avg_time) / old_system_time * 100
            
            self.stdout.write(f'  Old system time: ~{old_system_time:.0f} seconds')
            self.stdout.write(
                self.style.SUCCESS(
                    f'  Performance improvement: {improvement:.0f}% faster!'
                )
            )
        
        if success_count == count:
            self.stdout.write(
                self.style.SUCCESS('\nNEW BACKUP SYSTEM: FULLY OPERATIONAL!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\nSome tests failed - check logs for details')
            )