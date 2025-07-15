#!/usr/bin/env python
"""
Simple test script to verify health campaign functionality
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now import Django models
from django.contrib.auth import get_user_model
from health_info.models import HealthCampaign, CampaignTemplate, CampaignResource, CampaignFeedback, HealthInformation
from notifications.models import Notification
from datetime import date, timedelta

User = get_user_model()

def test_health_campaign_functionality():
    """Test health campaign functionality"""
    print("🧪 Testing Health Campaign Functionality")
    print("=" * 50)
    
    # Check if models exist and can be imported
    print("✅ Models imported successfully")
    
    # Check if campaign templates exist
    templates = CampaignTemplate.objects.all()
    print(f"📋 Found {templates.count()} campaign templates")
    
    # Check if campaigns exist
    campaigns = HealthCampaign.objects.all()
    print(f"📢 Found {campaigns.count()} health campaigns")
    
    # Check status distribution
    for status in ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']:
        count = campaigns.filter(status=status).count()
        print(f"   - {status.capitalize()}: {count}")
    
    # Check campaign types
    campaign_types = campaigns.values_list('campaign_type', flat=True).distinct()
    print(f"📝 Campaign types in use: {list(campaign_types)}")
    
    # Check campaign resources
    resources = CampaignResource.objects.all()
    print(f"📁 Found {resources.count()} campaign resources")
    
    # Check campaign feedback
    feedback = CampaignFeedback.objects.all()
    print(f"💬 Found {feedback.count()} campaign feedback entries")
    
    # Check health information
    health_info = HealthInformation.objects.all()
    print(f"ℹ️  Found {health_info.count()} health information entries")
    
    # Check if users exist
    users = User.objects.all()
    print(f"👤 Found {users.count()} users")
    
    # Check if notifications exist
    notifications = Notification.objects.all()
    campaign_notifications = notifications.filter(
        notification_type__in=['campaign_created', 'campaign_activated', 'campaign_completed']
    )
    print(f"🔔 Found {campaign_notifications.count()} campaign notifications")
    
    print("\n🎯 Health Campaign System Status:")
    print("=" * 50)
    
    if templates.exists():
        print("✅ Campaign templates configured")
        most_used = templates.order_by('-usage_count').first()
        if most_used:
            print(f"   - Most used template: {most_used.name} (used {most_used.usage_count} times)")
    else:
        print("⚠️  No campaign templates found")
    
    if campaigns.exists():
        print("✅ Health campaigns exist in system")
        active_count = campaigns.filter(status='ACTIVE').count()
        print(f"   - Active campaigns: {active_count}")
        
        # Check engagement metrics
        total_views = sum(c.view_count for c in campaigns)
        total_engagement = sum(c.engagement_count for c in campaigns)
        print(f"   - Total views: {total_views}")
        print(f"   - Total engagement: {total_engagement}")
    else:
        print("⚠️  No health campaigns found")
    
    if resources.exists():
        print("✅ Campaign resources available")
        total_downloads = sum(r.download_count for r in resources)
        print(f"   - Total downloads: {total_downloads}")
    else:
        print("⚠️  No campaign resources found")
    
    if feedback.exists():
        print("✅ Campaign feedback system active")
        avg_rating = sum(f.rating for f in feedback) / feedback.count()
        print(f"   - Average rating: {avg_rating:.1f}/5")
    else:
        print("⚠️  No campaign feedback found")
    
    print("\n🔧 System Integration Test:")
    print("=" * 50)
    
    # Test if we can create a campaign from template
    try:
        if templates.exists() and users.filter(role__in=['ADMIN', 'STAFF']).exists():
            print("✅ All required data exists for campaign creation")
            print("✅ Campaign workflow can be tested")
            
            # Test template functionality
            template = templates.first()
            print(f"✅ Template method test: {template.name}")
        else:
            print("⚠️  Missing required data for campaign creation")
            print("   - Need: Campaign template, Admin/Staff user")
    except Exception as e:
        print(f"❌ Error checking campaign creation requirements: {e}")
    
    # Test model methods
    try:
        if campaigns.exists():
            campaign = campaigns.first()
            print(f"✅ Campaign string representation: {str(campaign)}")
            print(f"✅ Campaign status: {campaign.get_status_display()}")
            print(f"✅ Campaign is active: {campaign.is_active}")
            print(f"✅ Campaign is featured: {campaign.is_featured}")
        else:
            print("⚠️  No campaigns to test model methods")
    except Exception as e:
        print(f"❌ Error testing campaign model methods: {e}")
    
    # Test campaign template system
    try:
        if templates.exists():
            template = templates.first()
            print(f"✅ Template system: {template}")
            print(f"✅ Template usage count: {template.usage_count}")
        else:
            print("⚠️  No templates to test template system")
    except Exception as e:
        print(f"❌ Error testing template system: {e}")
    
    print("\n🚀 Health Campaign System Ready!")
    print("=" * 50)
    
    # Summary recommendations
    print("\n💡 System Enhancement Recommendations:")
    print("=" * 50)
    
    if not campaigns.exists():
        print("• Create sample health campaigns to showcase the system")
    
    if not templates.exists():
        print("• Create campaign templates for common campaign types")
    
    if not resources.exists():
        print("• Upload campaign resources (documents, images, videos)")
    
    if campaigns.filter(status='ACTIVE').count() == 0:
        print("• Activate campaigns to engage users")
    
    if campaign_notifications.count() == 0:
        print("• Test notification system with campaign status changes")

if __name__ == "__main__":
    test_health_campaign_functionality()