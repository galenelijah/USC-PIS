from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse, HttpResponse
from django.conf import settings
import os
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
from authentication.models import User
from .system_monitors import get_system_health, db_monitor, resource_monitor, performance_monitor
from .health_checks import HealthChecker, quick_health_check
from .models import BackupStatus, BackupSchedule, SystemHealthMetric
import logging
import json
from django.db import connection

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

        # Extended DB metrics
        extended = {}
        try:
            with connection.cursor() as cursor:
                if 'postgresql' in connection.settings_dict.get('ENGINE', ''):
                    cursor.execute("SELECT state, count(*) FROM pg_stat_activity GROUP BY state")
                    for state, count in cursor.fetchall():
                        extended[f"conn_{(state or 'unknown').lower()}"] = count
                    cursor.execute("SELECT count(*) FROM pg_locks WHERE NOT granted")
                    extended['lock_waits'] = cursor.fetchone()[0]
        except Exception as e:
            logger.warning(f"Extended DB metrics failed: {e}")

        # Latency percentiles from cached samples
        try:
            from django.core.cache import cache
            perf = db_health.get('checks', {}).get('performance', {})
            sample = perf.get('query_time')
            samples = cache.get('db_q_times', [])
            if sample is not None:
                samples.append(float(sample))
                samples = samples[-200:]
                cache.set('db_q_times', samples, 600)
            if samples:
                s = sorted(samples)
                def pct(p):
                    if not s:
                        return None
                    idx = int(max(0, min(len(s)-1, round(p * (len(s)-1)))))
                    return round(s[idx], 4)
                extended['latency_p50'] = pct(0.50)
                extended['latency_p95'] = pct(0.95)
                extended['latency_p99'] = pct(0.99)
        except Exception as e:
            logger.warning(f"Latency percentile calc failed: {e}")

        # Last migration timestamp
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT MAX(applied) FROM django_migrations")
                row = cursor.fetchone()
                extended['last_migration'] = row[0].isoformat() if row and row[0] else None
        except Exception:
            extended['last_migration'] = None

        # Cache hit rate is backend-dependent; omitted here
        extended['cache_hit_rate'] = None

        db_health['extended'] = extended

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
        logger.info(f"Backup health check requested by user: {user.email if user else 'anonymous'}")
        
        if not user or not hasattr(user, 'role'):
            logger.error(f"User has no role attribute: {user}")
            return Response(
                {'error': 'User role not found'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            logger.error(f"User {user.email} with role {user.role} denied access to backup health")
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        logger.info("Starting backup health data collection...")
        
        # Get backup health summary
        health_summary = BackupStatus.get_backup_health_summary()
        logger.info(f"Health summary retrieved: {health_summary}")
        
        # Serialize backup objects in health_summary for JSON response
        if health_summary['latest_database_backup']:
            health_summary['latest_database_backup'] = {
                'id': health_summary['latest_database_backup'].id,
                'backup_type': health_summary['latest_database_backup'].backup_type,
                'status': health_summary['latest_database_backup'].status,
                'started_at': health_summary['latest_database_backup'].started_at.isoformat(),
                'completed_at': health_summary['latest_database_backup'].completed_at.isoformat() if health_summary['latest_database_backup'].completed_at else None,
            }
        
        if health_summary['latest_media_backup']:
            health_summary['latest_media_backup'] = {
                'id': health_summary['latest_media_backup'].id,
                'backup_type': health_summary['latest_media_backup'].backup_type,
                'status': health_summary['latest_media_backup'].status,
                'started_at': health_summary['latest_media_backup'].started_at.isoformat(),
                'completed_at': health_summary['latest_media_backup'].completed_at.isoformat() if health_summary['latest_media_backup'].completed_at else None,
            }
        
        if health_summary['latest_full_backup']:
            health_summary['latest_full_backup'] = {
                'id': health_summary['latest_full_backup'].id,
                'backup_type': health_summary['latest_full_backup'].backup_type,
                'status': health_summary['latest_full_backup'].status,
                'started_at': health_summary['latest_full_backup'].started_at.isoformat(),
                'completed_at': health_summary['latest_full_backup'].completed_at.isoformat() if health_summary['latest_full_backup'].completed_at else None,
            }
        
        if health_summary['latest_verification']:
            health_summary['latest_verification'] = {
                'id': health_summary['latest_verification'].id,
                'backup_type': health_summary['latest_verification'].backup_type,
                'status': health_summary['latest_verification'].status,
                'started_at': health_summary['latest_verification'].started_at.isoformat(),
                'completed_at': health_summary['latest_verification'].completed_at.isoformat() if health_summary['latest_verification'].completed_at else None,
            }
        
        # Get recent backup statuses
        recent_backups = BackupStatus.objects.filter(
            started_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).order_by('-started_at')[:10]
        logger.info(f"Recent backups query completed: {recent_backups.count()} records")
        
        # Serialize recent backups data
        recent_backups_data = []
        for backup in recent_backups:
            backup_data = {
                'id': backup.id,
                'backup_type': backup.backup_type,
                'status': backup.status,
                'started_at': backup.started_at.isoformat(),
                'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
                'duration_seconds': backup.duration_seconds,
                'file_size_mb': backup.file_size_mb,
                'is_recent': backup.is_recent
            }
            recent_backups_data.append(backup_data)
        logger.info(f"Recent backups serialized: {len(recent_backups_data)} records")
        
        # Get active schedules
        active_schedules = BackupSchedule.objects.filter(is_active=True)
        logger.info(f"Active schedules query completed: {active_schedules.count()} records")
        
        schedules_data = []
        for schedule in active_schedules:
            schedule_data = {
                'backup_type': schedule.backup_type,
                'schedule_type': schedule.schedule_type,
                'schedule_time': schedule.schedule_time.strftime('%H:%M'),
                'retention_days': schedule.retention_days,
                'next_run_time': schedule.next_run_time.isoformat() if schedule.next_run_time else None
            }
            schedules_data.append(schedule_data)
        logger.info(f"Schedules serialized: {len(schedules_data)} records")
        
        # Calculate system health indicators
        system_health = {
            'backup_system_healthy': health_summary['health_status'] == 'healthy',
            'last_successful_backup': None,
            'backup_frequency_ok': health_summary['last_24h_backups'] > 0,
            'storage_usage': None  # Could be calculated if needed
        }
        
        if health_summary['latest_database_backup']:
            system_health['last_successful_backup'] = health_summary['latest_database_backup']['started_at']
        
        logger.info("Getting health recommendations...")
        health_recommendations = _get_health_recommendations(health_summary)
        logger.info(f"Health recommendations generated: {len(health_recommendations)} items")
        
        response_data = {
            'timestamp': timezone.now().isoformat(),
            'system_health': system_health,
            'backup_summary': health_summary,
            'recent_backups': recent_backups_data,
            'active_schedules': schedules_data,
            'health_recommendations': health_recommendations
        }
        
        logger.info("Backup health check completed successfully")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Backup health check failed: {str(e)}", exc_info=True)
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
        
        backup_type = request.data.get('backup_type', 'database')
        verify = request.data.get('verify', True)
        quick_backup = request.data.get('quick_backup', False)
        
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
                'quick_backup': quick_backup,
                'triggered_by_user': request.user.id
            }
        )
        
        # Execute backup immediately in background using management command
        import subprocess
        import threading
        
        def execute_backup_async():
            """Execute backup in background thread"""
            try:
                # Use subprocess to execute the management command
                subprocess.run([
                    './venv/Scripts/python.exe',
                    'manage.py',
                    'execute_backup',
                    '--backup-id',
                    str(backup_record.id)
                ], check=True, cwd=settings.BASE_DIR)
            except subprocess.CalledProcessError as e:
                logger.error(f"Backup execution failed: {e}")
                # Update backup record to failed
                backup_record.status = 'failed'
                backup_record.completed_at = timezone.now()
                backup_record.error_message = f"Execution failed: {e}"
                backup_record.save()
        
        # Start backup execution in background thread
        backup_thread = threading.Thread(target=execute_backup_async)
        backup_thread.daemon = True
        backup_thread.start()
        
        return Response({
            'message': 'Manual backup triggered successfully',
            'backup_id': backup_record.id,
            'backup_type': backup_type,
            'verify': verify,
            'status_check_url': f'/api/utils/backup-status/{backup_record.id}/',
            'note': 'Backup is executing in the background. Check status using the provided URL.'
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_backup(request, backup_id):
    """
    Download a specific backup file
    Requires admin/staff permissions
    """
    try:
        # Check if user has permission to download backups
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response(
                {'error': 'Permission denied. Admin/Staff access required.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the backup record
        try:
            backup = BackupStatus.objects.get(id=backup_id)
        except BackupStatus.DoesNotExist:
            return Response(
                {'error': 'Backup not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if backup completed successfully
        if backup.status != 'success':
            return Response(
                {'error': f'Backup is not available for download. Status: {backup.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine backup file path based on backup type
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        timestamp = backup.started_at.strftime('%Y%m%d_%H%M%S')
        
        if backup.backup_type == 'database':
            backup_file = os.path.join(backup_dir, f'database_backup_{timestamp}.json')
            content_type = 'application/json'
            filename = f'database_backup_{backup.started_at.strftime("%Y-%m-%d_%H-%M-%S")}.json'
        elif backup.backup_type == 'media':
            # For media backups, we'll create a zip file
            import zipfile
            import tempfile
            
            media_backup_dir = os.path.join(backup_dir, f'media_backup_{timestamp}')
            if not os.path.exists(media_backup_dir):
                return Response(
                    {'error': 'Media backup files not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create a temporary zip file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_zip:
                with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(media_backup_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, media_backup_dir)
                            zipf.write(file_path, arcname)
                
                backup_file = temp_zip.name
                content_type = 'application/zip'
                filename = f'media_backup_{backup.started_at.strftime("%Y-%m-%d_%H-%M-%S")}.zip'
        elif backup.backup_type == 'full':
            # For full backups, we'll include both database and manifest
            import zipfile
            import tempfile
            
            db_file = os.path.join(backup_dir, f'database_backup_{timestamp}.json')
            manifest_file = os.path.join(backup_dir, f'backup_manifest_{timestamp}.json')
            
            # Create a temporary zip file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_zip:
                with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    if os.path.exists(db_file):
                        zipf.write(db_file, f'database_backup_{timestamp}.json')
                    if os.path.exists(manifest_file):
                        zipf.write(manifest_file, f'backup_manifest_{timestamp}.json')
                    
                    # Add media files if they exist
                    media_backup_dir = os.path.join(backup_dir, f'media_backup_{timestamp}')
                    if os.path.exists(media_backup_dir):
                        for root, dirs, files in os.walk(media_backup_dir):
                            for file in files:
                                file_path = os.path.join(root, file)
                                arcname = os.path.join('media', os.path.relpath(file_path, media_backup_dir))
                                zipf.write(file_path, arcname)
                
                backup_file = temp_zip.name
                content_type = 'application/zip'
                filename = f'full_backup_{backup.started_at.strftime("%Y-%m-%d_%H-%M-%S")}.zip'
        else:
            return Response(
                {'error': f'Unknown backup type: {backup.backup_type}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if file exists
        if not os.path.exists(backup_file):
            return Response(
                {'error': 'Backup file not found on disk'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create HTTP response with file
        try:
            with open(backup_file, 'rb') as f:
                response = HttpResponse(f.read(), content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                # Add file size header
                file_size = os.path.getsize(backup_file)
                response['Content-Length'] = str(file_size)
                
                # Clean up temporary zip files
                if backup.backup_type in ['media', 'full'] and backup_file.endswith('.zip'):
                    os.unlink(backup_file)
                
                logger.info(f"Backup {backup_id} downloaded by user {user.email}")
                return response
                
        except Exception as e:
            logger.error(f"Error reading backup file {backup_file}: {e}")
            return Response(
                {'error': 'Error reading backup file'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Backup download failed: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to download backup: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_backup(request):
    """
    Restore data from a backup with smart merge options
    Requires admin permissions and provides data conflict resolution
    """
    try:
        # Check if user has permission to restore backups
        user = request.user
        if user.role != User.Role.ADMIN:
            return Response(
                {'error': 'Permission denied. Admin access required for backup restoration.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get request data
        backup_id = request.data.get('backup_id')
        merge_strategy = request.data.get('merge_strategy', 'replace')  # replace, merge, skip
        preview_only = request.data.get('preview_only', False)
        
        if not backup_id:
            return Response(
                {'error': 'backup_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate merge strategy
        valid_strategies = ['replace', 'merge', 'skip']
        if merge_strategy not in valid_strategies:
            return Response(
                {'error': f'Invalid merge_strategy. Must be one of: {valid_strategies}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the backup record
        try:
            backup = BackupStatus.objects.get(id=backup_id)
        except BackupStatus.DoesNotExist:
            return Response(
                {'error': 'Backup not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if backup completed successfully
        if backup.status != 'success':
            return Response(
                {'error': f'Backup is not available for restoration. Status: {backup.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only support database backups for now
        if backup.backup_type != 'database':
            return Response(
                {'error': 'Only database backups can be restored at this time'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Load backup data
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        timestamp = backup.started_at.strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'database_backup_{timestamp}.json')
        
        if not os.path.exists(backup_file):
            return Response(
                {'error': 'Backup file not found on disk'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Read backup data
        import json
        with open(backup_file, 'r') as f:
            backup_data = json.load(f)
        
        # Analyze conflicts and prepare restore plan
        restore_plan = _analyze_backup_conflicts(backup_data, merge_strategy)
        
        if preview_only:
            return Response({
                'message': 'Restore preview generated successfully',
                'backup_info': {
                    'id': backup.id,
                    'backup_type': backup.backup_type,
                    'started_at': backup.started_at.isoformat(),
                    'file_size_mb': backup.file_size_mb
                },
                'restore_plan': restore_plan,
                'preview_only': True
            }, status=status.HTTP_200_OK)
        
        # Perform the actual restore
        restore_result = _perform_backup_restore(backup_data, restore_plan, user)
        
        # Log the restore operation
        logger.info(f"Backup {backup_id} restored by user {user.email} with strategy '{merge_strategy}'")
        
        return Response({
            'message': 'Backup restored successfully',
            'backup_info': {
                'id': backup.id,
                'backup_type': backup.backup_type,
                'started_at': backup.started_at.isoformat(),
            },
            'restore_result': restore_result
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Backup restore failed: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to restore backup: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _analyze_backup_conflicts(backup_data, merge_strategy):
    """
    Analyze potential conflicts between backup data and current data
    Django fixtures format: [{"model": "app.model", "pk": 1, "fields": {...}}, ...]
    """
    from django.apps import apps
    conflicts = []
    summary = {
        'total_records': 0,
        'new_records': 0,
        'existing_records': 0,
        'conflicts': 0,
        'models_affected': []
    }
    
    # Group records by model for easier processing
    models_data = {}
    for record in backup_data:
        model_name = record['model']
        if model_name not in models_data:
            models_data[model_name] = []
        models_data[model_name].append(record)
    
    for model_name, records in models_data.items():
        app_label, model_class = model_name.split('.')
        
        try:
            Model = apps.get_model(app_label, model_class)
            if model_name not in summary['models_affected']:
                summary['models_affected'].append(model_name)
            
            for record in records:
                summary['total_records'] += 1
                pk = record['pk']
                backup_fields = record['fields']
                
                # Check if record exists
                if Model.objects.filter(pk=pk).exists():
                    summary['existing_records'] += 1
                    
                    # Get current record for comparison
                    current_record = Model.objects.get(pk=pk)
                    
                    # Check for field conflicts
                    field_conflicts = []
                    for field_name, backup_value in backup_fields.items():
                        if hasattr(current_record, field_name):
                            current_value = getattr(current_record, field_name)
                            if str(current_value) != str(backup_value):
                                field_conflicts.append({
                                    'field': field_name,
                                    'current_value': str(current_value),
                                    'backup_value': str(backup_value)
                                })
                    
                    if field_conflicts:
                        summary['conflicts'] += 1
                        conflicts.append({
                            'model': model_name,
                            'pk': pk,
                            'action': merge_strategy,
                            'field_conflicts': field_conflicts
                        })
                else:
                    summary['new_records'] += 1
                    
        except Exception as e:
            logger.error(f"Error analyzing model {model_name}: {e}")
    
    return {
        'summary': summary,
        'conflicts': conflicts,
        'merge_strategy': merge_strategy,
        'safe_to_restore': summary['conflicts'] == 0 or merge_strategy in ['replace', 'merge']
    }


def _perform_backup_restore(backup_data, restore_plan, user):
    """
    Perform the actual backup restoration with conflict resolution
    Django fixtures format: [{"model": "app.model", "pk": 1, "fields": {...}}, ...]
    """
    from django.apps import apps
    from django.db import transaction
    
    restore_result = {
        'records_created': 0,
        'records_updated': 0,
        'records_skipped': 0,
        'errors': []
    }
    
    try:
        with transaction.atomic():
            # Group records by model for easier processing
            models_data = {}
            for record in backup_data:
                model_name = record['model']
                if model_name not in models_data:
                    models_data[model_name] = []
                models_data[model_name].append(record)
            
            for model_name, records in models_data.items():
                app_label, model_class = model_name.split('.')
                
                try:
                    Model = apps.get_model(app_label, model_class)
                    
                    for record in records:
                        pk = record['pk']
                        fields = record['fields']
                        
                        try:
                            if Model.objects.filter(pk=pk).exists():
                                # Handle existing record based on strategy
                                if restore_plan['merge_strategy'] == 'replace':
                                    Model.objects.filter(pk=pk).update(**fields)
                                    restore_result['records_updated'] += 1
                                elif restore_plan['merge_strategy'] == 'merge':
                                    # Merge only non-conflicting fields
                                    current_obj = Model.objects.get(pk=pk)
                                    updated_fields = {}
                                    
                                    for field_name, value in fields.items():
                                        if hasattr(current_obj, field_name):
                                            current_value = getattr(current_obj, field_name)
                                            if current_value is None or current_value == '':
                                                updated_fields[field_name] = value
                                    
                                    if updated_fields:
                                        Model.objects.filter(pk=pk).update(**updated_fields)
                                        restore_result['records_updated'] += 1
                                    else:
                                        restore_result['records_skipped'] += 1
                                else:  # skip
                                    restore_result['records_skipped'] += 1
                            else:
                                # Create new record
                                Model.objects.create(pk=pk, **fields)
                                restore_result['records_created'] += 1
                                
                        except Exception as e:
                            error_msg = f"Error restoring {model_name}[{pk}]: {str(e)}"
                            restore_result['errors'].append(error_msg)
                            logger.error(error_msg)
                            
                except Exception as e:
                    error_msg = f"Error processing model {model_name}: {str(e)}"
                    restore_result['errors'].append(error_msg)
                    logger.error(error_msg)
                    
    except Exception as e:
        logger.error(f"Transaction failed during restore: {str(e)}")
        raise
    
    return restore_result


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comprehensive_health_check(request):
    """
    Comprehensive health check endpoint with detailed system analysis.
    Admin/Staff only.
    """
    try:
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        health_checker = HealthChecker()
        health_status = health_checker.run_all_checks()
        
        return Response(health_status, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Comprehensive health check failed: {str(e)}")
        return Response({
            'overall_status': 'error',
            'timestamp': timezone.now().isoformat(),
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def quick_health_api(request):
    """
    Quick health check endpoint for load balancers and monitoring.
    No authentication required.
    """
    health_status = quick_health_check()
    
    # Return appropriate HTTP status based on health
    if health_status['status'] == 'healthy':
        return Response(health_status, status=status.HTTP_200_OK)
    else:
        return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_metrics(request):
    """
    Get detailed system performance metrics.
    Admin/Staff only.
    """
    try:
        user = request.user
        if user.role not in [User.Role.ADMIN, User.Role.STAFF]:
            return Response({
                'detail': 'Permission denied. Admin/Staff access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get performance metrics from monitoring system
        metrics = {
            'database': db_monitor(),
            'resources': resource_monitor(),
            'performance': performance_monitor(),
            'timestamp': timezone.now().isoformat()
        }
        
        return Response(metrics, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"System metrics check failed: {str(e)}")
        return Response({
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_metrics_prometheus(request):
    """Prometheus-compatible metrics exposition."""
    try:
        now = timezone.now()
        last_30d = now - timezone.timedelta(days=30)
        total_30d = BackupStatus.objects.filter(started_at__gte=last_30d).count()
        succ_30d = BackupStatus.objects.filter(started_at__gte=last_30d, status='success').count()
        fail_30d = BackupStatus.objects.filter(started_at__gte=last_30d, status='failed').count()
        inprog = BackupStatus.objects.filter(status='in_progress').count()
        rate_7d = 0.0
        last_7d = now - timezone.timedelta(days=7)
        total_7d = BackupStatus.objects.filter(started_at__gte=last_7d).count()
        if total_7d:
            rate_7d = BackupStatus.objects.filter(started_at__gte=last_7d, status='success').count() / total_7d

        # DB connections (Postgres only)
        active = idle = 0
        try:
            with connection.cursor() as cursor:
                if 'postgresql' in connection.settings_dict.get('ENGINE', ''):
                    cursor.execute("SELECT state, count(*) FROM pg_stat_activity GROUP BY state")
                    for state, count in cursor.fetchall():
                        st = (state or '').lower()
                        if st == 'active':
                            active = count
                        elif st == 'idle':
                            idle = count
        except Exception:
            pass

        lines = []
        lines.append(f"backup_success_total {succ_30d}")
        lines.append(f"backup_failed_total {fail_30d}")
        lines.append(f"backup_in_progress_current {inprog}")
        lines.append(f"backup_success_rate_7d {rate_7d:.3f}")
        lines.append(f"db_active_connections {active}")
        lines.append(f"db_idle_connections {idle}")
        lines.append("utils_up 1")
        body = "\n".join(lines) + "\n"
        return HttpResponse(body, content_type='text/plain; version=0.0.4')
    except Exception as e:
        logger.error(f"Prometheus metrics failed: {e}")
        return Response({'error': 'metrics unavailable'}, status=500)
