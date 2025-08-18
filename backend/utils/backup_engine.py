"""
Efficient and reliable backup engine for USC-PIS
Replaces the complex, slow backup system with fast, direct database operations
"""

import os
import gzip
import json
import time
import logging
import subprocess
import threading
import platform
from datetime import datetime
from django.conf import settings
from django.core import serializers
from django.db import connection
from django.utils import timezone
from django.apps import apps
from .models import BackupStatus

# Platform-specific imports
IS_WINDOWS = platform.system() == 'Windows'
if not IS_WINDOWS:
    import signal

logger = logging.getLogger(__name__)

class BackupTimeoutError(Exception):
    """Raised when backup operation times out"""
    pass

class BackupEngine:
    """High-performance backup engine with timeout protection"""
    
    def __init__(self, timeout_seconds=300):  # 5 minute default timeout
        self.timeout_seconds = timeout_seconds
        self.backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        self.ensure_backup_directory()
        self._timeout_occurred = False
        
    def ensure_backup_directory(self):
        """Create backup directory structure"""
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Create date-based subdirectory
        today = datetime.now().strftime('%Y/%m/%d')
        self.daily_backup_dir = os.path.join(self.backup_dir, today)
        os.makedirs(self.daily_backup_dir, exist_ok=True)
    
    def timeout_handler(self, signum=None, frame=None):
        """Signal handler for backup timeout"""
        self._timeout_occurred = True
        raise BackupTimeoutError(f"Backup timed out after {self.timeout_seconds} seconds")
    
    def _setup_timeout(self):
        """Setup timeout mechanism (platform-specific)"""
        if IS_WINDOWS:
            # Use threading timer for Windows
            timer = threading.Timer(self.timeout_seconds, self.timeout_handler)
            timer.start()
            return timer
        else:
            # Use SIGALRM for Unix-like systems
            signal.signal(signal.SIGALRM, self.timeout_handler)
            signal.alarm(self.timeout_seconds)
            return None
    
    def _clear_timeout(self, timer=None):
        """Clear timeout mechanism"""
        if IS_WINDOWS and timer:
            timer.cancel()
        elif not IS_WINDOWS:
            signal.alarm(0)
    
    def create_database_backup(self, backup_id, quick_backup=True, compress=True):
        """
        Create database backup using efficient methods
        
        Args:
            backup_id: BackupStatus record ID
            quick_backup: Skip logs and generated reports for speed
            compress: Compress backup file with gzip
            
        Returns:
            dict: Backup results with file path, size, duration
        """
        backup_record = BackupStatus.objects.get(id=backup_id)
        
        # Set up timeout protection
        timer = self._setup_timeout()
        
        start_time = time.time()
        temp_file = None
        
        try:
            # Generate backup filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'database_backup_{timestamp}'
            if compress:
                filename += '.json.gz'
                temp_file = os.path.join(self.daily_backup_dir, filename)
            else:
                filename += '.json'
                temp_file = os.path.join(self.daily_backup_dir, filename)
            
            logger.info(f"Starting database backup to {temp_file}")
            
            # Use fast backup method
            if self._is_small_database():
                self._create_fast_json_backup(temp_file, quick_backup, compress)
            else:
                self._create_chunked_backup(temp_file, quick_backup, compress)
            
            # Calculate results
            duration = time.time() - start_time
            file_size = os.path.getsize(temp_file)
            file_size_mb = file_size / (1024 * 1024)
            
            # Update backup record
            backup_record.status = 'success'
            backup_record.completed_at = timezone.now()
            backup_record.duration_seconds_stored = duration
            backup_record.file_size = file_size
            backup_record.metadata.update({
                'backup_method': 'fast_json' if self._is_small_database() else 'chunked',
                'compressed': compress,
                'file_path': temp_file,
                'filename': filename
            })
            backup_record.save()
            
            logger.info(f"Backup completed in {duration:.2f}s, size: {file_size_mb:.2f}MB")
            
            return {
                'success': True,
                'file_path': temp_file,
                'filename': filename,
                'duration': duration,
                'file_size_mb': file_size_mb,
                'compressed': compress
            }
            
        except BackupTimeoutError:
            logger.error(f"Backup {backup_id} timed out after {self.timeout_seconds} seconds")
            self._cleanup_failed_backup(backup_record, temp_file, "Backup timed out")
            raise
            
        except Exception as e:
            logger.error(f"Backup {backup_id} failed: {str(e)}")
            self._cleanup_failed_backup(backup_record, temp_file, str(e))
            raise
            
        finally:
            # Clear timeout
            self._clear_timeout(timer)
    
    def _is_small_database(self):
        """Check if database is small enough for single-pass backup"""
        # Count total records across all models
        total_records = 0
        for model in apps.get_models():
            try:
                total_records += model.objects.count()
                if total_records > 10000:  # Threshold for chunked processing
                    return False
            except Exception:
                continue
        return True
    
    def _create_fast_json_backup(self, file_path, quick_backup, compress):
        """Create backup using Django serializers for small databases"""
        
        # Get apps to include
        apps_to_backup = self._get_apps_to_backup(quick_backup)
        
        # Serialize data
        backup_data = []
        for app_label in apps_to_backup:
            try:
                # Use dumpdata equivalent but in memory
                app_models = [model for model in apps.get_models() 
                             if model._meta.app_label == app_label]
                
                for model in app_models:
                    queryset = model.objects.all()
                    serialized = serializers.serialize('json', queryset)
                    model_data = json.loads(serialized)
                    backup_data.extend(model_data)
                    
            except Exception as e:
                logger.warning(f"Skipping app {app_label}: {e}")
        
        # Write to file
        if compress:
            with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, default=str)
        else:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, default=str)
    
    def _create_chunked_backup(self, file_path, quick_backup, compress):
        """Create backup using chunked processing for larger databases"""
        
        apps_to_backup = self._get_apps_to_backup(quick_backup)
        chunk_size = 1000
        
        # Open file for writing
        if compress:
            file_handle = gzip.open(file_path, 'wt', encoding='utf-8')
        else:
            file_handle = open(file_path, 'w', encoding='utf-8')
        
        try:
            file_handle.write('[\n')
            first_record = True
            
            for app_label in apps_to_backup:
                app_models = [model for model in apps.get_models() 
                             if model._meta.app_label == app_label]
                
                for model in app_models:
                    # Process in chunks
                    total_count = model.objects.count()
                    for offset in range(0, total_count, chunk_size):
                        queryset = model.objects.all()[offset:offset + chunk_size]
                        serialized = serializers.serialize('json', queryset)
                        model_data = json.loads(serialized)
                        
                        for record in model_data:
                            if not first_record:
                                file_handle.write(',\n')
                            json.dump(record, file_handle, default=str)
                            first_record = False
            
            file_handle.write('\n]')
            
        finally:
            file_handle.close()
    
    def _get_apps_to_backup(self, quick_backup):
        """Get list of apps to include in backup"""
        essential_apps = [
            'authentication',
            'patients', 
            'health_info',
            'medical_certificates',
            'feedback',
            'file_uploads',
            'notifications'
        ]
        
        if quick_backup:
            # Skip logs and reports for speed
            return essential_apps
        else:
            # Include everything
            return essential_apps + ['reports', 'utils']
    
    def _cleanup_failed_backup(self, backup_record, temp_file, error_message):
        """Clean up after failed backup"""
        # Remove partial file
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception as e:
                logger.error(f"Failed to cleanup {temp_file}: {e}")
        
        # Update backup record
        backup_record.status = 'failed'
        backup_record.completed_at = timezone.now()
        backup_record.error_message = error_message
        backup_record.save()
    
    def verify_backup(self, backup_path):
        """Verify backup file integrity"""
        try:
            if backup_path.endswith('.gz'):
                with gzip.open(backup_path, 'rt', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                with open(backup_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            # Basic validation
            if not isinstance(data, list):
                return False, "Invalid backup format"
            
            if len(data) == 0:
                return False, "Empty backup file"
            
            # Check for required fields in first record
            if data[0] and 'model' in data[0] and 'fields' in data[0]:
                return True, f"Valid backup with {len(data)} records"
            else:
                return False, "Invalid record format"
                
        except Exception as e:
            return False, f"Verification failed: {str(e)}"
    
    def create_backup_async(self, backup_type='database', quick_backup=True, verify_integrity=True):
        """
        Create backup asynchronously with proper tracking
        
        Returns:
            int: Backup ID for tracking
        """
        # Create backup record
        backup_record = BackupStatus.objects.create(
            backup_type=backup_type,
            status='in_progress',
            metadata={
                'quick_backup': quick_backup,
                'verify_requested': verify_integrity,
                'method': 'backup_engine_v2'
            }
        )
        
        try:
            if backup_type == 'database':
                result = self.create_database_backup(
                    backup_record.id, 
                    quick_backup=quick_backup,
                    compress=True
                )
                
                # Verify if requested
                if verify_integrity and result['success']:
                    is_valid, message = self.verify_backup(result['file_path'])
                    if not is_valid:
                        raise Exception(f"Backup verification failed: {message}")
                    
                    backup_record.metadata['verification_result'] = message
                    backup_record.save()
                
                return backup_record.id
                
            else:
                raise NotImplementedError(f"Backup type '{backup_type}' not yet supported")
                
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.completed_at = timezone.now()
            backup_record.error_message = str(e)
            backup_record.save()
            raise