from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from utils.models import BackupStatus, BackupSchedule, SystemHealthMetric
import subprocess
import json


class Command(BaseCommand):
    help = 'Monitor backup system health and send alerts if needed'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--send-alerts',
            action='store_true',
            help='Send email alerts for backup issues'
        )
        parser.add_argument(
            '--check-heroku',
            action='store_true',
            help='Check Heroku backup status'
        )
        parser.add_argument(
            '--alert-email',
            type=str,
            default=None,
            help='Email address for alerts (overrides default)'
        )

    def handle(self, *args, **options):
        send_alerts = options['send_alerts']
        check_heroku = options['check_heroku']
        alert_email = options['alert_email']
        
        self.stdout.write(
            self.style.SUCCESS('Starting backup system monitoring...')
        )
        
        monitoring_results = {
            'timestamp': timezone.now().isoformat(),
            'overall_health': 'healthy',
            'issues': [],
            'recommendations': [],
            'backup_summary': {},
            'heroku_status': {}
        }
        
        try:
            # Check backup system health
            health_summary = self._check_backup_health()
            monitoring_results['backup_summary'] = health_summary
            
            # Check Heroku backup status if requested
            if check_heroku:
                heroku_status = self._check_heroku_backup_status()
                monitoring_results['heroku_status'] = heroku_status
            
            # Analyze issues and recommendations
            issues, recommendations = self._analyze_backup_health(health_summary)
            monitoring_results['issues'] = issues
            monitoring_results['recommendations'] = recommendations
            
            # Determine overall health
            if issues:
                critical_issues = [i for i in issues if i.get('severity') == 'critical']
                if critical_issues:
                    monitoring_results['overall_health'] = 'critical'
                else:
                    monitoring_results['overall_health'] = 'warning'
            
            # Record health metric
            SystemHealthMetric.record_backup_health()
            
            # Send alerts if needed and requested
            if send_alerts and (issues or monitoring_results['overall_health'] != 'healthy'):
                self._send_backup_alerts(monitoring_results, alert_email)
            
            # Display results
            self._display_monitoring_results(monitoring_results)
            
            # Log monitoring results
            self._log_monitoring_results(monitoring_results)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Monitoring failed: {str(e)}')
            )
            monitoring_results['overall_health'] = 'critical'
            monitoring_results['issues'].append({
                'type': 'monitoring_failure',
                'severity': 'critical',
                'message': f'Monitoring system failed: {str(e)}'
            })

    def _check_backup_health(self):
        """Check overall backup system health"""
        return BackupStatus.get_backup_health_summary()

    def _check_heroku_backup_status(self):
        """Check Heroku backup status"""
        try:
            result = subprocess.run(
                ['heroku', 'pg:backups', '--app', 'usc-pis'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {
                    'status': 'success',
                    'output': result.stdout,
                    'last_checked': timezone.now().isoformat()
                }
            else:
                return {
                    'status': 'error',
                    'error': result.stderr,
                    'last_checked': timezone.now().isoformat()
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'last_checked': timezone.now().isoformat()
            }

    def _analyze_backup_health(self, health_summary):
        """Analyze backup health and identify issues/recommendations"""
        issues = []
        recommendations = []
        
        # Check for recent backup failures
        failed_backups = BackupStatus.objects.filter(
            status='failed',
            started_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        
        if failed_backups > 0:
            issues.append({
                'type': 'recent_failures',
                'severity': 'warning' if failed_backups < 3 else 'critical',
                'message': f'{failed_backups} backup failures in the last 24 hours'
            })
        
        # Check for old backups
        latest_db_backup = health_summary.get('latest_database_backup')
        if latest_db_backup:
            hours_since_backup = (timezone.now() - latest_db_backup.started_at).total_seconds() / 3600
            if hours_since_backup > 48:  # No backup in 48 hours
                issues.append({
                    'type': 'stale_backup',
                    'severity': 'critical',
                    'message': f'Latest database backup is {hours_since_backup:.1f} hours old'
                })
            elif hours_since_backup > 30:  # No backup in 30 hours
                issues.append({
                    'type': 'stale_backup',
                    'severity': 'warning',
                    'message': f'Latest database backup is {hours_since_backup:.1f} hours old'
                })
        else:
            issues.append({
                'type': 'no_backup',
                'severity': 'critical',
                'message': 'No database backups found'
            })
        
        # Check backup success rate
        if health_summary['health_score'] < 0.8:
            issues.append({
                'type': 'low_success_rate',
                'severity': 'warning',
                'message': f'Backup success rate is {health_summary["health_score"]*100:.1f}%'
            })
        
        # Check for missing media backups
        latest_media_backup = health_summary.get('latest_media_backup')
        if not latest_media_backup:
            recommendations.append({
                'type': 'media_backup',
                'message': 'Consider setting up regular media file backups'
            })
        
        # Check for verification backups
        latest_verification = health_summary.get('latest_verification')
        if not latest_verification:
            recommendations.append({
                'type': 'verification',
                'message': 'Run backup verification to ensure integrity'
            })
        elif latest_verification.started_at < timezone.now() - timezone.timedelta(days=7):
            recommendations.append({
                'type': 'verification',
                'message': 'Last backup verification was over a week ago'
            })
        
        return issues, recommendations

    def _send_backup_alerts(self, monitoring_results, alert_email=None):
        """Send email alerts for backup issues"""
        if not alert_email:
            # Try to get admin email from settings or use a default
            alert_email = getattr(settings, 'BACKUP_ALERT_EMAIL', None)
            if not alert_email:
                admins = getattr(settings, 'ADMINS', [])
                if admins:
                    alert_email = admins[0][1]
                else:
                    self.stdout.write(
                        self.style.WARNING('No alert email configured, skipping email alerts')
                    )
                    return
        
        subject = f'USC-PIS Backup Alert - {monitoring_results["overall_health"].upper()}'
        
        # Prepare email context
        context = {
            'monitoring_results': monitoring_results,
            'site_name': 'USC-PIS',
            'timestamp': timezone.now(),
        }
        
        # Render email content
        try:
            message = render_to_string('emails/backup_alert.html', context)
            plain_message = render_to_string('emails/backup_alert.txt', context)
        except:
            # Fallback to simple text email if templates don't exist
            message = self._create_simple_alert_message(monitoring_results)
            plain_message = message
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert_email],
                html_message=message,
                fail_silently=False
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Alert email sent to {alert_email}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to send alert email: {str(e)}')
            )

    def _create_simple_alert_message(self, monitoring_results):
        """Create a simple text alert message"""
        message_lines = [
            f"USC-PIS Backup System Alert",
            f"Status: {monitoring_results['overall_health'].upper()}",
            f"Time: {monitoring_results['timestamp']}",
            "",
            "Issues:"
        ]
        
        for issue in monitoring_results['issues']:
            message_lines.append(f"  - {issue['message']} (Severity: {issue['severity']})")
        
        if monitoring_results['recommendations']:
            message_lines.extend(["", "Recommendations:"])
            for rec in monitoring_results['recommendations']:
                message_lines.append(f"  - {rec['message']}")
        
        message_lines.extend([
            "",
            "Please check the USC-PIS admin panel for more details.",
            "",
            "This is an automated message from the USC-PIS backup monitoring system."
        ])
        
        return "\n".join(message_lines)

    def _display_monitoring_results(self, results):
        """Display monitoring results"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('BACKUP MONITORING RESULTS')
        self.stdout.write('='*50)
        
        # Overall health
        health = results['overall_health']
        if health == 'healthy':
            self.stdout.write(
                self.style.SUCCESS(f'✓ Overall Health: {health.upper()}')
            )
        elif health == 'warning':
            self.stdout.write(
                self.style.WARNING(f'⚠ Overall Health: {health.upper()}')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'✗ Overall Health: {health.upper()}')
            )
        
        # Issues
        if results['issues']:
            self.stdout.write('\nIssues Found:')
            for issue in results['issues']:
                severity_color = self.style.ERROR if issue['severity'] == 'critical' else self.style.WARNING
                self.stdout.write(
                    severity_color(f"  {issue['severity'].upper()}: {issue['message']}")
                )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n✓ No issues found')
            )
        
        # Recommendations
        if results['recommendations']:
            self.stdout.write('\nRecommendations:')
            for rec in results['recommendations']:
                self.stdout.write(f"  - {rec['message']}")
        
        # Backup summary
        summary = results['backup_summary']
        self.stdout.write(f'\nBackup Summary:')
        self.stdout.write(f"  Last 24h: {summary['last_24h_successful']}/{summary['last_24h_backups']} successful")
        self.stdout.write(f"  Last week: {summary['last_week_successful']}/{summary['last_week_backups']} successful")
        self.stdout.write(f"  Health score: {summary['health_score']*100:.1f}%")

    def _log_monitoring_results(self, results):
        """Log monitoring results to database"""
        try:
            BackupStatus.objects.create(
                backup_type='monitoring',
                status=results['overall_health'],
                completed_at=timezone.now(),
                metadata=results
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not log monitoring results: {str(e)}')
            )