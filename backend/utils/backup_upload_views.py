"""
Backup upload and restore API endpoints
"""

import os
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.views.decorators.http import require_http_methods
from functools import wraps

from .backup_restore_engine import BackupRestoreEngine
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
@parser_classes([MultiPartParser, FormParser])
@admin_required
def upload_backup(request):
    """
    Upload a backup file for restoration
    
    POST /api/utils/backup/upload/
    Content-Type: multipart/form-data
    
    Form data:
    - backup_file: File to upload
    - backup_type: Type of backup (database, media, full)
    - description: Optional description
    """
    try:
        # Handle file upload data
        if 'backup_file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No backup file provided'
            }, status=400)
        
        uploaded_file = request.FILES['backup_file']
        backup_type = request.POST.get('backup_type', 'database')
        description = request.POST.get('description', '')
        
        # Validate backup type
        if backup_type not in ['database', 'media', 'full']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid backup type. Must be: database, media, or full'
            }, status=400)
        
        # Validate file size (max 500MB)
        max_size = 500 * 1024 * 1024  # 500MB
        if uploaded_file.size > max_size:
            return JsonResponse({
                'success': False,
                'error': f'File too large. Maximum size: {max_size // (1024*1024)}MB'
            }, status=400)
        
        # Upload and validate file
        engine = BackupRestoreEngine()
        result = engine.upload_backup_file(uploaded_file, backup_type, description)
        
        return JsonResponse({
            'success': True,
            'backup_id': result['backup_id'],
            'filename': result['filename'],
            'file_size_mb': round(result['file_size_mb'], 2),
            'validation_result': result['validation_result'],
            'record_count': result.get('record_count'),
            'file_count': result.get('file_count'),
            'message': f'Backup uploaded successfully! ID: {result["backup_id"]}'
        })
        
    except Exception as e:
        logger.error(f"Backup upload failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def restore_backup(request):
    """
    Restore system from uploaded backup
    
    POST /api/utils/backup/restore-uploaded/
    {
        "backup_id": 123,
        "merge_strategy": "replace|merge|skip",
        "preview_only": true
    }
    """
    try:
        data = request.data
        backup_id = data.get('backup_id')
        merge_strategy = data.get('merge_strategy', 'replace')
        preview_only = data.get('preview_only', True)
        
        if not backup_id:
            return JsonResponse({
                'success': False,
                'error': 'backup_id is required'
            }, status=400)
        
        # Validate merge strategy
        if merge_strategy not in ['replace', 'merge', 'skip']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid merge_strategy. Must be: replace, merge, or skip'
            }, status=400)
        
        # Perform restore
        engine = BackupRestoreEngine()
        result = engine.restore_from_backup(backup_id, merge_strategy, preview_only)
        
        return JsonResponse({
            'success': True,
            'preview': result.get('preview', False),
            'backup_id': backup_id,
            'merge_strategy': merge_strategy,
            **result
        })
        
    except Exception as e:
        logger.error(f"Backup restore failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def uploaded_backups_list(request):
    """
    Get list of uploaded backup files
    
    GET /api/utils/backup/uploaded/
    """
    try:
        limit = int(request.GET.get('limit', 20))
        
        engine = BackupRestoreEngine()
        backups = engine.get_uploaded_backups(limit)
        
        backup_list = []
        for backup in backups:
            backup_list.append({
                'id': backup.id,
                'backup_type': backup.backup_type,
                'status': backup.status,
                'uploaded_at': backup.started_at.isoformat(),
                'file_size_mb': backup.file_size_mb,
                'original_filename': backup.metadata.get('original_filename'),
                'description': backup.metadata.get('description', ''),
                'validation_result': backup.metadata.get('validation_result'),
                'record_count': backup.metadata.get('record_count'),
                'file_count': backup.metadata.get('file_count'),
                'is_recent': backup.is_recent
            })
        
        return JsonResponse({
            'success': True,
            'backups': backup_list,
            'count': len(backup_list)
        })
        
    except Exception as e:
        logger.error(f"Get uploaded backups failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_uploaded_backup(request, backup_id):
    """
    Delete uploaded backup file
    
    DELETE /api/utils/backup/uploaded/{backup_id}/
    """
    try:
        engine = BackupRestoreEngine()
        result = engine.delete_backup_file(backup_id)
        
        return JsonResponse({
            'success': True,
            'message': result['message']
        })
        
    except Exception as e:
        logger.error(f"Delete uploaded backup failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def backup_upload_info(request):
    """
    Get information about backup upload requirements
    
    GET /api/utils/backup/upload-info/
    """
    try:
        return JsonResponse({
            'success': True,
            'supported_types': ['database', 'media', 'full'],
            'supported_formats': {
                'database': ['.json', '.json.gz'],
                'media': ['.zip'],
                'full': ['.zip']
            },
            'max_file_size_mb': 500,
            'requirements': {
                'database': 'JSON or gzipped JSON file containing Django fixture data',
                'media': 'ZIP file containing media files with proper directory structure',
                'full': 'ZIP file containing both database JSON file and media files'
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET']) 
@permission_classes([IsAuthenticated])
@admin_required
def test_auth(request):
    """Test authentication endpoint"""
    return JsonResponse({
        'success': True,
        'message': 'Authentication working!',
        'user': request.user.email,
        'role': request.user.role
    })

