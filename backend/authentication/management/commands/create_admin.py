"""
Create a superuser with Admin role for USC-PIS system
"""

from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Create a superuser with Admin role'

    def handle(self, *args, **options):
        self.stdout.write('=== CREATING ADMIN SUPERUSER ===')
        
        # Admin credentials
        email = 'admin.super@usc.edu.ph'
        password = 'SuperAdmin2025!'
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User {email} already exists - resetting password')
            )
            # Reset password for existing user
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Password reset successfully!')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Role: {user.role}')
            return
        
        try:
            # Create superuser
            superuser = User.objects.create_superuser(
                email=email,
                password=password,
                first_name='Super',
                last_name='Admin',
                role=User.Role.ADMIN,
                completeSetup=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Superuser created successfully!')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Role: {superuser.role}')
            self.stdout.write(f'Is Staff: {superuser.is_staff}')
            self.stdout.write(f'Is Superuser: {superuser.is_superuser}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )