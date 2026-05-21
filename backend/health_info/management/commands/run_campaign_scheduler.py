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
                    # Notifications are now handled by the post_save signal in models.py
                    
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
                    # Notifications are now handled by the post_save signal in models.py
                    
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