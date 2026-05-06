from rest_framework import permissions
from authentication.models import User

class IsStaffUser(permissions.BasePermission):
    """
    Permission class for strictly clinical/admin endpoints (like Patient list).
    Allows Admin, Staff, Doctor, Dentist, and Nurse.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in [
            User.Role.ADMIN, 
            User.Role.STAFF, 
            User.Role.DOCTOR, 
            User.Role.NURSE, 
            User.Role.DENTIST
        ]

class MedicalRecordPermission(permissions.BasePermission):
    """
    Custom permission class for clinical records (Medical, Dental, Consultation):
    - Admin: Full CRUD access to everything.
    - Nurse: Full CRUD access to medical, consultation, and dental records.
    - Doctor: Full CRUD for Medical/Consultation; View-only for Dental.
    - Dentist: Full CRUD for Dental; View-only for Medical/Consultation.
    - Staff: Read-only access to everything.
    - Students/Faculty: Read-only access to their own records.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        user = request.user
        view_name = str(view.__class__.__name__)

        # Admin has full access to everything
        if user.role == User.Role.ADMIN:
            return True

        # Nurses: Full CRUD for both medical and dental
        if user.role == User.Role.NURSE:
            return True

        # Determine if we are dealing with a Dental record
        is_dental = 'DentalRecord' in view_name

        # Doctors: CRUD for medical, View-only for dental
        if user.role == User.Role.DOCTOR:
            if is_dental:
                return request.method in permissions.SAFE_METHODS
            return True

        # Dentists: CRUD for dental, View-only for medical
        if user.role == User.Role.DENTIST:
            if is_dental:
                return True
            return request.method in permissions.SAFE_METHODS

        # Staff: Read-only access to everything
        if user.role == User.Role.STAFF:
            return request.method in permissions.SAFE_METHODS

        # Patients (Students and Faculty) can only perform safe methods
        if user.role in [User.Role.STUDENT, User.Role.FACULTY]:
            return request.method in permissions.SAFE_METHODS

        return False
 