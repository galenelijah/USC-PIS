import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import User

def verify_all_users():
    # Update all users where is_verified is False
    updated_count = User.objects.filter(is_verified=False).update(is_verified=True)
    total_users = User.objects.count()
    
    print(f"Successfully updated {updated_count} users to verified status.")
    print(f"Total users in database: {total_users}")
    print("All users are now verified.")

if __name__ == "__main__":
    verify_all_users()
