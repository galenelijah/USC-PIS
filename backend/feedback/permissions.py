from rest_framework import permissions

class IsAdminOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow non-student users (Admin, Staff, Doctor, Dentist, Nurse, Faculty).
    """

    def has_permission(self, request, view):
        # Allow access only if the user is authenticated and is NOT a student
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role != 'STUDENT'
        ) 