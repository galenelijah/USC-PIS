from rest_framework import permissions
from authentication.models import User

class IsStaffUser(permissions.BasePermission):
    """
    Permission class for strictly clinical/admin endpoints.
    Denies access to Students and Faculty.
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
    Custom permission class for medical records:
    - Admin, Staff, Doctor, Nurse: Full CRUD access
    - Students: Read-only access to their own records
    - Others: No access
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Admin and Dentist have full access to everything here
        if request.user.role in [User.Role.ADMIN, User.Role.DENTIST]:
            return True

        # Staff, Doctor, Nurse have full access to medical records, 
        # but Staff should be blocked from editing dental records
        if request.user.role in [User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
            # If it's a dental record view, check if it's an edit operation for Staff
            if 'DentalRecord' in str(view.__class__.__name__):
                if request.user.role == User.Role.STAFF and request.method not in permissions.SAFE_METHODS:
                    return False
            return True

        # Patients (Students and Faculty) can only perform safe methods (GET, HEAD, OPTIONS)
        if request.user.role in [User.Role.STUDENT, User.Role.FACULTY]:
            return request.method in permissions.SAFE_METHODS

        # All other roles have no access
        return False
 