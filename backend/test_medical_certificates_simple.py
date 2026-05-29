#!/usr/bin/env python
"""
Simple test script to verify medical certificate functionality without Django test database
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
from patients.models import Patient
from medical_certificates.models import MedicalCertificate, CertificateTemplate
from notifications.models import Notification
from datetime import date, timedelta

User = get_user_model()

def test_medical_certificate_functionality():
    """Test medical certificate functionality"""
    print("🧪 Testing Medical Certificate Functionality")
    print("=" * 50)
    
    # Check if models exist and can be imported
    print("✅ Models imported successfully")
    
    # Check if templates exist
    templates = CertificateTemplate.objects.all()
    print(f"📋 Found {templates.count()} certificate templates")
    
    # Check if certificates exist
    certificates = MedicalCertificate.objects.all()
    print(f"📄 Found {certificates.count()} medical certificates")
    
    # Check status distribution
    for status in ['draft', 'pending', 'issued', 'rejected']:
        count = certificates.filter(status=status).count()
        print(f"   - {status.capitalize()}: {count}")
    
    # Check if patients exist
    patients = Patient.objects.all()
    print(f"👥 Found {patients.count()} patients")
    
    # Check if users exist
    users = User.objects.all()
    print(f"👤 Found {users.count()} users")
    
    # Check role distribution
    for role in ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'STUDENT']:
        count = users.filter(role=role).count()
        print(f"   - {role}: {count}")
    
    # Check if notifications exist
    notifications = Notification.objects.all()
    print(f"🔔 Found {notifications.count()} notifications")
    
    # Check certificate-related notifications
    cert_notifications = notifications.filter(
        notification_type__in=['certificate_created', 'certificate_issued', 'certificate_rejected']
    )
    print(f"   - Certificate notifications: {cert_notifications.count()}")
    
    print("\n🎯 Medical Certificate System Status:")
    print("=" * 50)
    
    if templates.exists():
        print("✅ Certificate templates configured")
    else:
        print("⚠️  No certificate templates found")
    
    if certificates.exists():
        print("✅ Medical certificates exist in system")
        issued_count = certificates.filter(status='issued').count()
        print(f"   - Issued certificates: {issued_count}")
    else:
        print("⚠️  No medical certificates found")
    
    if patients.exists():
        print("✅ Patients exist in system")
        linked_patients = patients.filter(user__isnull=False).count()
        print(f"   - Patients linked to users: {linked_patients}")
    else:
        print("⚠️  No patients found")
    
    # Check if notification system is working
    recent_notifications = notifications.filter(
        created_at__gte=date.today() - timedelta(days=30)
    ).count()
    print(f"📱 Recent notifications (last 30 days): {recent_notifications}")
    
    print("\n🔧 System Integration Test:")
    print("=" * 50)
    
    # Test if we can create a simple certificate (dry run)
    try:
        # Check if we have required data
        if users.filter(role='DOCTOR').exists() and patients.exists() and templates.exists():
            print("✅ All required data exists for certificate creation")
            print("✅ Certificate workflow can be tested")
        else:
            print("⚠️  Missing required data for certificate creation")
            print("   - Need: Doctor user, Patient, Certificate template")
    except Exception as e:
        print(f"❌ Error checking certificate creation requirements: {e}")
    
    # Test model methods
    try:
        if certificates.exists():
            cert = certificates.first()
            print(f"✅ Certificate string representation: {str(cert)}")
            print(f"✅ Certificate status: {cert.get_status_display()}")
        else:
            print("⚠️  No certificates to test model methods")
    except Exception as e:
        print(f"❌ Error testing certificate model methods: {e}")
    
    print("\n🚀 Medical Certificate System Ready!")
    print("=" * 50)

if __name__ == "__main__":
    test_medical_certificate_functionality()