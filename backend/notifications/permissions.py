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
               (hasattr(request.user, 'role') and request.user.role in ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'])


class IsMedicalStaff(permissions.BasePermission):
    """
    Permission to only allow administrative management of campaigns and system notifications.
    Admin and Staff handle management; Doctors, Dentists and Nurses are view-only.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return hasattr(request.user, 'role') and \
                   request.user.role in ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE']

        return (
            hasattr(request.user, 'role') and
            request.user.role in ['ADMIN', 'STAFF']
        )

class CanManageNotifications(permissions.BasePermission):
    """
    Permission to allow users to manage notifications they can access.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Medical staff can manage all notifications
        if hasattr(request.user, 'role') and request.user.role in ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE']:
            return True
        
        # Users can only manage their own notifications
        return hasattr(obj, 'recipient') and obj.recipient == request.user 