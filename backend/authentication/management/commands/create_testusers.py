from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Creates test users for Doctors and Nurses'

    def handle(self, *args, **options):
        # Create a test Doctor
        doctor = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            role='DOCTOR',
            first_name='Test',
            last_name='Doctor',
            department='General Medicine',
            phone_number='1234567890',
            is_active=True,
            completeSetup=True
        )
        self.stdout.write(self.style.SUCCESS(f'Successfully created Doctor user: {doctor.email}'))

        # Create a test Nurse
        nurse = User.objects.create_user(
            email='nurse@test.com',
            password='testpass123',
            role='NURSE',
            first_name='Test',
            last_name='Nurse',
            department='General Care',
            phone_number='0987654321',
            is_active=True,
            completeSetup=True
        )
        self.stdout.write(self.style.SUCCESS(f'Successfully created Nurse user: {nurse.email}')) 