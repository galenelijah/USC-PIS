from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import subprocess
import sys


class Command(BaseCommand):
    help = 'Setup automated Heroku Postgres backups'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--app',
            type=str,
            default='usc-pis',
            help='Heroku app name (default: usc-pis)'
        )
        parser.add_argument(
            '--schedule-time',
            type=str,
            default='02:00',
            help='Daily backup time in UTC (default: 02:00)'
        )
        parser.add_argument(
            '--retention-days',
            type=int,
            default=7,
            help='Number of days to retain backups (default: 7)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show commands that would be run without executing them'
        )

    def handle(self, *args, **options):
        app_name = options['app']
        schedule_time = options['schedule_time']
        retention_days = options['retention_days']
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS(f'Setting up Heroku Postgres backups for app: {app_name}')
        )
        
        # Commands to set up backups
        commands = [
            # Check current backup status
            ['heroku', 'pg:backups', '--app', app_name],
            
            # Cancel any existing backup schedules
            ['heroku', 'pg:backups:unschedule', 'DATABASE_URL', '--app', app_name],
            
            # Schedule daily backups
            ['heroku', 'pg:backups:schedule', 'DATABASE_URL', 
             '--at', schedule_time, '--app', app_name],
            
            # Set retention policy
            ['heroku', 'pg:backups:retention', str(retention_days), '--app', app_name],
            
            # Create an immediate backup to test
            ['heroku', 'pg:backups:capture', '--app', app_name],
            
            # Verify the setup
            ['heroku', 'pg:backups:schedules', '--app', app_name],
        ]
        
        try:
            # Check if Heroku CLI is available
            self._check_heroku_cli()
            
            # Check if user is authenticated
            self._check_heroku_auth()
            
            # Execute commands
            for i, cmd in enumerate(commands):
                self.stdout.write(f'\nStep {i+1}: {" ".join(cmd)}')
                
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING('  [DRY RUN] Command would be executed')
                    )
                    continue
                
                # Special handling for unschedule command (might fail if no schedule exists)
                if 'unschedule' in cmd:
                    result = self._run_command_safe(cmd, ignore_errors=True)
                    if result.returncode != 0:
                        self.stdout.write(
                            self.style.WARNING('  No existing schedule to remove (this is fine)')
                        )
                else:
                    result = self._run_command_safe(cmd)
                    if result.returncode != 0:
                        raise CommandError(f'Command failed: {" ".join(cmd)}\nError: {result.stderr}')
                
                if result.stdout.strip():
                    # Indent output for readability
                    for line in result.stdout.strip().split('\n'):
                        self.stdout.write(f'    {line}')
            
            if not dry_run:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n✓ Heroku Postgres backups configured successfully!\n'
                        f'  - Daily backups at {schedule_time} UTC\n'
                        f'  - {retention_days} days retention\n'
                        f'  - Test backup created\n'
                    )
                )
                
                # Log the setup
                self._log_backup_setup(app_name, schedule_time, retention_days)
            else:
                self.stdout.write(
                    self.style.SUCCESS('\n✓ Dry run completed. Run without --dry-run to execute.')
                )
                
        except Exception as e:
            raise CommandError(f'Failed to setup Heroku backups: {str(e)}')

    def _check_heroku_cli(self):
        """Check if Heroku CLI is installed"""
        try:
            result = subprocess.run(
                ['heroku', '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                self.stdout.write(f'✓ Heroku CLI found: {result.stdout.strip()}')
            else:
                raise CommandError('Heroku CLI not working properly')
        except FileNotFoundError:
            raise CommandError(
                'Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli'
            )
        except subprocess.TimeoutExpired:
            raise CommandError('Heroku CLI command timed out')

    def _check_heroku_auth(self):
        """Check if user is authenticated with Heroku"""
        try:
            result = subprocess.run(
                ['heroku', 'auth:whoami'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                user = result.stdout.strip()
                self.stdout.write(f'✓ Authenticated as: {user}')
            else:
                raise CommandError(
                    'Not authenticated with Heroku. Run: heroku auth:login'
                )
        except subprocess.TimeoutExpired:
            raise CommandError('Heroku authentication check timed out')

    def _run_command_safe(self, cmd, ignore_errors=False):
        """Run a command safely with timeout and error handling"""
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            if not ignore_errors and result.returncode != 0:
                self.stdout.write(
                    self.style.ERROR(f'Command failed: {" ".join(cmd)}')
                )
                if result.stderr:
                    self.stdout.write(f'Error: {result.stderr}')
            
            return result
            
        except subprocess.TimeoutExpired:
            raise CommandError(f'Command timed out: {" ".join(cmd)}')
        except Exception as e:
            raise CommandError(f'Command execution failed: {str(e)}')

    def _log_backup_setup(self, app_name, schedule_time, retention_days):
        """Log backup setup to database"""
        try:
            from utils.models import BackupStatus
            from django.utils import timezone
            
            BackupStatus.objects.create(
                backup_type='setup',
                status='success',
                completed_at=timezone.now(),
                metadata={
                    'app_name': app_name,
                    'schedule_time': schedule_time,
                    'retention_days': retention_days,
                    'setup_completed': True
                }
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not log backup setup: {str(e)}')
            )