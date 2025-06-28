from django.core.management.base import BaseCommand
from utils.system_monitors import start_all_monitoring
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Start system monitoring services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--daemon',
            action='store_true',
            help='Run monitoring in daemon mode (continuous monitoring)',
        )

    def handle(self, *args, **options):
        try:
            self.stdout.write(
                self.style.SUCCESS('Starting system monitoring services...')
            )
            
            # Start all monitoring systems
            start_all_monitoring()
            
            self.stdout.write(
                self.style.SUCCESS('System monitoring started successfully')
            )
            
            if options['daemon']:
                self.stdout.write(
                    self.style.WARNING('Running in daemon mode. Press Ctrl+C to stop.')
                )
                
                # Keep the process running
                import time
                try:
                    while True:
                        time.sleep(60)  # Check every minute
                except KeyboardInterrupt:
                    self.stdout.write(
                        self.style.SUCCESS('Monitoring stopped by user')
                    )
            
        except Exception as e:
            logger.error(f"Failed to start monitoring: {e}")
            self.stdout.write(
                self.style.ERROR(f'Failed to start monitoring: {e}')
            ) 