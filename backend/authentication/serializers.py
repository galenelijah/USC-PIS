from rest_framework import serializers
from .models import User

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
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            **{k: v for k, v in validated_data.items() if k not in ['email', 'password']}
        )
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