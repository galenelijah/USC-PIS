from rest_framework import serializers
from .models import User
from patients.models import Patient

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    middle_name = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True)
    course = serializers.CharField(required=False, allow_blank=True)
    year_level = serializers.CharField(required=False, allow_blank=True)
    school = serializers.CharField(required=False, allow_blank=True)
    sex = serializers.CharField(required=False, allow_blank=True)
    civil_status = serializers.CharField(required=False, allow_blank=True)
    birthday = serializers.DateField(required=False, allow_null=True)
    nationality = serializers.CharField(required=False, allow_blank=True)
    religion = serializers.CharField(required=False, allow_blank=True)
    address_permanent = serializers.CharField(required=False, allow_blank=True)
    address_present = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    weight = serializers.CharField(required=False, allow_blank=True)
    height = serializers.CharField(required=False, allow_blank=True)
    bmi = serializers.CharField(required=False, allow_blank=True)
    father_name = serializers.CharField(required=False, allow_blank=True)
    mother_name = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_number = serializers.CharField(required=False, allow_blank=True)
    illness = serializers.CharField(required=False, allow_blank=True)
    childhood_diseases = serializers.CharField(required=False, allow_blank=True)
    special_needs = serializers.CharField(required=False, allow_blank=True)
    existing_medical_condition = serializers.CharField(required=False, allow_blank=True)
    medications = serializers.CharField(required=False, allow_blank=True)
    allergies = serializers.CharField(required=False, allow_blank=True)
    hospitalization_history = serializers.CharField(required=False, allow_blank=True)
    surgical_procedures = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2', 'role',
            'first_name', 'last_name', 'middle_name', 'id_number',
            'course', 'year_level', 'school', 'sex', 'civil_status',
            'birthday', 'nationality', 'religion', 'address_permanent',
            'address_present', 'phone',
            'weight', 'height', 'bmi',
            'father_name', 'mother_name', 'emergency_contact',
            'emergency_contact_number',
            'illness', 'childhood_diseases', 'special_needs',
            'existing_medical_condition', 'medications', 'allergies',
            'hospitalization_history', 'surgical_procedures',
            'department', 'phone_number'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False},
            'department': {'required': False},
            'phone_number': {'required': False},
            # All other fields are not required
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        # Extract and remove password2 from validated data
        validated_data.pop('password2', None)
        
        # Extract role or use default STUDENT
        role = validated_data.pop('role', User.Role.STUDENT)
        
        # Get email and password
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        try:
            # Create user with minimal required fields
            user = User.objects.create_user(
                email=email,
                username=email,  # Set username to email
                password=password,
                role=role,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                completeSetup=False  # Explicitly set to False
            )
            
            # Success! Return the user
            return user
        except Exception as e:
            import traceback
            print(f"Error creating user: {str(e)}")
            print(traceback.format_exc())
            raise  # Re-raise to let the view handle it

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

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    # password2 = serializers.CharField(write_only=True, required=True)

    # def validate(self, data):
    #     if data['password'] != data['password2']:
    #         raise serializers.ValidationError("Passwords must match.")
    #     return data 