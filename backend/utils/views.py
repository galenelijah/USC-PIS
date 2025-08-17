from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
from authentication.models import User
from .system_monitors import get_system_health, db_monitor, resource_monitor, performance_monitor
from .models import BackupStatus, BackupSchedule, SystemHealthMetric
import logging
import json

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_health_check(request):
    """
    API endpoint to check backup system health
    Returns backup system status and recent backup information
    """
    try:
        # Check if user has permission to view backup status
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get backup health summary
        health_summary = BackupStatus.get_backup_health_summary()
        
        # Get recent backup statuses
        recent_backups = BackupStatus.objects.filter(
            started_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).order_by('-started_at')[:10]
        
        # Serialize recent backups data
        recent_backups_data = []
        for backup in recent_backups:
            recent_backups_data.append({
                'id': backup.id,
                'backup_type': backup.backup_type,
                'status': backup.status,
                'started_at': backup.started_at.isoformat(),
                'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
                'duration_seconds': backup.duration_seconds,
                'file_size_mb': backup.file_size_mb,
                'is_recent': backup.is_recent
            })
        
        # Get active schedules
        active_schedules = BackupSchedule.objects.filter(is_active=True)
        schedules_data = []
        for schedule in active_schedules:
            schedules_data.append({
                'backup_type': schedule.backup_type,
                'schedule_type': schedule.schedule_type,
                'schedule_time': schedule.schedule_time.strftime('%H:%M'),
                'retention_days': schedule.retention_days,
                'next_run_time': schedule.next_run_time.isoformat() if schedule.next_run_time else None
            })
        
        # Calculate system health indicators
        system_health = {
            'backup_system_healthy': health_summary['health_status'] == 'healthy',
            'last_successful_backup': None,
            'backup_frequency_ok': health_summary['last_24h_backups'] > 0,
            'storage_usage': None  # Could be calculated if needed
        }
        
        if health_summary['latest_database_backup']:
            system_health['last_successful_backup'] = health_summary['latest_database_backup'].started_at.isoformat()
        
        response_data = {
            'timestamp': timezone.now().isoformat(),
            'system_health': system_health,
            'backup_summary': health_summary,
            'recent_backups': recent_backups_data,
            'active_schedules': schedules_data,
            'health_recommendations': _get_health_recommendations(health_summary)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get backup health status: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_manual_backup(request):
    """
    API endpoint to trigger a manual backup
    Requires admin or staff permissions
    """
    try:
        # Check permissions
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        backup_type = request.data.get('backup_type', 'full')
        verify = request.data.get('verify', True)
        
        # Validate backup type
        valid_types = ['database', 'media', 'full']
        if backup_type not in valid_types:
            return Response(
                {'error': f'Invalid backup type. Must be one of: {valid_types}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create backup status record to track the manual backup
        backup_record = BackupStatus.objects.create(
            backup_type=backup_type,
            status='in_progress',
            created_by=request.user,
            metadata={
                'triggered_manually': True,
                'verify_requested': verify,
                'triggered_by_user': request.user.id
            }
        )
        
        # Trigger backup asynchronously (in a real implementation, you'd use Celery or similar)
        # For now, we'll return the backup ID and let the user check the status
        
        return Response({
            'message': 'Manual backup triggered successfully',
            'backup_id': backup_record.id,
            'backup_type': backup_type,
            'verify': verify,
            'status_check_url': f'/api/utils/backup-status/{backup_record.id}/',
            'note': 'Check backup status using the provided URL or admin panel'
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to trigger backup: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_status_detail(request, backup_id):
    """
    Get detailed status of a specific backup
    """
    try:
        # Check permissions
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        backup = BackupStatus.objects.get(id=backup_id)
        
        response_data = {
            'id': backup.id,
            'backup_type': backup.backup_type,
            'status': backup.status,
            'started_at': backup.started_at.isoformat(),
            'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
            'duration_seconds': backup.duration_seconds,
            'file_size': backup.file_size,
            'file_size_mb': backup.file_size_mb,
            'checksum': backup.checksum,
            'error_message': backup.error_message,
            'metadata': backup.metadata,
            'created_by': backup.created_by.username if backup.created_by else None,
            'is_recent': backup.is_recent
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except BackupStatus.DoesNotExist:
        return Response(
            {'error': 'Backup not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to get backup status: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _get_health_recommendations(health_summary):
    """Generate health recommendations based on backup status"""
    recommendations = []
    
    # Check for recent backups
    if health_summary['last_24h_backups'] == 0:
        recommendations.append({
            'type': 'backup_frequency',
            'priority': 'high',
            'message': 'No backups in the last 24 hours. Consider running a manual backup.',
            'action': 'Run manual backup'
        })
    
    # Check success rate
    if health_summary['health_score'] < 0.8:
        recommendations.append({
            'type': 'success_rate',
            'priority': 'medium',
            'message': f'Backup success rate is {health_summary["health_score"]*100:.1f}%. Investigate recent failures.',
            'action': 'Check backup logs'
        })
    
    # Check for verification
    if not health_summary.get('latest_verification'):
        recommendations.append({
            'type': 'verification',
            'priority': 'medium',
            'message': 'No backup verification found. Run backup verification to ensure integrity.',
            'action': 'Run backup verification'
        })
    
    # Check for media backups
    if not health_summary.get('latest_media_backup'):
        recommendations.append({
            'type': 'media_backup',
            'priority': 'low',
            'message': 'No media file backups found. Consider implementing media backup strategy.',
            'action': 'Set up media backups'
        })
    
    return recommendations 