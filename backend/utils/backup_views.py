"""
Simple, efficient backup API endpoints
Replaces complex backup system with fast, reliable operations
"""

import os
import logging
from django.http import JsonResponse, FileResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from functools import wraps

from .fast_backup_engine import FastBackupEngine
from .models import BackupStatus, BackupSchedule

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
        
        # Concurrency guard: one active backup per type
        if BackupStatus.objects.filter(status='in_progress', backup_type=backup_type).exists():
            return JsonResponse({
                'success': False,
                'error': f'Another {backup_type} backup is already in progress'
            }, status=409)

        # Create fast backup engine with 2 minute timeout
        engine = FastBackupEngine(timeout_seconds=120)
        
        # Create backup
        backup_id = engine.create_backup_async(
            backup_type=backup_type,
            quick_backup=quick_backup,
            verify_integrity=verify_integrity,
            created_by=request.user
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def verify_backup_dry_run(request, backup_id):
    """
    Dry-run restore validation (schema/JSON only, no writes)

    POST /api/utils/backup/verify-dry-run/<backup_id>/
    """
    try:
        backup = BackupStatus.objects.get(id=backup_id)
        if backup.status != 'success':
            return JsonResponse({'success': False, 'error': 'Cannot verify incomplete backup'}, status=400)

        file_path = backup.metadata.get('file_path')
        if not file_path or not os.path.exists(file_path):
            return JsonResponse({'success': False, 'error': 'Backup file not found'}, status=404)

        engine = FastBackupEngine()
        is_valid, message = engine.dry_run_restore(file_path)
        return JsonResponse({'success': True, 'valid': is_valid, 'message': message})
    except BackupStatus.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Backup not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def backup_list(request):
    """
    Get list of recent backups
    
    GET /api/utils/backup/list/?limit=10
    """
    try:
        # Filters and pagination
        limit = int(request.GET.get('limit', 10))
        page = int(request.GET.get('page', 1))
        btype = request.GET.get('type')
        status_filter = request.GET.get('status')
        start = request.GET.get('start')
        end = request.GET.get('end')

        qs = BackupStatus.objects.all().order_by('-started_at')
        if btype:
            qs = qs.filter(backup_type=btype)
        if status_filter:
            qs = qs.filter(status=status_filter)
        from django.utils.dateparse import parse_datetime
        if start:
            dt = parse_datetime(start)
            if dt:
                qs = qs.filter(started_at__gte=dt)
        if end:
            dt = parse_datetime(end)
            if dt:
                qs = qs.filter(started_at__lte=dt)

        total = qs.count()
        offset = max(0, (page - 1) * limit)
        backups = qs[offset:offset + limit]
        
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
            'count': len(backup_list),
            'total': total,
            'page': page,
            'page_size': limit
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
        
        # Statistics windows
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        qs_7d = BackupStatus.objects.filter(started_at__gte=last_7d)
        qs_30d = BackupStatus.objects.filter(started_at__gte=last_30d)

        total_backups = qs_7d.count()
        successful_backups = qs_7d.filter(status='success').count()
        failed_backups = qs_7d.filter(status='failed').count()
        in_progress_backups = qs_7d.filter(status='in_progress').count()
        
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

        # KPIs
        def avg_duration(qs):
            vals = list(qs.values_list('duration_seconds_stored', flat=True))
            vals = [v for v in vals if v is not None]
            return round(sum(vals) / len(vals), 2) if vals else None

        def avg_size(qs):
            vals = list(qs.values_list('file_size', flat=True))
            vals = [v for v in vals if v is not None]
            return round(sum(vals) / len(vals), 2) if vals else None

        def per_type_bounds(qs):
            out = {}
            for t in ['database', 'media', 'full']:
                tqs = qs.filter(backup_type=t, status='success')
                out[t] = {
                    'newest': tqs.first().started_at.isoformat() if tqs.exists() else None,
                    'oldest': tqs.last().started_at.isoformat() if tqs.exists() else None,
                }
            return out

        # Retention compliance check against active schedules
        retention_issues = []
        for sched in BackupSchedule.objects.filter(is_active=True):
            cutoff = now - timedelta(days=sched.retention_days)
            oldest_ok = BackupStatus.objects.filter(
                backup_type=sched.backup_type,
                status='success',
                started_at__gte=cutoff,
            ).exists()
            if not oldest_ok:
                retention_issues.append({
                    'backup_type': sched.backup_type,
                    'retention_days': sched.retention_days,
                    'issue': 'No successful backup within retention window'
                })

        last_verification = BackupStatus.objects.filter(backup_type='verification').first()

        stats_payload = {
            'success_rate_24h': round(BackupStatus.objects.filter(started_at__gte=last_24h, status='success').count() / max(1, BackupStatus.objects.filter(started_at__gte=last_24h).count()), 3),
            'success_rate_7d': round(successful_backups / max(1, total_backups), 3),
            'success_rate_30d': round(qs_30d.filter(status='success').count() / max(1, qs_30d.count()), 3),
            'avg_duration_7d_sec': avg_duration(qs_7d),
            'avg_size_7d_bytes': avg_size(qs_7d),
            'per_type_bounds_30d': per_type_bounds(qs_30d),
            'last_verification': last_verification.completed_at.isoformat() if last_verification and last_verification.completed_at else None,
            'retention_issues': retention_issues,
        }

        # Storage visibility (local backups directory)
        backup_root = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backups')
        total_bytes = 0
        if os.path.exists(backup_root):
            for root, _dirs, files in os.walk(backup_root):
                for f in files:
                    try:
                        total_bytes += os.path.getsize(os.path.join(root, f))
                    except Exception:
                        pass
        stats_payload['storage_usage_bytes'] = total_bytes

        # Optional alerting via email if unhealthy or retention issues
        try:
            import os as _os
            from django.core.cache import cache as _cache
            from django.core.mail import send_mail as _send_mail
            alert_email = _os.environ.get('BACKUP_ALERT_EMAIL')
            if alert_email and (health_status == 'unhealthy' or retention_issues):
                key = 'backup_alert_sent_recently'
                if not _cache.get(key):
                    _send_mail(
                        subject='USC-PIS Backup System Alert',
                        message=f"Status: {health_status}\nIssues: {json.dumps(retention_issues)}\nMessage: {message}",
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@localhost'),
                        recipient_list=[alert_email],
                        fail_silently=True
                    )
                    _cache.set(key, True, 3600)  # 1 hour cooldown
        except Exception:
            pass

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
            },
            'kpis': stats_payload
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Health check failed'
        }, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@admin_required
