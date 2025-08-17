# USC-PIS Backup & Recovery System - Complete Guide

## Overview

The USC-PIS backup system provides enterprise-grade data protection with smart restore capabilities, performance optimization, and comprehensive disaster recovery features.

## System Architecture

### Core Components

1. **BackupStatus Model** (`utils/models.py`)
   - Tracks all backup operations with metadata
   - Stores duration, file size, checksums, and status
   - Supports backup types: database, media, full, verification

2. **Backup Execution Engine** (`utils/management/commands/execute_backup.py`)
   - Actual backup operation implementation
   - Performance optimization with batch processing
   - Quick backup option for faster completion

3. **Web Interface** (`frontend/src/components/DatabaseMonitor.jsx`)
   - Professional 3-tab interface (Database Health, Backup Management, History)
   - Real-time status updates and progress tracking
   - Restore functionality with conflict preview

4. **API Endpoints** (`utils/views.py`)
   - RESTful backup management endpoints
   - Background execution with subprocess management
   - Download and restore capabilities

## Backup Types

### Database Backup
- **Content**: All application data (patients, users, campaigns, certificates, etc.)
- **Format**: Django fixtures (JSON)
- **Size**: ~0.5MB for typical dataset
- **Duration**: 42-46 seconds for full database
- **Quick Mode**: Excludes logs and reports for faster completion

### Media Backup
- **Content**: Uploaded files, images, documents
- **Format**: ZIP archive of media directory
- **Size**: Varies based on uploaded content
- **Duration**: Depends on file count and sizes

### Full System Backup
- **Content**: Database + Media files + manifest
- **Format**: Multiple files (JSON + ZIP + manifest)
- **Duration**: Longest option due to file processing
- **Use Case**: Complete disaster recovery

## Quick Backup Feature

### What It Excludes
- `notifications.NotificationLog` (large log table)
- `reports.GeneratedReport` (potentially large files)
- System tables: `contenttypes`, `sessions`, `admin`

### Performance Benefits
- Reduced record count (typically 48+ fewer records)
- Smaller file size (~0.03MB reduction)
- Faster processing for large datasets
- Maintains all essential patient and operational data

### When to Use
- Regular scheduled backups
- Development and testing
- Quick data migration
- When speed is prioritized over completeness

## Restore System

### Smart Conflict Detection
The restore system analyzes backup data against current database state:

```python
# Conflict analysis includes:
- Total records to restore
- New records (not in current database)
- Existing records (potential conflicts)
- Field-level conflict detection
- Safety assessment
```

### Merge Strategies

#### Replace Strategy
- **Action**: Overwrites existing data with backup data
- **Use Case**: Disaster recovery, complete restoration
- **Risk Level**: High (data loss possible)
- **Recommended**: When current data is corrupted/lost

#### Merge Strategy  
- **Action**: Updates only empty/null fields in existing records
- **Use Case**: Partial data restoration, filling missing information
- **Risk Level**: Medium (preserves existing data)
- **Recommended**: When current data is mostly intact

#### Skip Strategy
- **Action**: Adds only new records, skips existing ones
- **Use Case**: Data migration, adding new records only
- **Risk Level**: Low (no existing data modified)
- **Recommended**: When you only want to add missing records

### Preview Functionality
Before executing restore operations, users can:
- See total record counts and breakdown
- Review detected conflicts
- Understand which models will be affected
- Assess safety of the operation
- Choose appropriate merge strategy

## Performance Optimization

### Batch Processing
Large tables are processed in batches of 1000 records to prevent memory issues:

```python
if record_count > batch_size:
    for i in range(0, record_count, batch_size):
        batch = queryset[i:i + batch_size]
        process_batch(batch)
```

### Background Execution
Backups run asynchronously to prevent UI blocking:

```python
# Subprocess execution
subprocess.run([
    './venv/Scripts/python.exe',
    'manage.py', 
    'execute_backup',
    '--backup-id', str(backup_id)
])
```

### Memory Management
- Streaming serialization for large datasets
- Cleanup of temporary files
- Efficient file handling for downloads

## API Reference

### Backup Health Check
```http
GET /api/utils/backup-health/
Authorization: Token <admin_token>

Response:
{
  "system_health": {
    "backup_system_healthy": true,
    "last_successful_backup": "2025-08-17T08:03:47Z"
  },
  "backup_summary": {
    "total_backups": 10,
    "successful_backups": 8,
    "health_score": 0.8
  },
  "recent_backups": [...]
}
```

### Create Backup
```http
POST /api/utils/backup/trigger/
Authorization: Token <admin_token>
Content-Type: application/json

{
  "backup_type": "database",
  "verify": true,
  "quick_backup": false
}

Response:
{
  "message": "Manual backup triggered successfully",
  "backup_id": 123,
  "status_check_url": "/api/utils/backup-status/123/"
}
```

### Download Backup
```http
GET /api/utils/backup/download/123/
Authorization: Token <admin_token>

Response: Binary file download
Content-Disposition: attachment; filename="database_backup_20250817_080347.json"
```

