"""
Django management command to test the profile completion calculation.
This helps validate that the new calculation algorithm works correctly.

Usage: python manage.py test_profile_completion
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from patients.views import calculate_profile_completion
from patients.models import Patient

User = get_user_model()


class Command(BaseCommand):
    help = 'Test the profile completion calculation for existing users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Test profile completion for a specific user ID',
        )
        parser.add_argument(
            '--all-users',
            action='store_true',
            help='Test profile completion for all users',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        all_users = options.get('all_users')
        
        self.stdout.write(
            self.style.SUCCESS('🧪 Testing Profile Completion Calculation')
        )
        
        if user_id:
            # Test specific user
            try:
                user = User.objects.get(id=user_id)
                self.test_user_profile_completion(user)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ User with ID {user_id} not found')
                )
        elif all_users:
            # Test all users
            users = User.objects.all()
            self.stdout.write(f"Testing profile completion for {users.count()} users:")
            
            for user in users:
                self.test_user_profile_completion(user, brief=True)
        else:
            # Test a few sample users
            users = User.objects.all()[:5]
            self.stdout.write("Testing profile completion for sample users:")
            
            for user in users:
                self.test_user_profile_completion(user)

    def test_user_profile_completion(self, user, brief=False):
        """Test profile completion for a specific user."""
        try:
            # Try to get the user's patient record
            patient = None
            try:
                patient = Patient.objects.get(user=user)
            except Patient.DoesNotExist:
                pass
            
            # Calculate profile completion
            completion_percentage = calculate_profile_completion(user, patient)
            
            if brief:
                self.stdout.write(
                    f"   👤 {user.email} ({user.role}): {completion_percentage}%"
                )
            else:
                self.stdout.write(f"\n{'='*60}")
                self.stdout.write(f"👤 User: {user.email} ({user.role})")
                self.stdout.write(f"📊 Profile Completion: {completion_percentage}%")
                
                # Show field details
                self.show_field_details(user)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error testing user {user.email}: {e}')
            )

    def show_field_details(self, user):
        """Show details of which fields are completed and which are missing."""
        
        def field_has_value(obj, field_name):
            """Check if a field has a meaningful value."""
            try:
                field_value = getattr(obj, field_name, None)
                if field_value is None:
                    return False
                str_value = str(field_value).strip()
                return len(str_value) > 0 and str_value.lower() not in ['none', 'null', '']
            except:
                return False
        
        # Essential fields
        essential_fields = [
            'first_name', 'last_name', 'email', 'birthday', 'sex', 
            'address_present', 'emergency_contact', 'emergency_contact_number'
        ]
        
        # Important fields
        important_fields = [
            'middle_name', 'id_number', 'course', 'year_level', 'school',
            'civil_status', 'nationality', 'phone'
        ]
        
        # Medical fields
        medical_fields = [
            'allergies', 'existing_medical_condition', 'medications',
            'weight', 'height', 'father_name', 'mother_name'
        ]
        
        self.stdout.write("\n🔍 Field Details:")
        
        # Check essential fields
        self.stdout.write("   📋 Essential Fields (3 points each):")
        for field in essential_fields:
            status = "✅" if field_has_value(user, field) else "❌"
            value = getattr(user, field, None)
            display_value = str(value)[:30] + "..." if value and len(str(value)) > 30 else str(value)
            self.stdout.write(f"      {status} {field}: {display_value}")
        
        # Check important fields
        self.stdout.write("   📝 Important Fields (2 points each):")
        for field in important_fields:
            status = "✅" if field_has_value(user, field) else "❌"
            value = getattr(user, field, None)
            display_value = str(value)[:30] + "..." if value and len(str(value)) > 30 else str(value)
            self.stdout.write(f"      {status} {field}: {display_value}")
        
        # Check medical fields
        self.stdout.write("   💊 Medical Fields (2 points each):")
        for field in medical_fields:
            status = "✅" if field_has_value(user, field) else "❌"
            value = getattr(user, field, None)
            display_value = str(value)[:30] + "..." if value and len(str(value)) > 30 else str(value)
            self.stdout.write(f"      {status} {field}: {display_value}")
        
        # Calculate completion summary
        essential_completed = sum(1 for field in essential_fields if field_has_value(user, field))
        important_completed = sum(1 for field in important_fields if field_has_value(user, field))
        medical_completed = sum(1 for field in medical_fields if field_has_value(user, field))
        
        self.stdout.write(f"\n📈 Summary:")
        self.stdout.write(f"   Essential: {essential_completed}/{len(essential_fields)} ({(essential_completed/len(essential_fields))*100:.1f}%)")
        self.stdout.write(f"   Important: {important_completed}/{len(important_fields)} ({(important_completed/len(important_fields))*100:.1f}%)")
        self.stdout.write(f"   Medical: {medical_completed}/{len(medical_fields)} ({(medical_completed/len(medical_fields))*100:.1f}%)")