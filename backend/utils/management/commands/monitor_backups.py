"""
Management command to monitor backup system health and automatically clean up issues
"""

import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.management import call_command
from utils.models import BackupStatus
from utils.health_checks import HealthChecker

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Monitor backup system health and automatically resolve issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--auto-fix',
            action='store_true',
            help='Automatically fix detected issues (clean up stuck backups)',
        )
        parser.add_argument(
            '--timeout-minutes',
            type=int,
            default=30,
            help='Consider backups stuck after this many minutes (default: 30)',
        )
        parser.add_argument(
            '--report-only',
            action='store_true',
            help='Only report status, do not make any changes',
        )

    def handle(self, *args, **options):
        auto_fix = options['auto_fix']
        timeout_minutes = options['timeout_minutes']
        report_only = options['report_only']
        
        self.stdout.write(
            self.style.SUCCESS('=== USC-PIS Backup System Monitor ===')
        )
        
        # Run health checks
        health_checker = HealthChecker()
        backup_health = health_checker.check_backup_system()
        
        self.stdout.write(f"Backup System Status: {backup_health['status'].upper()}")
        self.stdout.write(f"Message: {backup_health['message']}")
        
        if 'metrics' in backup_health:
            metrics = backup_health['metrics']
            self.stdout.write("\nMetrics:")
            for key, value in metrics.items():
                self.stdout.write(f"  {key}: {value}")
        
        # Check for stuck backups
        stuck_backups = BackupStatus.objects.filter(
            status='in_progress',
            started_at__lt=timezone.now() - timedelta(minutes=timeout_minutes)
        )
        
        if stuck_backups.exists():
            self.stdout.write(
                self.style.WARNING(f"\nFound {stuck_backups.count()} stuck backup(s):")
            )
            
            for backup in stuck_backups:
                elapsed = timezone.now() - backup.started_at
                elapsed_minutes = elapsed.total_seconds() / 60
                self.stdout.write(
                    f"  - Backup ID {backup.id}: {backup.backup_type} backup, "
                    f"stuck for {elapsed_minutes:.1f} minutes"
                )
            
            if auto_fix and not report_only:
                self.stdout.write(
                    self.style.SUCCESS("\nAuto-fixing stuck backups...")
                )
                call_command('cleanup_stuck_backups', f'--timeout-minutes={timeout_minutes}')
                
            elif not report_only:
                self.stdout.write(
                    self.style.WARNING(
                        f"\nTo fix stuck backups, run:\n"
                        f"  python manage.py cleanup_stuck_backups --timeout-minutes={timeout_minutes}"
                    )
                )
        else:
            self.stdout.write(
                self.style.SUCCESS("\nNo stuck backups found")
            )
        
        # Check recent backup frequency
        recent_backups = BackupStatus.objects.filter(
            started_at__gte=timezone.now() - timedelta(days=1)
        )
        
        if recent_backups.count() == 0:
            self.stdout.write(
                self.style.WARNING("\nNo backups in the last 24 hours")
            )
        else:
            successful_today = recent_backups.filter(status='success').count()
            failed_today = recent_backups.filter(status='failed').count()
            
            self.stdout.write(
                f"\nLast 24 hours: {successful_today} successful, {failed_today} failed backups"
            )
        
        # Overall recommendations
        self.stdout.write("\n" + "="*50)
        
        if backup_health['status'] == 'healthy':
            self.stdout.write(
                self.style.SUCCESS("Backup system is healthy")
            )
        elif backup_health['status'] == 'warning':
            self.stdout.write(
                self.style.WARNING("Backup system has warnings - monitor closely")
            )
        else:
            self.stdout.write(
                self.style.ERROR("Backup system is unhealthy - immediate attention required")
            )
        
        # Provide actionable recommendations
        if stuck_backups.exists():
            self.stdout.write(
                "\nRecommendations:"
            )
            self.stdout.write(
                "  1. Run cleanup command to resolve stuck backups"
            )
            self.stdout.write(
                "  2. Check system resources (memory, disk space)"
            )
            self.stdout.write(
                "  3. Review backup logs for error patterns"
            )
            
        if recent_backups.filter(status='failed').exists():
            self.stdout.write(
                "\nRecent failures detected:"
            )
            failed_backups = recent_backups.filter(status='failed')[:3]
            for backup in failed_backups:
                error_msg = backup.error_message[:100] + "..." if len(backup.error_message) > 100 else backup.error_message
                self.stdout.write(f"  - ID {backup.id}: {error_msg}")
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write("Monitor completed successfully")