### Restore Preview
```http
POST /api/utils/backup/restore/
Authorization: Token <admin_token>
Content-Type: application/json

{
  "backup_id": 123,
  "merge_strategy": "replace",
  "preview_only": true
}

Response:
{
  "restore_plan": {
    "summary": {
      "total_records": 602,
      "new_records": 50,
      "existing_records": 552,
      "conflicts": 15
    },
    "safe_to_restore": true
  }
}
```

### Execute Restore
```http
POST /api/utils/backup/restore/
Authorization: Token <admin_token>
Content-Type: application/json

{
  "backup_id": 123,
  "merge_strategy": "merge",
  "preview_only": false
}

Response:
{
  "message": "Backup restored successfully",
  "restore_result": {
    "records_created": 50,
    "records_updated": 100,
    "records_skipped": 452
  }
}
```

## Command Line Usage

### Execute Backup
```bash
# Execute specific backup
./venv/Scripts/python.exe manage.py execute_backup --backup-id 123

# Execute all pending backups
./venv/Scripts/python.exe manage.py execute_backup --auto
```

### Check Backup Status
```bash
# Via Django shell
./venv/Scripts/python.exe manage.py shell -c "
from utils.models import BackupStatus
backup = BackupStatus.objects.get(id=123)
print(f'Status: {backup.status}')
print(f'Duration: {backup.duration_seconds}s')
print(f'Size: {backup.file_size_mb}MB')
"
```

## Security Considerations

### Access Control
- Backup operations require Admin or Staff role
- Restore operations require Admin role only
- Download functionality restricted to authenticated users

### Data Protection
- Backup files contain sensitive patient data
- Files are served with secure headers
- Temporary files are cleaned up after download
- Checksums verify data integrity

### Audit Trail
- All backup operations are logged
- User tracking for manual backups
- Metadata includes triggering user information

## Troubleshooting

### Common Issues

#### Backup Stuck in "in_progress"
```bash
# Clean up stuck backups
./venv/Scripts/python.exe manage.py shell -c "
from utils.models import BackupStatus
from django.utils import timezone
stuck = BackupStatus.objects.filter(status='in_progress')
for backup in stuck:
    backup.status = 'failed'
    backup.completed_at = timezone.now()
    backup.error_message = 'Process timed out'
    backup.save()
"
```

#### Large Memory Usage During Backup
- Use quick backup option for regular backups
- Increase batch size for processing
- Monitor system resources during operation

#### Restore Conflicts
- Always use preview mode first
- Choose appropriate merge strategy
- Consider manual data cleanup before restore

### Performance Tips

1. **Use Quick Backup** for regular operations
2. **Schedule Full Backups** during low-usage periods
3. **Monitor File Sizes** to prevent storage issues
4. **Test Restore Process** regularly with preview mode
5. **Clean Old Backups** to save storage space

## File Locations

### Backup Storage
- **Development**: `backend/backups/`
- **Production**: Configured backup directory
- **Format**: `database_backup_YYYYMMDD_HHMMSS.json`

### Management Commands
- **Location**: `utils/management/commands/execute_backup.py`
- **Usage**: Direct backup execution and automation

### Configuration
- **Models**: `utils/models.py` - BackupStatus, BackupSchedule
- **Views**: `utils/views.py` - API endpoints
- **URLs**: `utils/urls.py` - Route configuration
- **Frontend**: `frontend/src/components/DatabaseMonitor.jsx`

## Integration Examples

### Automated Backup Script
```python
#!/usr/bin/env python3
import subprocess
import logging

def create_daily_backup():
    """Create automated daily backup"""
    try:
        # Trigger backup via API
        result = subprocess.run([
            'curl', '-X', 'POST',
            'http://localhost:8000/api/utils/backup/trigger/',
            '-H', 'Authorization: Token YOUR_TOKEN',
            '-H', 'Content-Type: application/json',
            '-d', '{"backup_type": "database", "quick_backup": true}'
        ], capture_output=True, text=True)
        
        logging.info(f"Backup triggered: {result.stdout}")
        
    except Exception as e:
        logging.error(f"Backup failed: {e}")

if __name__ == "__main__":
    create_daily_backup()
```

### Health Monitoring
```python
from utils.models import BackupStatus
from datetime import timedelta
from django.utils import timezone

def check_backup_health():
    """Monitor backup system health"""
    # Check for recent successful backups
    recent_cutoff = timezone.now() - timedelta(hours=24)
    recent_backups = BackupStatus.objects.filter(
        started_at__gte=recent_cutoff,
        status='success'
    )
    
    if not recent_backups.exists():
        alert_admin("No successful backups in last 24 hours")
    
    # Check for failed backups
    failed_backups = BackupStatus.objects.filter(
        started_at__gte=recent_cutoff,
        status='failed'
    )
    
    if failed_backups.count() > 2:
        alert_admin(f"{failed_backups.count()} failed backups detected")
```

---

**Last Updated**: August 17, 2025  
**Version**: 2.0 - Enterprise-grade backup system with smart restore capabilities  
**Author**: USC-PIS Development Team  
**Status**: Production Ready