"""
Simple, efficient backup API endpoints
Replaces complex backup system with fast, reliable operations
"""

import os
import logging
from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from functools import wraps

from .fast_backup_engine import FastBackupEngine
from .models import BackupStatus

logger = logging.getLogger(__name__)

def admin_required(view_func):
    """Ensure only admin/staff can access backup functions"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        if request.user.role not in ['ADMIN', 'STAFF', 'DOCTOR']:
            return JsonResponse({'error': 'Admin access required'}, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def create_backup(request):
    """
    Create a new backup immediately
    
    POST /api/utils/backup/create/
    {
        "backup_type": "database",
        "quick_backup": true,
        "verify_integrity": true
    }
    """
    try:
        data = request.data
        backup_type = data.get('backup_type', 'database')
        quick_backup = data.get('quick_backup', True)
        verify_integrity = data.get('verify_integrity', False)
        
        # Create fast backup engine with 2 minute timeout
        engine = FastBackupEngine(timeout_seconds=120)
        
        # Create backup
        backup_id = engine.create_backup_async(
            backup_type=backup_type,
            quick_backup=quick_backup,
            verify_integrity=verify_integrity
        )
        
        return JsonResponse({
            'success': True,
            'backup_id': backup_id,
            'message': 'Backup created successfully'
        })
        
    except Exception as e:
        logger.error(f"Backup creation failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def backup_status(request, backup_id):
    """
    Get status of a specific backup
    
    GET /api/utils/backup/status/<backup_id>/
    """
    try:
        backup = BackupStatus.objects.get(id=backup_id)
        
        response_data = {
            'id': backup.id,
            'status': backup.status,
            'backup_type': backup.backup_type,
            'started_at': backup.started_at.isoformat(),
            'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
            'duration_seconds': backup.duration_seconds,
            'file_size_mb': backup.file_size_mb,
            'error_message': backup.error_message or None,
            'metadata': backup.metadata
        }
        
        return JsonResponse({
            'success': True,
            'backup': response_data
        })
        
    except BackupStatus.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Backup not found'
        }, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def download_backup(request, backup_id):
    """
    Download a backup file
    
    GET /api/utils/backup/download/<backup_id>/
    """
    try:
        backup = BackupStatus.objects.get(id=backup_id)
        
        if backup.status != 'success':
            return JsonResponse({
                'success': False,
                'error': 'Backup not completed successfully'
            }, status=400)
        
        # Get file path from metadata
        file_path = backup.metadata.get('file_path')
        filename = backup.metadata.get('filename')
        
        if not file_path or not os.path.exists(file_path):
            return JsonResponse({
                'success': False,
                'error': 'Backup file not found'
            }, status=404)
        
        # Serve file
        response = FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=filename or f'backup_{backup_id}.json'
        )
        return response
        
    except BackupStatus.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Backup not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Download failed'
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def verify_backup(request, backup_id):
    """
    Verify backup file integrity
    
    POST /api/utils/backup/verify/<backup_id>/
    """
    try:
        backup = BackupStatus.objects.get(id=backup_id)
        
        if backup.status != 'success':
            return JsonResponse({
                'success': False,
                'error': 'Cannot verify incomplete backup'
            }, status=400)
        
        file_path = backup.metadata.get('file_path')
        if not file_path or not os.path.exists(file_path):
            return JsonResponse({
                'success': False,
                'error': 'Backup file not found'
            }, status=404)
        
        # Verify backup
        engine = FastBackupEngine()
        is_valid, message = engine.verify_backup(file_path)
        
        return JsonResponse({
            'success': True,
            'valid': is_valid,
            'message': message
        })
        
    except BackupStatus.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Backup not found'
        }, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def backup_list(request):
    """
    Get list of recent backups
    
    GET /api/utils/backup/list/?limit=10
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        backups = BackupStatus.objects.all().order_by('-started_at')[:limit]
        
        backup_list = []
        for backup in backups:
            backup_list.append({
                'id': backup.id,
                'status': backup.status,
                'backup_type': backup.backup_type,
                'started_at': backup.started_at.isoformat(),
                'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
                'duration_seconds': backup.duration_seconds,
                'file_size_mb': backup.file_size_mb,
                'is_recent': backup.is_recent,
                'has_file': bool(backup.metadata.get('file_path') and 
                               os.path.exists(backup.metadata.get('file_path', ''))),
                'metadata': backup.metadata
            })
        
        return JsonResponse({
            'success': True,
            'backups': backup_list,
            'count': len(backup_list)
        })
        
    except Exception as e:
        logger.error(f"Backup list failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to get backup list'
        }, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_backup(request, backup_id):
    """
    Delete a backup and its file
    
    DELETE /api/utils/backup/delete/<backup_id>/
    """
    try:
        backup = BackupStatus.objects.get(id=backup_id)
        
        # Delete file if it exists
        file_path = backup.metadata.get('file_path')
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted backup file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {e}")
        
        # Delete database record
        backup.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Backup deleted successfully'
        })
        
    except BackupStatus.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Backup not found'
        }, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def backup_system_health(request):
    """
    Get backup system health status
    
    GET /api/utils/backup/health/
    """
    try:
        from datetime import timedelta
        from django.utils import timezone
        
        # Get recent backup statistics
        now = timezone.now()
        recent_backups = BackupStatus.objects.filter(
            started_at__gte=now - timedelta(days=7)
        )
        
        total_backups = recent_backups.count()
        successful_backups = recent_backups.filter(status='success').count()
        failed_backups = recent_backups.filter(status='failed').count()
        in_progress_backups = recent_backups.filter(status='in_progress').count()
        
        # Check for stuck backups (over 10 minutes)
        stuck_backups = BackupStatus.objects.filter(
            status='in_progress',
            started_at__lt=now - timedelta(minutes=10)
        ).count()
        
        # Determine health status
        if stuck_backups > 0:
            health_status = 'unhealthy'
            message = f'{stuck_backups} stuck backup(s) detected'
        elif failed_backups > successful_backups:
            health_status = 'unhealthy'
            message = f'More failures ({failed_backups}) than successes ({successful_backups})'
        elif failed_backups > 0:
            health_status = 'warning'
            message = f'{successful_backups} successful, {failed_backups} failed in last 7 days'
        elif total_backups == 0:
            health_status = 'warning'
            message = 'No backups in last 7 days'
        else:
            health_status = 'healthy'
            message = f'{successful_backups} successful backups in last 7 days'
        
        return JsonResponse({
            'success': True,
            'health_status': health_status,
            'message': message,
            'statistics': {
                'total_backups': total_backups,
                'successful_backups': successful_backups,
                'failed_backups': failed_backups,
                'in_progress_backups': in_progress_backups,
                'stuck_backups': stuck_backups,
                'last_backup': recent_backups.first().started_at.isoformat() if recent_backups.exists() else None
            }
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Health check failed'
        }, status=500)