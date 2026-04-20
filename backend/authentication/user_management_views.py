"""
User Management Views for Admin Role Updates
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from .models import User
from .serializers import UserProfileSerializer
import json

from .models import User, SafeEmail

def admin_required(view_func):
    """Decorator to require admin role"""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.role != User.Role.ADMIN:
            return Response({'error': 'Admin privileges required'}, status=status.HTTP_403_FORBIDDEN)
        
        return view_func(request, *args, **kwargs)
    return wrapper

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@admin_required
def manage_safe_emails(request):
    """List or add to the SafeEmail list"""
    if request.method == 'GET':
        safe_emails = SafeEmail.objects.all().order_by('-created_at')
        emails = [{
            'id': se.id,
            'email': se.email,
            'is_active': se.is_active,
            'created_at': se.created_at
        } for se in safe_emails]
        return Response({'safe_emails': emails})
    
    elif request.method == 'POST':
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        safe_email, created = SafeEmail.objects.get_or_create(email=email)
        if not created:
            safe_email.is_active = True
            safe_email.save()
            
        return Response({
            'message': f'Email {email} added to safe list',
            'safe_email': {
                'id': safe_email.id,
                'email': safe_email.email,
                'is_active': safe_email.is_active
            }
        })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def remove_safe_email(request, email_id):
    """Remove an email from the safe list"""
    safe_email = get_object_or_404(SafeEmail, id=email_id)
    email = safe_email.email
    safe_email.delete()
    return Response({'message': f'Email {email} removed from safe list'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@admin_required
def toggle_user_verification(request, user_id):
    """Manually toggle a user's verification status"""
    user = get_object_or_404(User, id=user_id)
    user.is_verified = not user.is_verified
    user.save(update_fields=['is_verified'])
    
    return Response({
        'message': f'User {user.email} is now {"verified" if user.is_verified else "unverified"}',
        'is_verified': user.is_verified
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_all_users(request):
    """Get all users with pagination and filtering"""
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        search = request.GET.get('search', '')
        role_filter = request.GET.get('role', '')
        
        # Base queryset
        queryset = User.objects.all().order_by('-created_at')
        
        # Apply search filter
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(id_number__icontains=search)
            )
        
        # Apply role filter
        if role_filter and role_filter in [choice[0] for choice in User.Role.choices]:
            queryset = queryset.filter(role=role_filter)
        
        # Paginate
        paginator = Paginator(queryset, limit)
        page_obj = paginator.get_page(page)
        
        # Serialize users
        serializer = UserProfileSerializer(page_obj.object_list, many=True)
        
        return Response({
            'users': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_users': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'role_counts': {
                'ADMIN': User.objects.filter(role=User.Role.ADMIN).count(),
                'DOCTOR': User.objects.filter(role=User.Role.DOCTOR).count(),
                'DENTIST': User.objects.filter(role=User.Role.DENTIST).count(),
                'NURSE': User.objects.filter(role=User.Role.NURSE).count(),
                'STAFF': User.objects.filter(role=User.Role.STAFF).count(),
                'STUDENT': User.objects.filter(role=User.Role.STUDENT).count(),
                'TEACHER': User.objects.filter(role=User.Role.TEACHER).count(),
                'TOTAL_PATIENTS': User.objects.filter(role__in=[User.Role.STUDENT, User.Role.TEACHER]).count(),
                'TOTAL_STAFF': User.objects.filter(role__in=[
                    User.Role.ADMIN, User.Role.DOCTOR, User.Role.DENTIST, User.Role.NURSE, User.Role.STAFF
                ]).count(),
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch users: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_role(request, user_id):
    """
    Update a user's role.
    - Admins can update any user's role.
    - Users can only update their own role if it is currently STUDENT.
    - Users cannot assign themselves the ADMIN role.
    """
    try:
        user = get_object_or_404(User, id=user_id)
        new_role = request.data.get('role')
        
        # Check permissions
        is_admin = request.user.role == User.Role.ADMIN
        is_self = request.user.id == user.id
        
        if not is_admin and not is_self:
            return Response({
                'error': 'Permission denied. Only admins can update other users.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        if not is_admin:
            # Security checks for self-updates
            if user.role != User.Role.STUDENT:
                return Response({
                    'error': 'Role has already been set and cannot be changed. Please contact an admin.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if new_role == User.Role.ADMIN:
                return Response({
                    'error': 'Cannot assign ADMIN role to yourself.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate role exists
        if not new_role or new_role not in [choice[0] for choice in User.Role.choices]:
            return Response({
                'error': 'Invalid role provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent self-demotion from admin (even if is_admin is true)
        if is_self and request.user.role == User.Role.ADMIN and new_role != User.Role.ADMIN:
            return Response({
                'error': 'Cannot change your own admin role'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_role = user.role
        user.role = new_role
        
        # Update staff/superuser status based on role
        if new_role == User.Role.ADMIN:
            user.is_staff = True
            user.is_superuser = True
        elif new_role in [User.Role.DOCTOR, User.Role.DENTIST, User.Role.NURSE, User.Role.STAFF]:
            user.is_staff = True
            user.is_superuser = False
        else:  # STUDENT or TEACHER
            user.is_staff = False
            user.is_superuser = False
        
        user.save()
        
        serializer = UserProfileSerializer(user)
        
        return Response({
            'message': f'User role updated from {old_role} to {new_role}',
            'user': serializer.data
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to update user role: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_user_details(request, user_id):
    """Get detailed information about a specific user"""
    try:
        user = get_object_or_404(User, id=user_id)
        serializer = UserProfileSerializer(user)
        
        return Response({
            'user': serializer.data
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch user details: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@admin_required
def toggle_user_status(request, user_id):
    """Toggle user active/inactive status"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Prevent disabling self
        if request.user.id == user.id:
            return Response({
                'error': 'Cannot disable your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = not user.is_active
        user.save()
        
        serializer = UserProfileSerializer(user)
        
        return Response({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'user': serializer.data
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to toggle user status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_user(request, user_id):
    """Delete a user (admin only, with safety checks)"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Prevent self-deletion
        if request.user.id == user.id:
            return Response({
                'error': 'Cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store user info before deletion
        user_email = user.email
        user_role = user.role
        
        # Explicitly delete associated patient profile if it exists
        # This ensures cleanup on the patients page
        try:
            if hasattr(user, 'patient_profile'):
                user.patient_profile.delete()
        except Exception as e:
            # Log but don't block user deletion if patient deletion fails
            print(f"Warning: Failed to delete patient profile for user {user_id}: {e}")
        
        user.delete()
        
        return Response({
            'message': f'User {user_email} ({user_role}) deleted successfully'
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to delete user: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
