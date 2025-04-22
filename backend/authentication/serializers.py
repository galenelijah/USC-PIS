from rest_framework import serializers
from .models import User
from patients.models import Patient

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2', 'role',
            # Personal Information
            'first_name', 'last_name', 'middle_name', 'id_number',
            'course', 'year_level', 'school', 'sex', 'civil_status',
            'birthday', 'nationality', 'religion', 'address_permanent',
            'address_present', 'phone',
            # Physical Information
            'weight', 'height', 'bmi',
            # Emergency Contacts
            'father_name', 'mother_name', 'emergency_contact',
            'emergency_contact_number',
            # Medical Information
            'illness', 'childhood_diseases', 'special_needs',
            'existing_medical_condition', 'medications', 'allergies',
            'hospitalization_history', 'surgical_procedures',
            # Staff Information
            'department', 'phone_number'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False},
            'department': {'required': False},
            'phone_number': {'required': False},
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.pop('role', User.Role.STUDENT)
        
        # Fields for User model creation (excluding potential Patient fields for now)
        user_fields = ['email', 'password', 'first_name', 'last_name'] 
        user_create_data = {k: validated_data[k] for k in user_fields if k in validated_data}
        user_create_data['username'] = validated_data['email'] # Ensure username is set
        
        # Remaining fields might belong to User or Patient
        other_data = {k: v for k, v in validated_data.items() if k not in user_fields and k != 'email'}

        user = User.objects.create_user(
            role=role,
            **user_create_data
        )
        
        # Update user with other non-patient-specific fields from validated_data
        # (This part might need refinement depending on which fields truly belong only to User)
        user_only_fields = ['middle_name', 'id_number', 'course', 'year_level', 'school', 
                            'sex', 'civil_status', 'nationality', 'religion', 'phone', 
                            'department', 'phone_number', 'completeSetup']
        for field in user_only_fields:
            if field in other_data:
                setattr(user, field, other_data[field])
        user.save() # Save updated user fields

        # If the user is a student, create a linked Patient record
        if user.role == User.Role.STUDENT:
            patient_fields = {
                'user': user,
                'first_name': user.first_name, 
                'last_name': user.last_name,
                'email': user.email,
                # Map other relevant fields from validated_data if available
                # Ensure these fields exist on the Patient model!
                'date_of_birth': validated_data.get('birthday'), # Map birthday to date_of_birth
                'gender': validated_data.get('sex'), # Map sex to gender (needs validation/mapping)
                'phone_number': validated_data.get('phone'), # Map phone to phone_number
                'address': validated_data.get('address_permanent'), # Map permanent address
                # Add other Patient fields if needed and available in validated_data
            }
            # Remove None values to avoid setting nulls if data wasn't provided
            patient_create_data = {k: v for k, v in patient_fields.items() if v is not None}
            
            # Map gender/sex explicitly if needed (e.g., 'Male' -> 'M')
            if 'gender' in patient_create_data:
                sex_map = {'Male': 'M', 'Female': 'F', 'Other': 'O'} # Example mapping
                patient_create_data['gender'] = sex_map.get(patient_create_data['gender'], None)
                if patient_create_data['gender'] is None: # Handle unmappable gender
                    del patient_create_data['gender']
            
            Patient.objects.create(**patient_create_data)
            
            # Set user.completeSetup = True perhaps?
            # user.completeSetup = True
            # user.save()

        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'role', 'completeSetup',
            # Personal Information
            'first_name', 'last_name', 'middle_name', 'id_number',
            'course', 'year_level', 'school', 'sex', 'civil_status',
            'birthday', 'nationality', 'religion', 'address_permanent',
            'address_present', 'phone',
            # Physical Information
            'weight', 'height', 'bmi',
            # Emergency Contacts
            'father_name', 'mother_name', 'emergency_contact',
            'emergency_contact_number',
            # Medical Information
            'illness', 'childhood_diseases', 'special_needs',
            'existing_medical_condition', 'medications', 'allergies',
            'hospitalization_history', 'surgical_procedures',
            # Staff Information
            'department', 'phone_number',
            # Timestamps
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'email', 'created_at', 'updated_at')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError("New passwords don't match")
        return data 