from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
import datetime

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        # Set username to email if not provided
        if 'username' not in extra_fields:
            extra_fields['username'] = email
            
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self.db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_verified', True)  # Superusers are verified by default
        extra_fields.setdefault('username', email)  # Ensure username is set for superuser
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        DOCTOR = 'DOCTOR', 'Doctor'
        DENTIST = 'DENTIST', 'Dentist'
        NURSE = 'NURSE', 'Nurse'
        STAFF = 'STAFF', 'Staff'
        STUDENT = 'STUDENT', 'Student'
        FACULTY = 'FACULTY', 'Faculty'

    # Authentication fields
    email = models.EmailField(max_length=200, unique=True)
    username = models.CharField(max_length=200, unique=True)  # Make explicit
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    requested_role = models.CharField(max_length=10, choices=Role.choices, null=True, blank=True)
    completeSetup = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Personal Information
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    id_number = models.CharField(max_length=50, null=True, blank=True)
    course = models.CharField(max_length=50, null=True, blank=True)
    year_level = models.CharField(max_length=50, null=True, blank=True)
    school = models.CharField(max_length=50, null=True, blank=True)
    sex = models.CharField(max_length=10, null=True, blank=True)
    civil_status = models.CharField(max_length=50, null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)
    religion = models.CharField(max_length=50, null=True, blank=True)
    address_permanent = models.CharField(max_length=300, null=True, blank=True)
    address_present = models.CharField(max_length=300, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    blood_type = models.CharField(max_length=10, null=True, blank=True)

    # Physical Information
    weight = models.CharField(max_length=10, null=True, blank=True)  # in kg
    height = models.CharField(max_length=10, null=True, blank=True)  # in cm
    bmi = models.CharField(max_length=10, null=True, blank=True)  # Formula: Weight(kg)/Height (m2)

    # Emergency Contacts
    father_name = models.CharField(max_length=100, null=True, blank=True)
    mother_name = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact_number = models.CharField(max_length=100, null=True, blank=True)
    # Encrypted (pgcrypto) version
    emergency_contact_number_enc = models.BinaryField(null=True, blank=True, editable=False)

    # Medical Information
    illness = models.CharField(max_length=100, null=True, blank=True)
    childhood_diseases = models.CharField(max_length=100, null=True, blank=True)
    special_needs = models.CharField(max_length=100, null=True, blank=True)
    existing_medical_condition = models.CharField(max_length=100, null=True, blank=True)
    medications = models.CharField(max_length=100, null=True, blank=True)
    allergies = models.CharField(max_length=100, null=True, blank=True)
    hospitalization_history = models.CharField(max_length=100, null=True, blank=True)
    surgical_procedures = models.CharField(max_length=100, null=True, blank=True)
    # Encrypted (pgcrypto) columns for selected sensitive fields
    illness_enc = models.BinaryField(null=True, blank=True, editable=False)
    existing_medical_condition_enc = models.BinaryField(null=True, blank=True, editable=False)
    medications_enc = models.BinaryField(null=True, blank=True, editable=False)
    allergies_enc = models.BinaryField(null=True, blank=True, editable=False)
    blood_type_enc = models.BinaryField(null=True, blank=True, editable=False)

    # Department and Contact (for staff)
    department = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} - {self.role}"

    def save(self, *args, **kwargs):
        # Ensure username is set to email if not provided
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

class SafeEmail(models.Model):
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10, 
        choices=User.Role.choices, 
        default=User.Role.STUDENT,
        help_text="Role to automatically assign when this user registers"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} ({self.role})"

class VerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.email} - {self.code}"

# Register signal handlers (encryption on save)
try:
    from . import signals  # noqa: F401
except Exception:
    pass

