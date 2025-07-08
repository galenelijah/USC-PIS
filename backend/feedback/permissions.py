from rest_framework import permissions

class IsAdminOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow admin or staff users.
    """

    def has_permission(self, request, view):
        # Allow access only if the user is authenticated and has the role ADMIN or STAFF
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'STAFF'] 