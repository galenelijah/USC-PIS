"""
Backup services for web-based backup management
No external CLI dependencies - everything managed through Django admin
"""

import os
import json
import hashlib
import subprocess
import tempfile
import shutil
from datetime import datetime, timedelta
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import BackupStatus, BackupSchedule, SystemHealthMetric
import logging

logger = logging.getLogger(__name__)


class BackupService:
    """
    Web-based backup service that can be triggered from Django admin
    """
    
    def create_backup(self, backup_type='full', verify=True, created_by=None):
        """
        Create a backup that can be triggered from admin interface
        Returns backup status object
        """
        backup_record = BackupStatus.objects.create(
            backup_type=backup_type,
            status='in_progress',
            created_by=created_by,
            metadata={
                'triggered_from_admin': True,
                'verify_requested': verify,
                'started_at': timezone.now().isoformat()
            }
        )
        
        try:
            # Create backup directory
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            backup_files = []
            total_size = 0
            
            # Database backup
            if backup_type in ['database', 'full']:
                db_file = self._create_database_backup(backup_dir, timestamp)
                if db_file:
                    backup_files.append(db_file)
                    total_size += os.path.getsize(db_file)
            
            # Media files backup
            if backup_type in ['media', 'full']:
                media_files = self._create_media_backup(backup_dir, timestamp)
                backup_files.extend(media_files)
                for file_path in media_files:
                    if os.path.exists(file_path):
                        total_size += os.path.getsize(file_path)
            
            # Verify backup if requested
            checksums = {}
            if verify:
                checksums = self._calculate_checksums(backup_files)
            
            # Update backup record
            backup_record.status = 'success'
            backup_record.completed_at = timezone.now()
            backup_record.file_size = total_size
            backup_record.checksum = checksums.get('primary', '')
            backup_record.metadata.update({
                'files': backup_files,
                'checksums': checksums,
                'total_files': len(backup_files),
                'completed_at': timezone.now().isoformat()
            })
            backup_record.save()
            
            logger.info(f"Backup {backup_record.id} completed successfully")
            return backup_record
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.error_message = str(e)
            backup_record.completed_at = timezone.now()
            backup_record.metadata.update({
                'error_details': str(e),
                'failed_at': timezone.now().isoformat()
            })
            backup_record.save()
            
            logger.error(f"Backup {backup_record.id} failed: {str(e)}")
            
            # Send alert email for failed backup
            self._send_backup_alert(backup_record)
            
            raise e
    
    def _create_database_backup(self, backup_dir, timestamp):
        """Create database backup using Django's dumpdata"""
        try:
            db_file = os.path.join(backup_dir, f'database_backup_{timestamp}.json')
            
            # Use Django's dumpdata command
            with open(db_file, 'w') as f:
                call_command('dumpdata', 
                           exclude=['contenttypes', 'sessions', 'admin.logentry'],
                           indent=2,
                           stdout=f)
            
            logger.info(f"Database backup created: {db_file}")
            return db_file
            
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise e
    
    def _create_media_backup(self, backup_dir, timestamp):
        """Create backup of media files"""
        try:
            media_root = settings.MEDIA_ROOT
            if not os.path.exists(media_root):
                logger.info("No media directory found, skipping media backup")
                return []
            
            media_backup_dir = os.path.join(backup_dir, f'media_backup_{timestamp}')
            
            # Copy entire media directory
            if os.path.exists(media_root):
                shutil.copytree(media_root, media_backup_dir)
                logger.info(f"Media backup created: {media_backup_dir}")
                return [media_backup_dir]
            else:
                return []
                
        except Exception as e:
            logger.error(f"Media backup failed: {str(e)}")
            return []
    
    def _calculate_checksums(self, file_list):
        """Calculate checksums for backup verification"""
        checksums = {}
        
        for file_path in file_list:
            if os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    file_hash = hashlib.md5(f.read()).hexdigest()
                    checksums[os.path.basename(file_path)] = file_hash
            elif os.path.isdir(file_path):
                # For directories, create hash of all file names and sizes
                dir_info = []
                for root, dirs, files in os.walk(file_path):
                    for file in files:
                        full_path = os.path.join(root, file)
                        size = os.path.getsize(full_path)
                        dir_info.append(f"{file}:{size}")
                
                dir_hash = hashlib.md5('\n'.join(sorted(dir_info)).encode()).hexdigest()
                checksums[os.path.basename(file_path)] = dir_hash
        
        # Create overall checksum
        if checksums:
            all_checksums = '\n'.join(f"{k}:{v}" for k, v in sorted(checksums.items()))
            checksums['primary'] = hashlib.md5(all_checksums.encode()).hexdigest()
        
        return checksums
    
    def verify_backup(self, backup_id):
        """Verify a specific backup's integrity"""
        try:
            backup = BackupStatus.objects.get(id=backup_id)
            
            verification_result = {
                'backup_id': backup_id,
                'verification_time': timezone.now().isoformat(),
                'files_verified': 0,
                'files_missing': 0,
                'checksum_mismatches': 0,
                'overall_status': 'success',
                'details': []
            }
            
            backup_files = backup.metadata.get('files', [])
            stored_checksums = backup.metadata.get('checksums', {})
            
            for file_path in backup_files:
                if os.path.exists(file_path):
                    verification_result['files_verified'] += 1
                    
                    # Verify checksum if available
                    filename = os.path.basename(file_path)
                    if filename in stored_checksums:
                        if os.path.isfile(file_path):
                            current_hash = hashlib.md5(open(file_path, 'rb').read()).hexdigest()
                        else:
                            # Directory checksum
                            dir_info = []
                            for root, dirs, files in os.walk(file_path):
                                for file in files:
                                    full_path = os.path.join(root, file)
                                    size = os.path.getsize(full_path)
                                    dir_info.append(f"{file}:{size}")
                            current_hash = hashlib.md5('\n'.join(sorted(dir_info)).encode()).hexdigest()
                        
                        if current_hash != stored_checksums[filename]:
                            verification_result['checksum_mismatches'] += 1
                            verification_result['overall_status'] = 'warning'
                            verification_result['details'].append(f"Checksum mismatch: {filename}")
                else:
                    verification_result['files_missing'] += 1
                    verification_result['overall_status'] = 'failed'
                    verification_result['details'].append(f"Missing file: {file_path}")
            
            # Log verification result
            BackupStatus.objects.create(
                backup_type='verification',
                status=verification_result['overall_status'],
                completed_at=timezone.now(),
                metadata=verification_result
            )
            
            return verification_result
            
        except BackupStatus.DoesNotExist:
            raise ValueError(f"Backup {backup_id} not found")
        except Exception as e:
            logger.error(f"Backup verification failed: {str(e)}")
            raise e
    
    def get_backup_health_summary(self):
        """Get comprehensive backup system health"""
        return BackupStatus.get_backup_health_summary()
    
    def cleanup_old_backups(self, retention_days=7):
        """Clean up old backup files based on retention policy"""
        try:
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            if not os.path.exists(backup_dir):
                return {'cleaned_files': 0, 'cleaned_size': 0}
            
            cutoff_date = timezone.now() - timedelta(days=retention_days)
            cleaned_files = 0
            cleaned_size = 0
            
            # Clean up old backup files
            for item in os.listdir(backup_dir):
                item_path = os.path.join(backup_dir, item)
                
                # Check file modification time
                mod_time = datetime.fromtimestamp(os.path.getmtime(item_path))
                mod_time = timezone.make_aware(mod_time)
                
                if mod_time < cutoff_date:
                    if os.path.isfile(item_path):
                        size = os.path.getsize(item_path)
                        os.remove(item_path)
                        cleaned_size += size
                        cleaned_files += 1
                    elif os.path.isdir(item_path):
                        # Calculate directory size
                        for root, dirs, files in os.walk(item_path):
                            for file in files:
                                cleaned_size += os.path.getsize(os.path.join(root, file))
                                cleaned_files += 1
                        shutil.rmtree(item_path)
            
            # Log cleanup operation
            BackupStatus.objects.create(
                backup_type='cleanup',
                status='success',
                completed_at=timezone.now(),
                metadata={
                    'retention_days': retention_days,
                    'cleaned_files': cleaned_files,
                    'cleaned_size_mb': round(cleaned_size / (1024 * 1024), 2),
                    'cleanup_date': timezone.now().isoformat()
                }
            )
            
            return {
                'cleaned_files': cleaned_files,
                'cleaned_size': cleaned_size,
                'cleaned_size_mb': round(cleaned_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logger.error(f"Backup cleanup failed: {str(e)}")
            raise e
    
    def _send_backup_alert(self, backup_record):
        """Send email alert for backup issues"""
        try:
            alert_email = getattr(settings, 'BACKUP_ALERT_EMAIL', None)
            if not alert_email:
                # Try to get admin email
                admins = getattr(settings, 'ADMINS', [])
                if admins:
                    alert_email = admins[0][1]
                else:
                    logger.warning("No alert email configured for backup notifications")
                    return
            
            subject = f'USC-PIS Backup Alert - {backup_record.get_status_display()}'
            
            context = {
                'backup_record': backup_record,
                'site_name': 'USC-PIS',
                'timestamp': timezone.now(),
            }
            
            # Render email content
            html_message = render_to_string('emails/backup_alert.html', context)
            plain_message = render_to_string('emails/backup_alert.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert_email],
                html_message=html_message,
                fail_silently=True  # Don't fail backup if email fails
            )
            
            logger.info(f"Backup alert email sent to {alert_email}")
            
        except Exception as e:
            logger.error(f"Failed to send backup alert email: {str(e)}")


class BackupScheduleService:
    """
    Manage backup schedules through web interface
    """
    
    def create_schedule(self, backup_type, schedule_type, schedule_time, retention_days=7):
        """Create a new backup schedule"""
        schedule = BackupSchedule.objects.create(
            backup_type=backup_type,
            schedule_type=schedule_type,
            schedule_time=schedule_time,
            retention_days=retention_days,
            is_active=True
        )
        
        logger.info(f"Backup schedule created: {schedule}")
        return schedule
    
    def get_due_backups(self):
        """Get backups that are due to run"""
        due_backups = []
        active_schedules = BackupSchedule.objects.filter(is_active=True)
        
        for schedule in active_schedules:
            if self._is_backup_due(schedule):
                due_backups.append(schedule)
        
        return due_backups
    
    def _is_backup_due(self, schedule):
        """Check if a backup is due based on schedule"""
        now = timezone.now()
        today = now.date()
        
        # Get last backup of this type
        last_backup = BackupStatus.objects.filter(
            backup_type=schedule.backup_type,
            status='success'
        ).first()
        
        if not last_backup:
            return True  # No previous backup, so it's due
        
        # Check based on schedule type
        if schedule.schedule_type == 'daily':
            return last_backup.started_at.date() < today
        elif schedule.schedule_type == 'weekly':
            days_since = (today - last_backup.started_at.date()).days
            return days_since >= 7
        elif schedule.schedule_type == 'monthly':
            return (last_backup.started_at.date().month != today.month or 
                   last_backup.started_at.date().year != today.year)
        
        return False


class BackupMonitoringService:
    """
    Monitor backup system health and generate alerts
    """
    
    def check_system_health(self):
        """Comprehensive backup system health check"""
        health_status = {
            'timestamp': timezone.now().isoformat(),
            'overall_health': 'healthy',
            'issues': [],
            'recommendations': [],
            'metrics': {}
        }
        
        # Check recent backup activity
        last_24h = timezone.now() - timedelta(hours=24)
        recent_backups = BackupStatus.objects.filter(started_at__gte=last_24h)
        failed_backups = recent_backups.filter(status='failed')
        
        health_status['metrics']['recent_backups_24h'] = recent_backups.count()
        health_status['metrics']['failed_backups_24h'] = failed_backups.count()
        
        # Check for backup failures
        if failed_backups.exists():
            health_status['overall_health'] = 'warning'
            health_status['issues'].append({
                'type': 'recent_failures',
                'severity': 'high',
                'message': f'{failed_backups.count()} backup failures in the last 24 hours'
            })
        
        # Check for old backups
        last_successful = BackupStatus.objects.filter(
            backup_type__in=['database', 'full'],
            status='success'
        ).first()
        
        if last_successful:
            hours_since = (timezone.now() - last_successful.started_at).total_seconds() / 3600
            health_status['metrics']['hours_since_last_backup'] = round(hours_since, 1)
            
            if hours_since > 48:
                health_status['overall_health'] = 'critical'
                health_status['issues'].append({
                    'type': 'stale_backups',
                    'severity': 'critical',
                    'message': f'Last successful backup was {round(hours_since, 1)} hours ago'
                })
            elif hours_since > 30:
                health_status['overall_health'] = 'warning'
                health_status['issues'].append({
                    'type': 'stale_backups',
                    'severity': 'warning',
                    'message': f'Last successful backup was {round(hours_since, 1)} hours ago'
                })
        else:
            health_status['overall_health'] = 'critical'
            health_status['issues'].append({
                'type': 'no_backups',
                'severity': 'critical',
                'message': 'No successful backups found'
            })
        
        # Generate recommendations
        if not health_status['issues']:
            health_status['recommendations'].append({
                'type': 'maintenance',
                'message': 'System is healthy. Continue regular monitoring.'
            })
        else:
            health_status['recommendations'].append({
                'type': 'immediate_action',
                'message': 'Address backup issues immediately to prevent data loss.'
            })
        
        # Record health metric
        SystemHealthMetric.objects.create(
            metric_type='backup_health',
            value=100 if health_status['overall_health'] == 'healthy' else 
                  75 if health_status['overall_health'] == 'warning' else 25,
            unit='%',
            details=health_status
        )
        
        return health_status
    
    def send_health_report(self, force_send=False):
        """Send health report if issues are detected"""
        health_status = self.check_system_health()
        
        # Only send if there are issues or force_send is True
        if health_status['issues'] or force_send:
            try:
                backup_service = BackupService()
                
                # Create a mock backup record for email template
                mock_backup = type('MockBackup', (), {
                    'get_status_display': lambda: health_status['overall_health'].title(),
                    'started_at': timezone.now(),
                    'backup_type': 'health_check',
                    'metadata': health_status
                })()
                
                backup_service._send_backup_alert(mock_backup)
                
            except Exception as e:
                logger.error(f"Failed to send health report: {str(e)}")
        
        return health_status


# Create service instances
backup_service = BackupService()
schedule_service = BackupScheduleService()
monitoring_service = BackupMonitoringService()