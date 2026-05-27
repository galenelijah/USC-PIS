from rest_framework import serializers
from .models import User, AuditLog
from patients.models import Patient
from .validators import email_validator, strict_email_validator, password_validator
import re

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
            'email', 'password', 'password2', 'role', 'is_verified',
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
            'department': {'required': False},
            'phone_number': {'required': False},
            'role': {'required': False, 'allow_blank': True},
            # All other fields are not required
        }
    
    def validate_email(self, value):
        """Validate email with strict USC domain requirement for new registrations."""
        if not value:
            raise serializers.ValidationError("Email is required")
        
        # Use strict email validator for new registrations
        error_message = strict_email_validator(value)
        if error_message:
            raise serializers.ValidationError(error_message)
        
        return value.lower().strip()

    def validate_phone(self, value):
        if value:
            clean_value = re.sub(r'[\s\-\(\)\+]', '', value)
            if not clean_value.isdigit():
                raise serializers.ValidationError("Phone number must contain only digits.")
            if not (7 <= len(clean_value) <= 15):
                raise serializers.ValidationError("Phone number must be between 7 and 15 digits.")
        return value

    def validate_emergency_contact_number(self, value):
        if value:
            clean_value = re.sub(r'[\s\-\(\)\+]', '', value)
            if not clean_value.isdigit():
                raise serializers.ValidationError("Emergency contact number must contain only digits.")
            if not (7 <= len(clean_value) <= 15):
                raise serializers.ValidationError("Emergency contact number must be between 7 and 15 digits.")
        return value

    def _determine_role_from_email(self, email):
        """
        Determine user role based on SafeEmail whitelist or automated extraction.
        Numeric prefix -> STUDENT (e.g., 21100727@usc.edu.ph)
        Alphabetical/Mixed prefix -> FACULTY (e.g., gscaballero@usc.edu.ph)
        Client-provided role preference is ignored for automated security gating.
        """
        if not email:
            return User.Role.STUDENT
        
        # 1. Check SafeEmail list for pre-authorized roles (Highest Priority)
        try:
            from .models import SafeEmail
            safe_entry = SafeEmail.objects.filter(email=email, is_active=True).first()
            if safe_entry:
                return safe_entry.role
        except Exception:
            pass

        # 2. Automated Role Resolution: Prefix analysis
        prefix = email.split('@')[0]
        
        # If prefix is purely numeric, it's a student ID
        if re.match(r'^\d+$', prefix):
            return User.Role.STUDENT
        
        # If prefix contains any letters, default to FACULTY context
        # (Admins can later upgrade to DOCTOR, NURSE, etc. if needed)
        return User.Role.FACULTY

    def validate_password(self, value):
        """Validate password with enhanced security checks."""
        if not value:
            raise serializers.ValidationError("Password is required")
        
        # Use enhanced password validator
        error_messages = password_validator.validate(value)
        if error_messages:
            # Return the first error message for better UX
            raise serializers.ValidationError(error_messages[0])
        
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def _extract_id_from_email(self, email):
        """
        Securely extract the institutional ID number from the email prefix.
        Example: '21100727@usc.edu.ph' -> '21100727'
        Example: '6090146@usc.edu.ph' -> '6090146'
        """
        if not email:
            return None
        
        # Extract prefix before @usc.edu.ph
        prefix = email.split('@')[0]
        
        # Regex to capture purely numeric IDs typically used for students
        match = re.match(r'^(\d+)$', prefix)
        if match:
            return match.group(1)
        
        return None

    def create(self, validated_data):
        # Extract and remove password2 from validated data
        validated_data.pop('password2', None)
        
        # Get email and determine role automatically
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        # Automated Role Gating: Ignore any role field passed from client
        role = self._determine_role_from_email(email)
        
        # Automated ID Extraction: Parse institutional ID from email prefix
        # This prevents manual typing and ensures absolute data consistency
        id_number = self._extract_id_from_email(email)
        
        # Force remove role and id_number from validated_data to prevent injection
        validated_data.pop('role', None)
        validated_data.pop('id_number', None)
        
        try:
            # Create user with programmatically assigned role and ID
            user = User.objects.create_user(
                email=email,
                username=email,
                password=password,
                role=role,
                id_number=id_number, # Automatically assigned
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                completeSetup=False
            )
            
            return user
        except Exception as e:
            import traceback
            print(f"Error creating user: {str(e)}")
            print(traceback.format_exc())
            raise

class UserProfileSerializer(serializers.ModelSerializer):
    completeSetup = serializers.SerializerMethodField()

    def get_completeSetup(self, obj):
        # Always return a boolean, defaulting to False if not set
        return bool(getattr(obj, 'completeSetup', False))

    def validate_phone(self, value):
        if value:
            clean_value = re.sub(r'[\s\-\(\)\+]', '', value)
            if not clean_value.isdigit():
                raise serializers.ValidationError("Phone number must contain only digits.")
            if not (7 <= len(clean_value) <= 15):
                raise serializers.ValidationError("Phone number must be between 7 and 15 digits.")
        return value

    def validate_emergency_contact_number(self, value):
        if value:
            clean_value = re.sub(r'[\s\-\(\)\+]', '', value)
            if not clean_value.isdigit():
                raise serializers.ValidationError("Emergency contact number must contain only digits.")
            if not (7 <= len(clean_value) <= 15):
                raise serializers.ValidationError("Emergency contact number must be between 7 and 15 digits.")
        return value

    class Meta:
        model = User
        fields = (
            'id', 'email', 'role', 'requested_role', 'completeSetup', 'is_active', 'is_verified',
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
        read_only_fields = ('id', 'email', 'role', 'id_number', 'created_at', 'updated_at')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)
    
    def validate_new_password(self, value):
        """Validate new password with enhanced security checks."""
        if not value:
            raise serializers.ValidationError("New password is required")
        
        # Use enhanced password validator
        error_messages = password_validator.validate(value)
        if error_messages:
            # Return the first error message for better UX
            raise serializers.ValidationError(error_messages[0])
        
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError("New passwords don't match")
        return data

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email with lenient checking for existing users."""
        if not value:
            raise serializers.ValidationError("Email is required")
        
        # Use lenient email validator for password reset (allows existing users)
        error_message = email_validator(value, check_existing=True)
        if error_message:
            raise serializers.ValidationError(error_message)
        
        return value.lower().strip()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    # password2 = serializers.CharField(write_only=True, required=True)
    
    def validate_password(self, value):
        """Validate password with enhanced security checks."""
        if not value:
            raise serializers.ValidationError("Password is required")
        
        # Use enhanced password validator
        error_messages = password_validator.validate(value)
        if error_messages:
            # Return the first error message for better UX
            raise serializers.ValidationError(error_messages[0])
        
        return value

    # def validate(self, data):
    #     if data['password'] != data['password2']:
    #         raise serializers.ValidationError("Passwords must match.")
    #     return data 

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
 