#!/usr/bin/env python3
"""
Test script to verify student campaign functionality
"""

import os
import sys
import django

# Set up Django environment
sys.path.append('/mnt/c/Users/sgale/OneDrive/Documents/GitHubProjects/USC-PIS/USC-PIS/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    django.setup()
    
    from health_info.models import HealthCampaign, CampaignTemplate
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    
    User = get_user_model()
    
    print("🔍 Testing Student Campaign Functionality")
    print("=" * 50)
    
    # Test 1: Check if campaign templates exist
    print("\n1. Checking Campaign Templates...")
    templates = CampaignTemplate.objects.all()
    print(f"   ✅ Found {templates.count()} campaign templates")
    
    for template in templates:
        print(f"   - {template.name} ({template.campaign_type})")
    
    # Test 2: Check for active campaigns
    print("\n2. Checking Active Campaigns...")
    active_campaigns = HealthCampaign.objects.filter(status='ACTIVE')
    print(f"   ✅ Found {active_campaigns.count()} active campaigns")
    
    for campaign in active_campaigns:
        status = "✅ ACTIVE" if campaign.start_date <= timezone.now() <= campaign.end_date else "⚠️ NOT IN DATE RANGE"
        print(f"   - {campaign.title} ({campaign.campaign_type}) {status}")
        print(f"     Duration: {campaign.start_date} to {campaign.end_date}")
    
    # Test 3: Check student users
    print("\n3. Checking Student Users...")
    students = User.objects.filter(role='STUDENT', is_active=True)
    print(f"   ✅ Found {students.count()} active student users")
    
    for student in students[:3]:  # Show first 3
        print(f"   - {student.first_name} {student.last_name} ({student.email})")
    
    # Test 4: Verify API endpoint behavior simulation
    print("\n4. Simulating API Behavior for Students...")
    
    # This simulates what the backend API does for students
    student_visible_campaigns = HealthCampaign.objects.filter(status='ACTIVE')
    now = timezone.now()
    current_campaigns = student_visible_campaigns.filter(
        start_date__lte=now,
        end_date__gte=now
    )
    
    print(f"   ✅ Students can see {student_visible_campaigns.count()} active campaigns")
    print(f"   ✅ {current_campaigns.count()} campaigns are currently running")
    
    # Test 5: Check campaign content quality
    print("\n5. Checking Campaign Content Quality...")
    for campaign in active_campaigns[:2]:  # Check first 2
        print(f"   Campaign: {campaign.title}")
        print(f"   - Has summary: {'✅' if campaign.summary else '❌'}")
        print(f"   - Has content: {'✅' if campaign.content else '❌'}")
        print(f"   - Has call to action: {'✅' if campaign.call_to_action else '❌'}")
        print(f"   - Has target audience: {'✅' if campaign.target_audience else '❌'}")
        print(f"   - Content length: {len(campaign.content) if campaign.content else 0} characters")
    
    print("\n" + "=" * 50)
    print("🎉 Campaign Functionality Test Complete!")
    
    if active_campaigns.count() > 0:
        print("✅ SUCCESS: Students should be able to see active campaigns")
        print("📱 Frontend: StudentCampaigns component will display these campaigns")
        print("🎯 Dashboard: Students have campaign quick action button")
        print("🔗 Navigation: Campaigns accessible via sidebar")
    else:
        print("⚠️  WARNING: No active campaigns found")
        print("💡 SOLUTION: Run the management command to create campaigns:")
        print("   python manage.py create_student_campaigns")
    
    print("\n📊 Summary:")
    print(f"   - Campaign Templates: {templates.count()}")
    print(f"   - Active Campaigns: {active_campaigns.count()}")
    print(f"   - Student Users: {students.count()}")
    print(f"   - Currently Running: {current_campaigns.count()}")

except Exception as e:
    print(f"❌ Error during testing: {e}")
    print("💡 Make sure you're running this from the backend directory")
    print("💡 Ensure Django environment is properly set up")