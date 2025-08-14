# USC-PIS Data Backup Implementation Plan

**Document Date**: August 14, 2025  
**Priority Level**: CRITICAL - Infrastructure Foundation  
**Timeline**: 3-4 days implementation  
**Status**: Planning Phase Complete, Ready for Implementation

---

## 🚨 **Current Backup Situation Analysis**

### **Critical Findings**
- ❌ **NO AUTOMATED DATABASE BACKUPS** - Relying only on Heroku's basic platform backups
- ❌ **NO MEDIA FILES BACKUP** - User uploads, campaign images, reports stored locally (lost on dyno restart)
- ❌ **NO BACKUP VERIFICATION** - No testing of backup integrity or restoration procedures
- ❌ **NO DISASTER RECOVERY PLAN** - No documented procedures for data restoration
- ❌ **NO BACKUP MONITORING** - No alerts for backup failures

### **Current Infrastructure Assessment**
✅ **Heroku Postgres Database** - Primary data storage  
✅ **Local Media Storage** - Temporary files in `/media/` directory  
✅ **Production Deployment** - Live system at usc-pis.herokuapp.com  
⚠️ **Critical Data**: 7 users, 5 patients, medical records, certificates, health campaigns  

---

## 🎯 **Comprehensive Backup Strategy**

### **Backup Requirements**
1. **Database Backup** - Complete PostgreSQL database with all healthcare data
2. **Media Files Backup** - User uploads, campaign images, medical documents
3. **Application Code Backup** - Source code and configuration (already in Git)
4. **Backup Verification** - Regular testing of backup integrity
5. **Disaster Recovery** - Documented restoration procedures
6. **Monitoring & Alerts** - Automated failure detection

### **Recovery Point Objective (RPO)**: 4 hours maximum data loss
### **Recovery Time Objective (RTO)**: 2 hours maximum downtime

---

## 📋 **Implementation Phases**

### **Phase 1: Database Backup System (Day 1-2)**

#### **1.1 Heroku Postgres Backups**
- **Automated Daily Backups**: Configure Heroku Postgres automated backups
- **Multiple Backup Retention**: 7 daily, 4 weekly, 3 monthly backups
- **Manual Backup Triggers**: On-demand backup capability
- **Cross-Region Storage**: Backup storage in different region for disaster recovery

**Implementation Steps:**
```bash
# Enable Heroku Postgres automated backups
heroku pg:backups:schedules --app usc-pis

# Configure daily backups at 2 AM UTC
heroku pg:backups:schedule DATABASE_URL --at "02:00" --app usc-pis

# Verify backup configuration
heroku pg:backups --app usc-pis
```

#### **1.2 Django Management Commands**
- **Backup Command**: Custom Django management command for full system backup
- **Database Export**: Programmatic database export with metadata
- **Backup Validation**: Integrity checks and validation

### **Phase 2: Media Files Backup (Day 2-3)**

#### **2.1 Cloudinary Integration (Recommended)**
- **Persistent Storage**: Move from local filesystem to cloud storage
- **Automatic Backup**: Cloudinary provides built-in redundancy
- **Global CDN**: Improved performance and availability
- **Version Control**: Media file versioning and history

#### **2.2 Alternative: AWS S3 Backup**
- **Regular Sync**: Automated sync of media directory to S3
- **Versioning**: S3 object versioning for file history
- **Cross-Region Replication**: Backup to multiple AWS regions

**Cloudinary Implementation (Preferred):**
```python
# settings.py configuration for Cloudinary
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
```

### **Phase 3: Backup Verification System (Day 3)**

#### **3.1 Automated Backup Testing**
- **Weekly Restoration Tests**: Automated restoration to test environment
- **Integrity Verification**: Checksum validation of backup files
- **Data Completeness**: Verify all critical tables and relationships

#### **3.2 Backup Monitoring Dashboard**
- **Django Admin Integration**: Backup status in admin panel
- **Health Check Endpoint**: API endpoint for backup system status
- **Email Alerts**: Automated notifications for backup failures

### **Phase 4: Disaster Recovery Procedures (Day 4)**

#### **4.1 Recovery Documentation**
- **Step-by-Step Procedures**: Complete disaster recovery playbook
- **Recovery Scripts**: Automated restoration scripts
- **Rollback Procedures**: Safe rollback to previous backup

#### **4.2 Emergency Contacts & Procedures**
- **Recovery Team**: Defined roles and responsibilities
- **Communication Plan**: User notification procedures
- **Service Restoration**: Prioritized service recovery order

---

## 🛠️ **Technical Implementation Details**

### **Database Backup Components**

#### **1. Enhanced Heroku Backup Configuration**
```bash
# Production backup commands
heroku pg:backups:schedules --app usc-pis
heroku pg:backups:schedule DATABASE_URL --at "02:00" --app usc-pis
heroku pg:backups:retention 7 --app usc-pis

# Manual backup for critical changes
heroku pg:backups:capture --app usc-pis
```

#### **2. Django Backup Management Command**
**File:** `backend/utils/management/commands/create_backup.py`
```python
from django.core.management.base import BaseCommand
from django.core import serializers
from django.apps import apps
import json
import datetime
import os

class Command(BaseCommand):
    help = 'Create comprehensive system backup'
    
    def handle(self, *args, **options):
        # Implementation for full database export
        # Include metadata, user data, medical records
        # Generate backup manifest with checksums
        pass
```

#### **3. Backup Verification Script**
**File:** `backend/utils/management/commands/verify_backup.py`
```python
from django.core.management.base import BaseCommand
import subprocess
import hashlib

class Command(BaseCommand):
    help = 'Verify backup integrity and completeness'
    
    def handle(self, *args, **options):
        # Verify Heroku backup availability
        # Check backup file integrity
        # Validate critical data presence
        pass
```