def schedules(request):
    """List or create backup schedules."""
    if request.method == 'GET':
        data = []
        for s in BackupSchedule.objects.all().order_by('backup_type', 'schedule_type'):
            data.append({
                'id': s.id,
                'backup_type': s.backup_type,
                'schedule_type': s.schedule_type,
                'schedule_time': s.schedule_time.strftime('%H:%M'),
                'is_active': s.is_active,
                'retention_days': s.retention_days,
                'next_run_time': s.next_run_time.isoformat() if s.next_run_time else None,
            })
        return JsonResponse({'success': True, 'schedules': data})

    # POST create
    payload = request.data or {}
    try:
        s = BackupSchedule.objects.create(
            backup_type=payload.get('backup_type', 'database'),
            schedule_type=payload.get('schedule_type', 'daily'),
            schedule_time=payload.get('schedule_time', '00:00'),
            is_active=payload.get('is_active', True),
            retention_days=payload.get('retention_days', 7),
            configuration=payload.get('configuration', {})
        )
        return JsonResponse({'success': True, 'id': s.id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@admin_required
def update_schedule(request, schedule_id):
    try:
        s = BackupSchedule.objects.get(id=schedule_id)
        payload = request.data or {}
        for field in ['backup_type', 'schedule_type', 'is_active', 'retention_days']:
            if field in payload:
                setattr(s, field, payload[field])
        if 'schedule_time' in payload:
            s.schedule_time = payload['schedule_time']
        if 'configuration' in payload:
            s.configuration = payload['configuration']
        s.save()
        return JsonResponse({'success': True})
    except BackupSchedule.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Schedule not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def toggle_schedule(request, schedule_id):
    try:
        s = BackupSchedule.objects.get(id=schedule_id)
        s.is_active = not s.is_active
        s.save()
        return JsonResponse({'success': True, 'is_active': s.is_active})
    except BackupSchedule.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Schedule not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def run_schedule_now(request, schedule_id):
    try:
        s = BackupSchedule.objects.get(id=schedule_id)
        # Same concurrency guard as create
        if BackupStatus.objects.filter(status='in_progress', backup_type=s.backup_type).exists():
            return JsonResponse({'success': False, 'error': f'Another {s.backup_type} backup is already in progress'}, status=409)
        engine = FastBackupEngine(timeout_seconds=120)
        backup_id = engine.create_backup_async(
            backup_type=s.backup_type,
            quick_backup=s.configuration.get('quick_backup', True),
            verify_integrity=s.configuration.get('verify_integrity', True),
            created_by=request.user
        )
        return JsonResponse({'success': True, 'backup_id': backup_id})
    except BackupSchedule.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Schedule not found'}, status=404)
