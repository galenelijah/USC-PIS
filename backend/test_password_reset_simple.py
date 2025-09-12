#!/usr/bin/env python
"""
Simple test script to validate password reset flow

How to run:
  python backend/test_password_reset_simple.py
"""
import os
import sys
import django
from django.conf import settings

# Ensure backend settings are used
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APIRequestFactory
from authentication.views import PasswordResetConfirmView

User = get_user_model()


def test_password_reset_flow():
    print("🧪 Testing Password Reset Flow")
    print("=" * 50)

    # 1) Prepare or create a user
    email = 'reset_test_user@usc.edu.ph'
    initial_password = 'InitPassw0rd!'
    user, created = User.objects.get_or_create(email=email, defaults={
        'username': email,
        'role': 'STUDENT'
    })
    if created:
        user.set_password(initial_password)
        user.save()
        print(f"✅ Created test user: {email}")
    else:
        print(f"ℹ️  Using existing user: {email}")

    # 2) Generate token + uid
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/password-reset/{uidb64}/{token}/"
    print(f"🔗 Example reset URL: {reset_url}")

    # 3) Confirm reset via API view
    new_password = 'N3wStrongPass!'
    factory = APIRequestFactory()
    request = factory.post('/api/auth/password-reset/confirm/', {
        'uidb64': uidb64,
        'token': token,
        'password': new_password,
    }, format='json')
    response = PasswordResetConfirmView.as_view()(request)
    print(f"📨 Reset confirm response: {response.status_code} {getattr(response, 'data', {})}")

    # 4) Validate password was changed
    user.refresh_from_db()
    if user.check_password(new_password):
        print("✅ Password changed successfully")
    else:
        print("❌ Password did not change")


if __name__ == '__main__':
    test_password_reset_flow()