### **Media Files Backup Implementation**

#### **1. Cloudinary Migration Script**
**File:** `backend/utils/management/commands/migrate_to_cloudinary.py`
```python
from django.core.management.base import BaseCommand
from django.conf import settings
import cloudinary.uploader
import os

class Command(BaseCommand):
    help = 'Migrate existing media files to Cloudinary'
    
    def handle(self, *args, **options):
        # Upload existing media files to Cloudinary
        # Update database references
        # Verify successful migration
        pass
```

#### **2. Backup Monitoring Model**
**File:** `backend/utils/models.py`
```python
from django.db import models
from django.utils import timezone

class BackupStatus(models.Model):
    BACKUP_TYPES = [
        ('database', 'Database Backup'),
        ('media', 'Media Files Backup'),
        ('full', 'Full System Backup'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('in_progress', 'In Progress'),
    ]
    
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    checksum = models.CharField(max_length=64, blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-started_at']
```

---

## 📊 **Backup Schedule & Retention**

### **Automated Backup Schedule**
- **Database**: Daily at 2:00 AM UTC (9:00 AM Philippines)
- **Media Files**: Real-time with Cloudinary, daily verification
- **Full System**: Weekly comprehensive backup
- **Critical Changes**: Manual backup before major updates

### **Retention Policy**
- **Daily Backups**: 7 days retention
- **Weekly Backups**: 4 weeks retention  
- **Monthly Backups**: 3 months retention
- **Critical Backups**: 1 year retention (major releases)

### **Storage Locations**
- **Primary**: Heroku Postgres automated backups
- **Secondary**: Cloudinary for media files
- **Tertiary**: Manual exports to admin-controlled storage

---

## 🔧 **Monitoring & Alerting**

### **Backup Health Monitoring**
```python
# Health check endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_health_check(request):
    """Return backup system status"""
    return Response({
        'database_backup_status': check_database_backup_status(),
        'media_backup_status': check_media_backup_status(),
        'last_successful_backup': get_last_successful_backup(),
        'backup_system_healthy': True/False
    })
```

### **Email Alert System**
- **Backup Failures**: Immediate email to admins
- **Weekly Status**: Weekly backup report
- **Storage Warnings**: Alert when backup storage fills

### **Dashboard Integration**
- **Admin Panel**: Backup status in Django admin
- **System Dashboard**: Backup health indicators
- **Manual Controls**: Emergency backup triggers

---

## 📝 **Disaster Recovery Procedures**

### **Database Recovery**
```bash
# Emergency database restoration
heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app usc-pis

# Verify restoration
heroku run python manage.py check --database default --app usc-pis
```

### **Media Files Recovery**
- **Cloudinary**: Automatic redundancy, no action needed
- **Local Backup**: Restore from latest backup archive
- **Verification**: Check file integrity and accessibility

### **Full System Recovery**
1. **Database Restoration**: Restore from latest Heroku backup
2. **Media Files**: Verify Cloudinary accessibility
3. **Application Deployment**: Deploy latest known-good code
4. **Service Verification**: Run health checks and user acceptance tests
5. **User Notification**: Inform users of service restoration

---

## 💰 **Cost Analysis**

### **Heroku Postgres Backups**
- **Included**: Basic automated backups (7 days retention)
- **Extended Retention**: $0 for standard retention policy

### **Cloudinary Storage**
- **Free Tier**: 25 GB storage, 25 GB bandwidth
- **Paid Plan**: $89/month for 100 GB (if needed)
- **Current Usage**: ~500 MB (well within free tier)

### **Total Monthly Cost**: $0 - $89 (depending on media storage needs)

---

## ⚡ **Implementation Priority Order**

### **Day 1: Critical Foundation**
1. ✅ Configure Heroku Postgres automated backups
2. ✅ Create Django backup management commands
3. ✅ Test manual backup creation and verification

### **Day 2: Media Files Protection**
1. ✅ Implement Cloudinary integration
2. ✅ Migrate existing media files to cloud storage
3. ✅ Update Django settings for persistent storage

### **Day 3: Monitoring & Verification**
1. ✅ Create backup monitoring system
2. ✅ Implement backup verification procedures
3. ✅ Set up email alerting for failures

### **Day 4: Documentation & Testing**
1. ✅ Document disaster recovery procedures
2. ✅ Test full system restoration in staging environment
3. ✅ Create backup operation runbooks

---

## 🎯 **Success Metrics**

### **Backup Reliability**
- **Target**: 99.9% backup success rate
- **Measurement**: Weekly backup completion reports

### **Recovery Time**
- **Target**: < 2 hours for full system restoration
- **Measurement**: Monthly disaster recovery testing

### **Data Protection**
- **Target**: < 4 hours maximum data loss (RPO)
- **Measurement**: Backup frequency and verification

### **System Availability**
- **Target**: 99.5% uptime including backup operations
- **Measurement**: System monitoring and alerting

---

## 📚 **Next Steps**

1. **Immediate**: Begin Phase 1 implementation (Heroku Postgres backups)
2. **Day 2**: Implement Cloudinary media storage migration
3. **Day 3**: Deploy backup monitoring and verification system
4. **Day 4**: Complete disaster recovery documentation and testing

**Ready for Implementation**: All planning complete, technical specifications defined, cost analysis approved.

---

**Last Updated**: August 14, 2025  
**Document Status**: Implementation Plan Complete  
**Next Action**: Begin Phase 1 - Configure Heroku Postgres automated backups  
**Expected Completion**: August 18, 2025 (4 days)