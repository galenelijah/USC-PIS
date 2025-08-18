"""
Ultra-fast backup engine using native Django commands and efficient file operations
Replaces the slow ORM-based backup system with optimized native tools
"""

import os
import gzip
import json
import time
import logging
import subprocess
import threading
import platform
import zipfile
import shutil
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.core.management import call_command
from django.core.management.base import CommandError
from io import StringIO
from .models import BackupStatus

# Platform-specific imports
IS_WINDOWS = platform.system() == 'Windows'
if not IS_WINDOWS:
    import signal

logger = logging.getLogger(__name__)

class BackupTimeoutError(Exception):
    """Raised when backup operation times out"""
    pass

class FastBackupEngine:
    """Ultra-fast backup engine using native Django tools and efficient file operations"""
    
    def __init__(self, timeout_seconds=120):  # Reduced to 2 minutes default
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
            timer = threading.Timer(self.timeout_seconds, self.timeout_handler)
            timer.start()
            return timer
        else:
            signal.signal(signal.SIGALRM, self.timeout_handler)
            signal.alarm(self.timeout_seconds)
            return None
    
    def _clear_timeout(self, timer=None):
        """Clear timeout mechanism"""
        if IS_WINDOWS and timer:
            timer.cancel()
        elif not IS_WINDOWS:
            signal.alarm(0)
    
    def create_database_backup_fast(self, backup_id, quick_backup=True, compress=True):
        """
        Ultra-fast database backup using Django's dumpdata command
        
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
            filename = f'database_backup_fast_{timestamp}'
            if compress:
                filename += '.json.gz'
            else:
                filename += '.json'
            temp_file = os.path.join(self.daily_backup_dir, filename)
            
            logger.info(f"Starting fast database backup to {temp_file}")
            
            # Use Django's dumpdata command for maximum speed
            apps_to_backup = self._get_apps_to_backup(quick_backup)
            
            # Create StringIO buffer to capture output
            output_buffer = StringIO()
            
            # Use dumpdata command - much faster than ORM
            try:
                call_command(
                    'dumpdata',
                    *apps_to_backup,
                    format='json',
                    indent=2,
                    stdout=output_buffer,
                    verbosity=0
                )
                
                # Get the JSON data
                json_data = output_buffer.getvalue()
                output_buffer.close()
                
                # Write to file with optional compression
                if compress:
                    with gzip.open(temp_file, 'wt', encoding='utf-8') as f:
                        f.write(json_data)
                else:
                    with open(temp_file, 'w', encoding='utf-8') as f:
                        f.write(json_data)
                        
            except CommandError as e:
                raise Exception(f"Django dumpdata failed: {str(e)}")
            
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
                'backup_method': 'fast_dumpdata',
                'compressed': compress,
                'file_path': temp_file,
                'filename': filename,
                'apps_included': apps_to_backup
            })
            backup_record.save()
            
            logger.info(f"Fast backup completed in {duration:.2f}s, size: {file_size_mb:.2f}MB")
            
            return {
                'success': True,
                'file_path': temp_file,
                'filename': filename,
                'duration': duration,
                'file_size_mb': file_size_mb,
                'compressed': compress
            }
            
        except BackupTimeoutError:
            logger.error(f"Fast backup {backup_id} timed out after {self.timeout_seconds} seconds")
            self._cleanup_failed_backup(backup_record, temp_file, "Backup timed out")
            raise
            
        except Exception as e:
            logger.error(f"Fast backup {backup_id} failed: {str(e)}")
            self._cleanup_failed_backup(backup_record, temp_file, str(e))
            raise
            
        finally:
            self._clear_timeout(timer)
    
    def create_media_backup(self, backup_id):
        """
        Create backup of media files
        
        Args:
            backup_id: BackupStatus record ID
            
        Returns:
            dict: Backup results with file path, size, duration
        """
        backup_record = BackupStatus.objects.get(id=backup_id)
        
        timer = self._setup_timeout()
        start_time = time.time()
        temp_file = None
        
        try:
            # Generate backup filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'media_backup_{timestamp}.zip'
            temp_file = os.path.join(self.daily_backup_dir, filename)
            
            logger.info(f"Starting media backup to {temp_file}")
            
            # Get media directories to backup
            media_dirs = [
                settings.MEDIA_ROOT,
                os.path.join(settings.BASE_DIR, 'staticfiles'),  # Collected static files
            ]
            
            # Create ZIP archive
            with zipfile.ZipFile(temp_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                files_added = 0
                
                for media_dir in media_dirs:
                    if os.path.exists(media_dir):
                        for root, dirs, files in os.walk(media_dir):
                            for file in files:
                                file_path = os.path.join(root, file)
                                # Calculate relative path for archive
                                arcname = os.path.relpath(file_path, settings.BASE_DIR)
                                zipf.write(file_path, arcname)
                                files_added += 1
                
                logger.info(f"Added {files_added} files to media backup")
            
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
                'backup_method': 'media_zip',
                'compressed': True,
                'file_path': temp_file,
                'filename': filename,
                'files_count': files_added,
                'media_dirs': media_dirs
            })
            backup_record.save()
            
            logger.info(f"Media backup completed in {duration:.2f}s, size: {file_size_mb:.2f}MB")
            
            return {
                'success': True,
                'file_path': temp_file,
                'filename': filename,
                'duration': duration,
                'file_size_mb': file_size_mb,
                'files_count': files_added
            }
            
        except BackupTimeoutError:
            logger.error(f"Media backup {backup_id} timed out")
            self._cleanup_failed_backup(backup_record, temp_file, "Media backup timed out")
            raise
            
        except Exception as e:
            logger.error(f"Media backup {backup_id} failed: {str(e)}")
            self._cleanup_failed_backup(backup_record, temp_file, str(e))
            raise
            
        finally:
            self._clear_timeout(timer)
    
    def create_full_backup(self, backup_id, quick_backup=True):
        """
        Create full system backup (database + media)
        
        Args:
            backup_id: BackupStatus record ID
            quick_backup: Skip logs and generated reports for speed
            
        Returns:
            dict: Backup results with file path, size, duration
        """
        backup_record = BackupStatus.objects.get(id=backup_id)
        
        timer = self._setup_timeout()
        start_time = time.time()
        temp_file = None
        
        try:
            # Generate backup filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'full_backup_{timestamp}.zip'
            temp_file = os.path.join(self.daily_backup_dir, filename)
            
            logger.info(f"Starting full backup to {temp_file}")
            
            # Create temporary database backup first
            db_temp_file = os.path.join(self.daily_backup_dir, f'temp_db_{timestamp}.json')
            
            # Get database backup data using dumpdata
            apps_to_backup = self._get_apps_to_backup(quick_backup)
            output_buffer = StringIO()
            
            call_command(
                'dumpdata',
                *apps_to_backup,
                format='json',
                indent=2,
                stdout=output_buffer,
                verbosity=0
            )
            
            # Write database backup to temp file
            with open(db_temp_file, 'w', encoding='utf-8') as f:
                f.write(output_buffer.getvalue())
            output_buffer.close()
            
            # Create ZIP archive with both database and media
            with zipfile.ZipFile(temp_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                files_added = 0
                
                # Add database backup
                zipf.write(db_temp_file, f'database_backup_{timestamp}.json')
                files_added += 1
                
                # Add media files
                media_dirs = [
                    settings.MEDIA_ROOT,
                    os.path.join(settings.BASE_DIR, 'staticfiles'),
                ]
                
                for media_dir in media_dirs:
                    if os.path.exists(media_dir):
                        for root, dirs, files in os.walk(media_dir):
                            for file in files:
                                file_path = os.path.join(root, file)
                                arcname = os.path.relpath(file_path, settings.BASE_DIR)
                                zipf.write(file_path, arcname)
                                files_added += 1
                
                logger.info(f"Added {files_added} files to full backup")
            
            # Clean up temporary database file
            if os.path.exists(db_temp_file):
                os.remove(db_temp_file)
            
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
                'backup_method': 'full_system',
                'compressed': True,
                'file_path': temp_file,
                'filename': filename,
                'files_count': files_added,
                'includes_database': True,
                'includes_media': True,
                'apps_included': apps_to_backup
            })
            backup_record.save()
            
            logger.info(f"Full backup completed in {duration:.2f}s, size: {file_size_mb:.2f}MB")
            
            return {
                'success': True,
                'file_path': temp_file,
                'filename': filename,
                'duration': duration,
                'file_size_mb': file_size_mb,
                'files_count': files_added
            }
            
        except BackupTimeoutError:
            logger.error(f"Full backup {backup_id} timed out")
            self._cleanup_failed_backup(backup_record, temp_file, "Full backup timed out")
            raise
            
        except Exception as e:
            logger.error(f"Full backup {backup_id} failed: {str(e)}")
            self._cleanup_failed_backup(backup_record, temp_file, str(e))
            raise
            
        finally:
            self._clear_timeout(timer)
    
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
            return essential_apps
        else:
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
            if backup_path.endswith('.zip'):
                # Verify ZIP file
                with zipfile.ZipFile(backup_path, 'r') as zipf:
                    bad_files = zipf.testzip()
                    if bad_files:
                        return False, f"Corrupted files in ZIP: {bad_files}"
                    file_count = len(zipf.namelist())
                    return True, f"Valid ZIP backup with {file_count} files"
                    
            elif backup_path.endswith('.gz'):
                # Verify gzipped JSON
                with gzip.open(backup_path, 'rt', encoding='utf-8') as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    return False, "Invalid backup format"
                return True, f"Valid compressed backup with {len(data)} records"
                
            else:
                # Verify plain JSON
                with open(backup_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    return False, "Invalid backup format"
                return True, f"Valid backup with {len(data)} records"
                
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
                'method': 'fast_backup_engine_v3'
            }
        )
        
        try:
            if backup_type == 'database':
                result = self.create_database_backup_fast(
                    backup_record.id, 
                    quick_backup=quick_backup,
                    compress=True
                )
            elif backup_type == 'media':
                result = self.create_media_backup(backup_record.id)
            elif backup_type == 'full':
                result = self.create_full_backup(
                    backup_record.id,
                    quick_backup=quick_backup
                )
            else:
                raise Exception(f"Unsupported backup type: {backup_type}")
                
            # Refresh backup record to get updated status
            backup_record.refresh_from_db()
            
            # Verify if requested
            if verify_integrity and result['success']:
                is_valid, message = self.verify_backup(result['file_path'])
                if not is_valid:
                    raise Exception(f"Backup verification failed: {message}")
                
                backup_record.metadata['verification_result'] = message
                backup_record.save()
            
            return backup_record.id
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.completed_at = timezone.now()
            backup_record.error_message = str(e)
            backup_record.save()
            raise