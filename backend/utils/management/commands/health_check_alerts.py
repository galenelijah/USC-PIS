"""
Management command for automated system health monitoring and email alerts
Designed to be run regularly via cron job to monitor system health
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from utils.health_checks import HealthChecker
from utils.models import BackupStatus
import logging

logger = logging.getLogger('system.health')

class Command(BaseCommand):
    help = 'Monitor system health and send email alerts for critical issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--alert-level',
            choices=['all', 'warning', 'unhealthy'],
            default='unhealthy',
            help='Send alerts for specified severity level and above (default: unhealthy)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview alerts that would be sent without actually sending them'
        )
        parser.add_argument(
            '--force-alert',
            action='store_true',
            help='Force send alert email regardless of system status (for testing)'
        )

    def handle(self, *args, **options):
        alert_level = options['alert_level']
        dry_run = options['dry_run']
        force_alert = options['force_alert']
        
        self.stdout.write("Running system health check...")
        
        # Run comprehensive health check
        health_checker = HealthChecker()
        health_status = health_checker.run_all_checks()
        
        overall_status = health_status['overall_status']
        timestamp = health_status['timestamp']
        
        self.stdout.write(f"System status: {overall_status}")
        
        # Determine if we should send an alert
        should_alert = False
        
        if force_alert:
            should_alert = True
            self.stdout.write("Force alert enabled - sending alert regardless of status")
        elif overall_status == 'unhealthy':
            should_alert = True
        elif overall_status == 'warning' and alert_level in ['warning', 'all']:
            should_alert = True
        elif alert_level == 'all':
            should_alert = True
        
        if not should_alert:
            self.stdout.write(self.style.SUCCESS("System healthy - no alerts needed"))
            return
        
        # Prepare alert email
        subject = f"USC-PIS System Alert - Status: {overall_status.upper()}"
        
        # Build detailed message
        message_lines = [
            f"USC Patient Information System Health Alert",
            f"Status: {overall_status.upper()}",
            f"Timestamp: {timestamp}",
            f"",
            f"Health Check Summary:",
            f"- Total checks: {health_status['summary']['total_checks']}",
            f"- Healthy: {health_status['summary']['healthy']}",
            f"- Warnings: {health_status['summary']['warnings']}",
            f"- Unhealthy: {health_status['summary']['unhealthy']}",
            f"- Health percentage: {health_status['summary']['health_percentage']}%",
            f"",
            f"Detailed Results:"
        ]
        
        # Add detailed check results
        for check_name, result in health_status['checks'].items():
            status_icon = "[OK]" if result['status'] == 'healthy' else "[WARN]" if result['status'] == 'warning' else "[FAIL]"
            message_lines.append(f"{status_icon} {check_name.title()}: {result['status']} - {result['message']}")
            
            if 'metrics' in result:
                for metric_name, metric_value in result['metrics'].items():
                    message_lines.append(f"   - {metric_name}: {metric_value}")
        
        # Add backup system specific alerts
        message_lines.extend(self._get_backup_alerts())
        
        message_lines.extend([
            f"",
            f"System Dashboard: https://usc-pis-5f030223f7a8.herokuapp.com/database-monitor",
            f"",
            f"This is an automated alert from USC-PIS Health Monitoring System.",
            f"If this is a critical issue, please check the system immediately."
        ])
        
        message = "\n".join(message_lines)
        
        # Determine recipients
        admin_emails = ['sgalenelijah@gmail.com']  # Primary admin
        
        # Add any additional admin emails from settings
        if hasattr(settings, 'ADMINS'):
            admin_emails.extend([email for name, email in settings.ADMINS])
        
        # Remove duplicates
        admin_emails = list(set(admin_emails))
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - Alert email would be sent to:"))
            for email in admin_emails:
                self.stdout.write(f"  - {email}")
            self.stdout.write(f"\nSubject: {subject}")
            self.stdout.write(f"Message preview:\n{message[:500]}...")
        else:
            # Send alert email
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=False
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f"Alert email sent to {len(admin_emails)} administrators")
                )
                logger.warning(f"System health alert sent: {overall_status}")
                
            except Exception as e:
                error_msg = f"Failed to send health alert email: {str(e)}"
                self.stdout.write(self.style.ERROR(error_msg))
                logger.error(error_msg)
    
    def _get_backup_alerts(self):
        """Get specific backup system alerts"""
        alerts = []
        
        try:
            # Check for recent backup failures
            recent_backups = BackupStatus.objects.filter(
                started_at__gte=timezone.now() - timezone.timedelta(days=7)
            ).order_by('-started_at')[:10]
            
            failed_backups = recent_backups.filter(status='failed')
            
            if failed_backups.exists():
                alerts.append("")
                alerts.append("[CRITICAL] BACKUP SYSTEM ALERTS:")
                for backup in failed_backups:
                    alerts.append(f"   - Failed backup: {backup.backup_type} at {backup.started_at}")
                    if backup.error_message:
                        alerts.append(f"     Error: {backup.error_message}")
            
            # Check for old backups
            latest_backup = recent_backups.filter(status='completed').first()
            if latest_backup:
                days_since = (timezone.now() - latest_backup.started_at).days
                if days_since > 3:
                    alerts.append("")
                    alerts.append(f"[WARNING] Last successful backup was {days_since} days ago")
            else:
                alerts.append("")
                alerts.append("[CRITICAL] No successful backups found in last 7 days")
        
        except Exception as e:
            alerts.append(f"Error checking backup status: {str(e)}")
        
        return alerts