from rest_framework import permissions


class IsOwnerOrMedicalStaff(permissions.BasePermission):
    """
    Permission to only allow owners of an object or medical staff to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions for owner or medical staff
        return (hasattr(obj, 'user') and obj.user == request.user) or \
               (hasattr(request.user, 'role') and request.user.role in ['medical_staff', 'admin'])


class IsMedicalStaff(permissions.BasePermission):
    """
    Permission to only allow medical staff and admin users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['medical_staff', 'admin']
        )


class CanManageNotifications(permissions.BasePermission):
    """
    Permission to allow users to manage notifications they can access.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Medical staff can manage all notifications
        if hasattr(request.user, 'role') and request.user.role in ['medical_staff', 'admin']:
            return True
        
        # Users can only manage their own notifications
        return hasattr(obj, 'recipient') and obj.recipient == request.user 