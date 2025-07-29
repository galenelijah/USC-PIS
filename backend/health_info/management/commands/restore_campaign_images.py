"""
Management command to restore default campaign images after Heroku deployment
Usage: python manage.py restore_campaign_images
"""

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from health_info.models import HealthCampaign, CampaignTemplate
import requests
import os

class Command(BaseCommand):
    help = 'Restore default campaign images from URLs or reset broken references'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting campaign image restoration...'))
        
        # Clear broken image references
        campaigns_updated = 0
        campaigns = HealthCampaign.objects.all()
        
        for campaign in campaigns:
            updated = False
            
            # Check if banner image file exists
            if campaign.banner_image:
                try:
                    if not campaign.banner_image.storage.exists(campaign.banner_image.name):
                        self.stdout.write(f'Clearing broken banner for: {campaign.title}')
                        campaign.banner_image = None
                        updated = True
                except:
                    campaign.banner_image = None
                    updated = True
            
            # Check thumbnail image
            if campaign.thumbnail_image:
                try:
                    if not campaign.thumbnail_image.storage.exists(campaign.thumbnail_image.name):
                        self.stdout.write(f'Clearing broken thumbnail for: {campaign.title}')
                        campaign.thumbnail_image = None
                        updated = True
                except:
                    campaign.thumbnail_image = None
                    updated = True
            
            # Check pubmat image
            if campaign.pubmat_image:
                try:
                    if not campaign.pubmat_image.storage.exists(campaign.pubmat_image.name):
                        self.stdout.write(f'Clearing broken pubmat for: {campaign.title}')
                        campaign.pubmat_image = None
                        updated = True
                except:
                    campaign.pubmat_image = None
                    updated = True
            
            if updated:
                campaign.save()
                campaigns_updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {campaigns_updated} campaigns')
        )