from rest_framework import permissions
from authentication.models import User

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
            
        # Staff and medical personnel have full access
        if request.user.role in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
            return True
            
        # Students can only perform safe methods (GET, HEAD, OPTIONS)
        if request.user.role == User.Role.STUDENT:
            return request.method in permissions.SAFE_METHODS
            
        # All other roles have no access
        return False 