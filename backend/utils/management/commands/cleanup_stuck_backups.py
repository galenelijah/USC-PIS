"""
Management command to clean up stuck backup operations
"""

import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from utils.models import BackupStatus

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Clean up backup operations that have been stuck for too long'

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout-minutes',
            type=int,
            default=30,
            help='Mark backups as failed if running longer than this many minutes (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without making changes',
        )

    def handle(self, *args, **options):
        timeout_minutes = options['timeout_minutes']
        dry_run = options['dry_run']
        
        # Calculate cutoff time
        cutoff_time = timezone.now() - timedelta(minutes=timeout_minutes)
        
        # Find stuck backups
        stuck_backups = BackupStatus.objects.filter(
            status='in_progress',
            started_at__lt=cutoff_time
        )
        
        if not stuck_backups.exists():
            self.stdout.write(
                self.style.SUCCESS('No stuck backups found.')
            )
            return
        
        self.stdout.write(
            f'Found {stuck_backups.count()} backup(s) stuck for over {timeout_minutes} minutes:'
        )
        
        for backup in stuck_backups:
            elapsed = timezone.now() - backup.started_at
            elapsed_minutes = elapsed.total_seconds() / 60
            
            self.stdout.write(
                f'  Backup ID {backup.id}: {backup.backup_type} backup, '
                f'running for {elapsed_minutes:.1f} minutes'
            )
            
            if not dry_run:
                # Mark as failed
                backup.status = 'failed'
                backup.completed_at = timezone.now()
                backup.duration_seconds_stored = elapsed.total_seconds()
                backup.error_message = (
                    f'Backup timed out after running for {elapsed_minutes:.1f} minutes. '
                    f'Automatically marked as failed by cleanup command.'
                )
                backup.save()
                
                self.stdout.write(
                    self.style.WARNING(f'  -> Marked backup {backup.id} as failed')
                )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would mark {stuck_backups.count()} backup(s) as failed. '
                    f'Run without --dry-run to apply changes.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully cleaned up {stuck_backups.count()} stuck backup(s).'
                )
            )