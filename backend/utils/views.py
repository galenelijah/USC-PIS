from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from authentication.models import User
from .system_monitors import get_system_health, db_monitor, resource_monitor, performance_monitor
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health_check(request):
    """Comprehensive system health check endpoint."""
    try:
        # Check if user has permission to view system health
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        health_status = get_system_health()
        
        return JsonResponse(health_status)
        
    except Exception as e:
        logger.error(f"System health check failed: {str(e)}")
        return JsonResponse({
            'overall_status': 'error',
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def database_health_check(request):
    """Database-specific health check endpoint."""
    try:
        # Check permissions
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        db_health = db_monitor.check_health()
        
        return JsonResponse(db_health)
        
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return JsonResponse({
            'overall_status': 'error',
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_stats(request):
    """Performance statistics endpoint."""
    try:
        # Check permissions
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        perf_stats = performance_monitor.get_performance_stats()
        
        return JsonResponse(perf_stats)
        
    except Exception as e:
        logger.error(f"Performance stats failed: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resource_health_check(request):
    """System resource health check endpoint."""
    try:
        # Check permissions
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        resource_health = resource_monitor.check_resources()
        
        return JsonResponse(resource_health)
        
    except Exception as e:
        logger.error(f"Resource health check failed: {str(e)}")
        return JsonResponse({
            'overall_status': 'error',
            'error': str(e)
        }, status=500) 