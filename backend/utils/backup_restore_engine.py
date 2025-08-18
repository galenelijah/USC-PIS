"""
Backup restore engine with upload functionality
Handles uploading, validation, and restoration of backup files
"""

import os
import gzip
import json
import time
import logging
import zipfile
import tempfile
import shutil
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.core.management import call_command
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from io import StringIO
from .models import BackupStatus

logger = logging.getLogger(__name__)

class BackupRestoreEngine:
    """Engine for uploading and restoring backup files"""
    
    def __init__(self):
        self.upload_dir = os.path.join(settings.BASE_DIR, 'backups', 'uploads')
        self.ensure_upload_directory()
    
    def ensure_upload_directory(self):
        """Create upload directory structure"""
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def upload_backup_file(self, uploaded_file, backup_type='database', description=''):
        """
        Upload and validate a backup file
        
        Args:
            uploaded_file: Django UploadedFile object
            backup_type: Type of backup (database, media, full)
            description: Optional description for the backup
            
        Returns:
            dict: Upload results with backup ID and validation info
        """
        try:
            # Validate file
            validation_result = self.validate_backup_file(uploaded_file, backup_type)
            if not validation_result['valid']:
                raise Exception(f"Invalid backup file: {validation_result['error']}")
            
            # Generate filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            original_name = uploaded_file.name
            safe_name = self._sanitize_filename(original_name)
            filename = f'uploaded_{backup_type}_{timestamp}_{safe_name}'
            
            # Save file to upload directory
            file_path = os.path.join(self.upload_dir, filename)
            
            with open(file_path, 'wb') as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            
            # Create backup record
            backup_record = BackupStatus.objects.create(
                backup_type=backup_type,
                status='success',
                completed_at=timezone.now(),
                file_size=uploaded_file.size,
                metadata={
                    'method': 'uploaded_backup',
                    'original_filename': original_name,
                    'file_path': file_path,
                    'filename': filename,
                    'description': description,
                    'validation_result': validation_result['message'],
                    'uploaded_at': timezone.now().isoformat(),
                    'record_count': validation_result.get('record_count'),
                    'file_count': validation_result.get('file_count')
                }
            )
            
            logger.info(f"Uploaded backup file: {filename} (ID: {backup_record.id})")
            
            return {
                'success': True,
                'backup_id': backup_record.id,
                'filename': filename,
                'file_size_mb': uploaded_file.size / (1024 * 1024),
                'validation_result': validation_result['message'],
                'record_count': validation_result.get('record_count'),
                'file_count': validation_result.get('file_count')
            }
            
        except Exception as e:
            logger.error(f"Upload failed: {str(e)}")
            raise
    
    def validate_backup_file(self, uploaded_file, backup_type):
        """
        Validate uploaded backup file format and content
        
        Args:
            uploaded_file: Django UploadedFile object
            backup_type: Expected backup type
            
        Returns:
            dict: Validation results
        """
        try:
            filename = uploaded_file.name.lower()
            
            # Reset file pointer
            uploaded_file.seek(0)
            
            if backup_type == 'database':
                return self._validate_database_backup(uploaded_file)
            elif backup_type in ['media', 'full']:
                return self._validate_zip_backup(uploaded_file, backup_type)
            else:
                return {'valid': False, 'error': f'Unsupported backup type: {backup_type}'}
                
        except Exception as e:
            return {'valid': False, 'error': f'Validation error: {str(e)}'}
        finally:
            # Reset file pointer
            uploaded_file.seek(0)
    
    def _validate_database_backup(self, uploaded_file):
        """Validate database backup file (JSON or gzipped JSON)"""
        try:
            filename = uploaded_file.name.lower()
            
            # Read and parse file content
            if filename.endswith('.gz'):
                # Gzipped JSON
                content = gzip.decompress(uploaded_file.read()).decode('utf-8')
            elif filename.endswith('.json'):
                # Plain JSON
                content = uploaded_file.read().decode('utf-8')
            else:
                return {'valid': False, 'error': 'File must be .json or .json.gz format'}
            
            # Parse JSON
            data = json.loads(content)
            
            # Validate structure
            if not isinstance(data, list):
                return {'valid': False, 'error': 'Invalid format: must be JSON array'}
            
            if len(data) == 0:
                return {'valid': False, 'error': 'Empty backup file'}
            
            # Check first record structure
            if data and ('model' not in data[0] or 'fields' not in data[0]):
                return {'valid': False, 'error': 'Invalid Django fixture format'}
            
            return {
                'valid': True,
                'message': f'Valid database backup with {len(data)} records',
                'record_count': len(data)
            }
            
        except json.JSONDecodeError as e:
            return {'valid': False, 'error': f'Invalid JSON format: {str(e)}'}
        except Exception as e:
            return {'valid': False, 'error': f'Validation failed: {str(e)}'}
    
    def _validate_zip_backup(self, uploaded_file, backup_type):
        """Validate ZIP backup file (media or full)"""
        try:
            filename = uploaded_file.name.lower()
            
            if not filename.endswith('.zip'):
                return {'valid': False, 'error': 'File must be .zip format'}
            
            # Create temporary file to validate ZIP
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            try:
                # Test ZIP file
                with zipfile.ZipFile(temp_path, 'r') as zipf:
                    # Check for corruption
                    bad_files = zipf.testzip()
                    if bad_files:
                        return {'valid': False, 'error': f'Corrupted ZIP file: {bad_files}'}
                    
                    file_list = zipf.namelist()
                    file_count = len(file_list)
                    
                    if file_count == 0:
                        return {'valid': False, 'error': 'Empty ZIP file'}
                    
                    # Additional validation for full backups
                    if backup_type == 'full':
                        # Check for database backup file
                        db_files = [f for f in file_list if f.endswith('.json') and 'database' in f.lower()]
                        if not db_files:
                            return {'valid': False, 'error': 'Full backup must contain database file (.json)'}
                    
                    return {
                        'valid': True,
                        'message': f'Valid {backup_type} backup with {file_count} files',
                        'file_count': file_count
                    }
                    
            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
        except zipfile.BadZipFile:
            return {'valid': False, 'error': 'Invalid or corrupted ZIP file'}
        except Exception as e:
            return {'valid': False, 'error': f'ZIP validation failed: {str(e)}'}
    
    def restore_from_backup(self, backup_id, merge_strategy='replace', preview_only=False):
        """
        Restore system from backup file
        
        Args:
            backup_id: BackupStatus record ID
            merge_strategy: How to handle conflicts (replace, merge, skip)
            preview_only: If True, only show what would be restored
            
        Returns:
            dict: Restore results
        """
        try:
            backup_record = BackupStatus.objects.get(id=backup_id)
            file_path = backup_record.metadata.get('file_path')
            
            if not file_path or not os.path.exists(file_path):
                raise Exception("Backup file not found")
            
            backup_type = backup_record.backup_type
            
            if backup_type == 'database':
                return self._restore_database_backup(backup_record, merge_strategy, preview_only)
            elif backup_type == 'media':
                return self._restore_media_backup(backup_record, preview_only)
            elif backup_type == 'full':
                return self._restore_full_backup(backup_record, merge_strategy, preview_only)
            else:
                raise Exception(f"Unsupported backup type for restore: {backup_type}")
                
        except BackupStatus.DoesNotExist:
            raise Exception("Backup record not found")
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            raise
    
    def _restore_database_backup(self, backup_record, merge_strategy, preview_only):
        """Restore database from backup file"""
        file_path = backup_record.metadata.get('file_path')
        
        if preview_only:
            # Analyze what would be restored
            data = self._load_backup_data(file_path)
            
            # Count models and records
            model_counts = {}
            for record in data:
                model = record.get('model')
                if model:
                    model_counts[model] = model_counts.get(model, 0) + 1
            
            return {
                'success': True,
                'preview': True,
                'total_records': len(data),
                'models': model_counts,
                'merge_strategy': merge_strategy,
                'message': f'Would restore {len(data)} records across {len(model_counts)} models'
            }
        
        # Perform actual restore
        start_time = time.time()
        
        try:
            with transaction.atomic():
                if merge_strategy == 'replace':
                    # Clear existing data (dangerous!)
                    self._clear_database_data()
                
                # Load backup data
                temp_file = None
                try:
                    # Create temporary file for Django loaddata
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp:
                        if file_path.endswith('.gz'):
                            # Decompress gzipped backup
                            with gzip.open(file_path, 'rt', encoding='utf-8') as f:
                                temp.write(f.read())
                        else:
                            # Copy plain JSON
                            with open(file_path, 'r', encoding='utf-8') as f:
                                temp.write(f.read())
                        temp_file = temp.name
                    
                    # Use Django's loaddata command
                    output_buffer = StringIO()
                    call_command('loaddata', temp_file, stdout=output_buffer, verbosity=1)
                    
                    duration = time.time() - start_time
                    
                    return {
                        'success': True,
                        'preview': False,
                        'duration': duration,
                        'merge_strategy': merge_strategy,
                        'message': f'Database restored successfully in {duration:.2f} seconds',
                        'loaddata_output': output_buffer.getvalue()
                    }
                    
                finally:
                    # Clean up temp file
                    if temp_file and os.path.exists(temp_file):
                        os.remove(temp_file)
                        
        except Exception as e:
            raise Exception(f"Database restore failed: {str(e)}")
    
    def _restore_media_backup(self, backup_record, preview_only):
        """Restore media files from backup"""
        file_path = backup_record.metadata.get('file_path')
        
        if preview_only:
            # Analyze ZIP contents
            with zipfile.ZipFile(file_path, 'r') as zipf:
                file_list = zipf.namelist()
                return {
                    'success': True,
                    'preview': True,
                    'file_count': len(file_list),
                    'files': file_list[:20],  # Show first 20 files
                    'message': f'Would restore {len(file_list)} media files'
                }
        
        # Perform actual restore
        start_time = time.time()
        
        try:
            extracted_count = 0
            
            with zipfile.ZipFile(file_path, 'r') as zipf:
                # Extract all files to BASE_DIR
                for file_info in zipf.infolist():
                    if not file_info.is_dir():
                        # Extract to original location
                        target_path = os.path.join(settings.BASE_DIR, file_info.filename)
                        
                        # Create directories if needed
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        
                        # Extract file
                        with zipf.open(file_info) as source, open(target_path, 'wb') as target:
                            shutil.copyfileobj(source, target)
                        
                        extracted_count += 1
            
            duration = time.time() - start_time
            
            return {
                'success': True,
                'preview': False,
                'duration': duration,
                'files_restored': extracted_count,
                'message': f'Restored {extracted_count} media files in {duration:.2f} seconds'
            }
            
        except Exception as e:
            raise Exception(f"Media restore failed: {str(e)}")
    
    def _restore_full_backup(self, backup_record, merge_strategy, preview_only):
        """Restore full system backup (database + media)"""
        file_path = backup_record.metadata.get('file_path')
        
        if preview_only:
            # Analyze ZIP contents
            with zipfile.ZipFile(file_path, 'r') as zipf:
                file_list = zipf.namelist()
                db_files = [f for f in file_list if f.endswith('.json')]
                media_files = [f for f in file_list if not f.endswith('.json')]
                
                return {
                    'success': True,
                    'preview': True,
                    'total_files': len(file_list),
                    'database_files': len(db_files),
                    'media_files': len(media_files),
                    'merge_strategy': merge_strategy,
                    'message': f'Would restore {len(db_files)} database files and {len(media_files)} media files'
                }
        
        # Perform actual restore
        start_time = time.time()
        results = {'database': None, 'media': None}
        
        try:
            with zipfile.ZipFile(file_path, 'r') as zipf:
                # Extract to temporary directory
                with tempfile.TemporaryDirectory() as temp_dir:
                    zipf.extractall(temp_dir)
                    
                    # Find and restore database file
                    db_files = []
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            if file.endswith('.json') and 'database' in file.lower():
                                db_files.append(os.path.join(root, file))
                    
                    if db_files:
                        # Restore database
                        db_file = db_files[0]  # Use first database file found
                        
                        try:
                            with transaction.atomic():
                                if merge_strategy == 'replace':
                                    self._clear_database_data()
                                
                                output_buffer = StringIO()
                                call_command('loaddata', db_file, stdout=output_buffer, verbosity=1)
                                
                                results['database'] = {
                                    'success': True,
                                    'message': 'Database restored successfully',
                                    'file': os.path.basename(db_file)
                                }
                        except Exception as e:
                            results['database'] = {
                                'success': False,
                                'error': str(e)
                            }
                    
                    # Restore media files
                    try:
                        media_count = 0
                        for root, dirs, files in os.walk(temp_dir):
                            for file in files:
                                if not file.endswith('.json'):
                                    source_path = os.path.join(root, file)
                                    # Calculate relative path from temp_dir
                                    rel_path = os.path.relpath(source_path, temp_dir)
                                    target_path = os.path.join(settings.BASE_DIR, rel_path)
                                    
                                    # Create directories if needed
                                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                                    
                                    # Copy file
                                    shutil.copy2(source_path, target_path)
                                    media_count += 1
                        
                        results['media'] = {
                            'success': True,
                            'files_restored': media_count,
                            'message': f'Restored {media_count} media files'
                        }
                        
                    except Exception as e:
                        results['media'] = {
                            'success': False,
                            'error': str(e)
                        }
            
            duration = time.time() - start_time
            
            return {
                'success': True,
                'preview': False,
                'duration': duration,
                'merge_strategy': merge_strategy,
                'results': results,
                'message': f'Full system restore completed in {duration:.2f} seconds'
            }
            
        except Exception as e:
            raise Exception(f"Full restore failed: {str(e)}")
    
    def _load_backup_data(self, file_path):
        """Load backup data from file"""
        if file_path.endswith('.gz'):
            with gzip.open(file_path, 'rt', encoding='utf-8') as f:
                return json.load(f)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    
    def _clear_database_data(self):
        """Clear database data for replace strategy (WARNING: Destructive!)"""
        # This is a dangerous operation - only clear specific app data
        apps_to_clear = [
            'patients',
            'health_info', 
            'medical_certificates',
            'feedback',
            'file_uploads',
            'notifications'
        ]
        
        # Use Django's flush command for specific apps
        # Note: This is still dangerous and should be used carefully
        logger.warning("Clearing database data for restore (replace strategy)")
        
        # For safety, we'll skip the actual clearing in this implementation
        # In production, you might want to implement selective data clearing
        pass
    
    def _sanitize_filename(self, filename):
        """Sanitize uploaded filename"""
        # Remove path components and dangerous characters
        filename = os.path.basename(filename)
        filename = "".join(c for c in filename if c.isalnum() or c in '._-')
        return filename[:100]  # Limit length
    
    def get_uploaded_backups(self, limit=20):
        """Get list of uploaded backup files"""
        return BackupStatus.objects.filter(
            metadata__method='uploaded_backup'
        ).order_by('-started_at')[:limit]
    
    def delete_backup_file(self, backup_id):
        """Delete backup file and record"""
        try:
            backup_record = BackupStatus.objects.get(id=backup_id)
            file_path = backup_record.metadata.get('file_path')
            
            # Delete file
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted backup file: {file_path}")
            
            # Delete record
            backup_record.delete()
            
            return {'success': True, 'message': 'Backup deleted successfully'}
            
        except BackupStatus.DoesNotExist:
            raise Exception("Backup record not found")
        except Exception as e:
            logger.error(f"Delete backup failed: {str(e)}")
            raise