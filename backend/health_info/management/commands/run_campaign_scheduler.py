from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from health_info.models import HealthCampaign
from notifications.models import Notification
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run campaign scheduler to activate/deactivate campaigns based on schedule'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Process campaigns that should be activated
        scheduled_campaigns = HealthCampaign.objects.filter(
            status='SCHEDULED',
            start_date__lte=now
        )
        
        activated_count = 0
        for campaign in scheduled_campaigns:
            if not dry_run:
                with transaction.atomic():
                    campaign.status = 'ACTIVE'
                    campaign.save()
                    
                    # Send notification to all users about new active campaign
                    self.send_campaign_notification(campaign, 'activated')
                    
            activated_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'{"Would activate" if dry_run else "Activated"} campaign: {campaign.title}')
            )
        
        # Process campaigns that should be completed
        active_campaigns = HealthCampaign.objects.filter(
            status='ACTIVE',
            end_date__lte=now
        )
        
        completed_count = 0
        for campaign in active_campaigns:
            if not dry_run:
                with transaction.atomic():
                    campaign.status = 'COMPLETED'
                    campaign.save()
                    
                    # Send notification about campaign completion
                    self.send_campaign_notification(campaign, 'completed')
                    
            completed_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'{"Would complete" if dry_run else "Completed"} campaign: {campaign.title}')
            )
        
        # Process featured campaigns that should be unfeatured
        featured_campaigns = HealthCampaign.objects.filter(
            featured_until__isnull=False,
            featured_until__lte=now
        )
        
        unfeatured_count = 0
        for campaign in featured_campaigns:
            if not dry_run:
                campaign.featured_until = None
                campaign.save()
                
            unfeatured_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'{"Would unfeature" if dry_run else "Unfeatured"} campaign: {campaign.title}')
            )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'Campaign scheduler completed: '
                f'{activated_count} activated, '
                f'{completed_count} completed, '
                f'{unfeatured_count} unfeatured'
            )
        )

    def send_campaign_notification(self, campaign, action):
        """Send notifications to users about campaign status changes"""
        try:
            if action == 'activated':
                # Send to all active users
                users = User.objects.filter(is_active=True)
                title = f"New Health Campaign: {campaign.title}"
                message = f"A new health campaign '{campaign.title}' is now active. Check it out in the Health Information section!"
                notification_type = "campaign_activated"
                
            elif action == 'completed':
                # Send to users who engaged with the campaign
                users = User.objects.filter(
                    is_active=True,
                    campaign_feedback__campaign=campaign
                ).distinct()
                title = f"Campaign Completed: {campaign.title}"
                message = f"The health campaign '{campaign.title}' has been completed. Thank you for your participation!"
                notification_type = "campaign_completed"
                
            else:
                return
            
            # Create notifications for users
            notifications = []
            for user in users:
                notifications.append(
                    Notification(
                        user=user,
                        title=title,
                        message=message,
                        notification_type=notification_type
                    )
                )
            
            # Bulk create notifications for efficiency
            if notifications:
                Notification.objects.bulk_create(notifications, batch_size=100)
                logger.info(f'Sent {len(notifications)} notifications for campaign {action}: {campaign.title}')
                
        except Exception as e:
            logger.error(f'Error sending campaign notifications: {e}')
            # Don't let notification errors stop the scheduling process
            pass