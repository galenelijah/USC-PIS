"""
Test the new automatic role assignment in registration system
"""

from django.core.management.base import BaseCommand
from authentication.serializers import UserRegistrationSerializer
from authentication.models import User

class Command(BaseCommand):
    help = 'Test automatic role assignment in registration'

    def handle(self, *args, **options):
        self.stdout.write('=== AUTOMATIC ROLE ASSIGNMENT TEST ===')
        
        # Test cases
        test_cases = [
            {
                'email': '21100727@usc.edu.ph',
                'expected_role': 'STUDENT',
                'description': 'Student email (your actual email)'
            },
            {
                'email': 'elfabian@usc.edu.ph', 
                'expected_role': 'STAFF',
                'description': 'Faculty email (your adviser)'
            },
            {
                'email': 'john.doe123@usc.edu.ph',
                'expected_role': 'STUDENT',
                'description': 'Student email with numbers'
            },
            {
                'email': 'jane.smith@usc.edu.ph',
                'expected_role': 'STAFF',
                'description': 'Staff email (letters only)'
            },
            {
                'email': 'admin2023@usc.edu.ph',
                'expected_role': 'STUDENT',
                'description': 'Admin email with year (detected as student)'
            },
            {
                'email': 'professor@usc.edu.ph',
                'expected_role': 'STAFF',
                'description': 'Professor email (letters only)'
            }
        ]
        
        passed = 0
        total = len(test_cases)
        
        for i, case in enumerate(test_cases, 1):
            self.stdout.write(f'\nTest {i}/{total}: {case["description"]}')
            self.stdout.write(f'Email: {case["email"]}')
            
            # Create test data
            test_data = {
                'email': case['email'],
                'password': 'TestPassword123!',
                'password2': 'TestPassword123!'
            }
            
            # Test serializer
            serializer = UserRegistrationSerializer(data=test_data)
            
            if serializer.is_valid():
                # Check role assignment
                assigned_role = serializer._determine_role_from_email(case['email'])
                
                if assigned_role == case['expected_role']:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  PASS: Correctly assigned {assigned_role} role'
                        )
                    )
                    passed += 1
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  FAIL: Expected {case["expected_role"]}, got {assigned_role}'
                        )
                    )
            else:
                self.stdout.write(
                    self.style.ERROR(f'  FAIL: Validation error: {serializer.errors}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(f'TEST RESULTS: {passed}/{total} tests passed')
        self.stdout.write(f'Success rate: {(passed/total)*100:.1f}%')
        
        if passed == total:
            self.stdout.write(
                self.style.SUCCESS('\nAUTOMATIC ROLE ASSIGNMENT: FULLY FUNCTIONAL!')
            )
            self.stdout.write('\nRegistration changes summary:')
            self.stdout.write('- Removed role selection dropdown from frontend')
            self.stdout.write('- Added automatic role detection based on email pattern')
            self.stdout.write('- Students: emails with numbers (e.g., 21100727@usc.edu.ph)')
            self.stdout.write('- Staff/Faculty: emails with only letters (e.g., elfabian@usc.edu.ph)')
            self.stdout.write('- Admins can later change roles manually if needed')
        else:
            self.stdout.write(
                self.style.WARNING(f'\nSome tests failed - check implementation')
            )