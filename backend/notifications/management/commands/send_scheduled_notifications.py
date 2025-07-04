from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.services import NotificationService
from notifications.signals import create_default_templates


class Command(BaseCommand):
    help = 'Send scheduled notifications and retry failed ones'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--retry-failed',
            action='store_true',
            help='Also retry failed notifications',
        )
        parser.add_argument(
            '--create-templates',
            action='store_true',
            help='Create default notification templates',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(f'Starting notification processing at {timezone.now()}')
        )
        
        # Create default templates if requested
        if options['create_templates']:
            self.stdout.write('Creating default notification templates...')
            created_count = create_default_templates()
            self.stdout.write(
                self.style.SUCCESS(f'Created {created_count} default templates')
            )
        
        # Send scheduled notifications
        self.stdout.write('Sending scheduled notifications...')
        scheduled_results = NotificationService.send_scheduled_notifications()
        
        success_count = len([r for r in scheduled_results if 'error' not in r])
        error_count = len([r for r in scheduled_results if 'error' in r])
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Processed {len(scheduled_results)} scheduled notifications: '
                f'{success_count} successful, {error_count} failed'
            )
        )
        
        # Retry failed notifications if requested
        if options['retry_failed']:
            self.stdout.write('Retrying failed notifications...')
            retry_results = NotificationService.retry_failed_notifications()
            
            retry_success = len([r for r in retry_results if 'error' not in r])
            retry_error = len([r for r in retry_results if 'error' in r])
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Processed {len(retry_results)} retry attempts: '
                    f'{retry_success} successful, {retry_error} failed'
                )
            )
        
        # Summary
        total_processed = len(scheduled_results)
        if options['retry_failed']:
            total_processed += len(retry_results)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Notification processing completed. Total processed: {total_processed}'
            )
        ) 