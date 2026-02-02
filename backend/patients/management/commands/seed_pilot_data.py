from django.core.management.base import BaseCommand
from django.utils import timezone
from authentication.models import User
from patients.models import Patient, MedicalRecord, DentalRecord
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds pilot data for 1st Year Tourism Management students with medical history'

    def handle(self, *args, **options):
        self.stdout.write('Seeding pilot data...')

        # Common data for Tourism students
        course = 'BS Tourism Management'
        year_level = '1st Year'
        
        # Sample names to generate realistic-looking data
        first_names = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
        
        created_count = 0

        for i in range(10):
            # 1. Create User
            fname = first_names[i]
            lname = last_names[i]
            email = f"tourism_student_{i+1}@usc.edu.ph"
            
            # Skip if exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(f'User {email} already exists. Skipping.')
                continue

            user = User.objects.create_user(
                email=email,
                password='password123',
                role='STUDENT',
                first_name=fname,
                last_name=lname,
                username=email,
                
                # Student Profile Fields
                course=course,
                year_level=year_level,
                id_number=f"26100{i:03d}", # e.g., 26100001
                sex=random.choice(['Male', 'Female']),
                birthday=timezone.now().date() - timedelta(days=365*19), # approx 19 years old
                phone=f"0917{random.randint(1000000, 9999999)}",
                address_present="Cebu City",
                
                # Medical Profile (Encrypted fields)
                allergies="Peanuts" if i % 3 == 0 else "None",
                existing_medical_condition="Asthma" if i % 4 == 0 else "None",
                completeSetup=True,
                is_active=True
            )

            # 2. Create Linked Patient Profile (Required for Medical Records)
            patient = Patient.objects.create(
                user=user,
                first_name=fname,
                last_name=lname,
                email=email,
                date_of_birth=user.birthday,
                gender='M' if user.sex == 'Male' else 'F',
                phone_number=user.phone,
                address=user.address_present,
                created_by=user # Self-registered
            )

            # 3. Add Sample Medical Record (for 50% of students)
            if i % 2 == 0:
                MedicalRecord.objects.create(
                    patient=patient,
                    visit_date=timezone.now() - timedelta(days=random.randint(1, 60)),
                    diagnosis="Upper Respiratory Tract Infection" if i % 4 == 0 else "Tension Headache",
                    treatment="Prescribed analgesics and rest.",
                    physical_examination={"bp": "120/80", "temp": "36.5"},
                    created_by=user # Created by system or staff technically, but using user for simplicity here
                )

            # 4. Add Sample Dental Record (for 30% of students)
            if i % 3 == 0:
                DentalRecord.objects.create(
                    patient=patient,
                    visit_date=timezone.now() - timedelta(days=random.randint(1, 90)),
                    procedure_performed="CLEANING",
                    diagnosis="Gingivitis localized",
                    treatment_performed="Oral Prophylaxis",
                    tooth_numbers="All",
                    oral_hygiene_status="GOOD",
                    gum_condition="GINGIVITIS",
                    created_by=user
                )

            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} Tourism Management students with records.'))
