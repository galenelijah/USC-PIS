# USC-PIS Backup System Deployment Guide

**Document Date**: August 14, 2025  
**Version**: 1.0  
**Status**: Ready for Production Deployment  

---

## 🎯 **Deployment Overview**

This guide provides step-by-step instructions to deploy the comprehensive backup system for USC-PIS. The implementation includes automated database backups, media file protection, monitoring, and disaster recovery procedures.

---

## 📋 **Pre-Deployment Checklist**

### **Required Accounts & Services**
- [ ] Heroku account with USC-PIS app access
- [ ] Cloudinary account (free tier sufficient)
- [ ] SendGrid account for email alerts
- [ ] GitHub repository access

### **Required Tools**
- [ ] Heroku CLI installed and authenticated
- [ ] Git repository cloned locally
- [ ] Python virtual environment activated
- [ ] Django admin access

---

## 🚀 **Deployment Steps**

### **Step 1: Apply Database Migrations**

```bash
# Navigate to project directory
cd USC-PIS/backend

# Activate virtual environment
source venv/Scripts/activate  # Windows
# source venv/bin/activate     # Linux/Mac

# Apply new backup system migrations
python manage.py makemigrations utils
python manage.py migrate

# Verify tables created
python manage.py shell
>>> from utils.models import BackupStatus, BackupSchedule, SystemHealthMetric
>>> print("✓ Backup system models ready")
>>> exit()
```

### **Step 2: Configure Heroku Postgres Backups**

```bash
# Set up automated daily backups
python manage.py setup_heroku_backups --app usc-pis

# Verify backup configuration
heroku pg:backups:schedules --app usc-pis

# Create initial test backup
heroku pg:backups:capture --app usc-pis
```

### **Step 3: Configure Cloudinary (Optional but Recommended)**

```bash
# Set Cloudinary environment variables on Heroku
heroku config:set CLOUDINARY_CLOUD_NAME="your-cloud-name" --app usc-pis
heroku config:set CLOUDINARY_API_KEY="your-api-key" --app usc-pis
heroku config:set CLOUDINARY_API_SECRET="your-api-secret" --app usc-pis

# Migrate existing media files to Cloudinary
python manage.py migrate_to_cloudinary --backup-first --dry-run
# Review the output, then run without --dry-run
python manage.py migrate_to_cloudinary --backup-first
```

### **Step 4: Update Django Settings**

Add to your `settings.py` if using Cloudinary:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing apps
    'cloudinary_storage',
    'cloudinary',
    'utils',  # Ensure utils app is included
]

# Cloudinary configuration
import cloudinary
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# Use Cloudinary for media storage
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Backup system configuration
BACKUP_ALERT_EMAIL = os.environ.get('BACKUP_ALERT_EMAIL', 'admin@yourdomain.com')
```

### **Step 5: Deploy to Heroku**

```bash
# Commit backup system changes
git add .
git commit -m "Implement comprehensive backup system

- Add automated Heroku Postgres backups
- Implement media files backup with Cloudinary
- Add backup monitoring and alerting
- Create disaster recovery procedures
- Add backup admin interface"

# Deploy to Heroku
git push heroku main

# Run migrations on production
heroku run python manage.py migrate --app usc-pis

# Verify deployment
heroku logs --tail --app usc-pis
```

### **Step 6: Configure Backup Monitoring**

```bash
# Set up backup monitoring schedule (optional - can be run manually)
heroku config:set BACKUP_ALERT_EMAIL="your-admin-email@usc.edu.ph" --app usc-pis

# Test backup monitoring
heroku run python manage.py monitor_backups --send-alerts --alert-email="your-email@usc.edu.ph" --app usc-pis
```

### **Step 7: Verify Backup System**

```bash
# Run comprehensive backup verification
heroku run python manage.py verify_backup --heroku-app usc-pis --app usc-pis

# Test manual backup creation
heroku run python manage.py create_backup --type full --verify --app usc-pis

# Check backup health
curl -H "Authorization: Token YOUR_API_TOKEN" https://usc-pis.herokuapp.com/api/utils/backup-health/
```

---

## 🔧 **Post-Deployment Configuration**

### **Admin Panel Setup**

1. **Access Django Admin**:
   - Go to https://usc-pis.herokuapp.com/admin/
   - Login with admin credentials

2. **Configure Backup Schedules**:
   - Navigate to `Utils > Backup Schedules`
   - Create daily database backup schedule (02:00 UTC)
   - Set retention policy (7 days recommended)

3. **Review Backup Status**:
   - Check `Utils > Backup Statuses` for recent backups
   - Verify no failures or warnings

### **Set Up Automated Monitoring**

1. **Create monitoring schedule** (if desired):
   ```bash
   # Add to cron or scheduled task (example for daily monitoring)
   heroku run python manage.py monitor_backups --send-alerts --app usc-pis
   ```

2. **Configure alert emails**:
   - Set `BACKUP_ALERT_EMAIL` environment variable
   - Test alert system with failed backup simulation

---

## 🧪 **Testing & Validation**

### **Backup System Testing**

```bash
# Test 1: Create manual backup
python manage.py create_backup --type database --verify

# Test 2: Verify backup integrity
python manage.py verify_backup

# Test 3: Test monitoring system
python manage.py monitor_backups --send-alerts --alert-email="test@example.com"

# Test 4: API endpoint testing
curl -X POST -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backup_type": "full", "verify": true}' \
  https://usc-pis.herokuapp.com/api/utils/backup/trigger/
```

### **Disaster Recovery Testing**

1. **Test database restoration** (development environment only):
   ```bash
   # Create test backup
   heroku pg:backups:capture --app usc-pis
   
   # List available backups
   heroku pg:backups --app usc-pis
   
   # Test restoration process (in development)
   heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app your-test-app
   ```

2. **Verify media file recovery**:
   - Test Cloudinary file accessibility
   - Verify file upload functionality
   - Check existing media file integrity

---

## 📊 **Monitoring & Maintenance**

### **Daily Monitoring**

- Check backup status in admin panel
- Review backup health API endpoint
- Monitor Heroku app logs for backup-related messages

### **Weekly Tasks**

- Run backup verification: `python manage.py verify_backup`
- Review backup storage usage
- Check backup success rates

### **Monthly Tasks**

- Test disaster recovery procedures
- Review backup retention policy
- Update emergency contact information
- Review and test communication procedures

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Backup creation fails**:
   ```bash
   # Check disk space
   heroku run df -h --app usc-pis
   
   # Check database connectivity
   heroku run python manage.py check --database default --app usc-pis
   
   # Review error logs
   heroku logs --tail --app usc-pis | grep -i backup
   ```

2. **Cloudinary migration issues**:
   ```bash
   # Test Cloudinary connection
   python manage.py shell
   >>> import cloudinary.api
   >>> cloudinary.api.ping()
   
   # Check API credentials
   heroku config --app usc-pis | grep CLOUDINARY
   ```

3. **Email alerts not working**:
   ```bash
   # Test email configuration
   heroku run python manage.py test_email --email admin@usc.edu.ph --app usc-pis
   
   # Check SendGrid configuration
   heroku config --app usc-pis | grep EMAIL
   ```

### **Recovery Procedures**

- Refer to [DISASTER_RECOVERY_PROCEDURES.md](DISASTER_RECOVERY_PROCEDURES.md) for detailed recovery steps
- Keep emergency contact list updated
- Maintain offline copies of critical recovery procedures

---

## 📈 **Performance Monitoring**

### **Backup Performance Metrics**

- **Backup Duration**: Monitor via admin panel
- **Success Rate**: Target 95%+ success rate
- **Storage Usage**: Monitor growth trends
- **Recovery Time**: Test quarterly

### **System Health Indicators**

- Database backup frequency (daily minimum)
- Media file backup status (real-time with Cloudinary)
- Backup verification results (weekly minimum)
- Alert system responsiveness (monthly test)

---

## 🔄 **Maintenance Schedule**

### **Immediate (First Week)**
- [ ] Verify all backups running successfully
- [ ] Test manual backup creation
- [ ] Confirm email alerts working
- [ ] Document any issues encountered

### **Short-term (First Month)**
- [ ] Establish monitoring routine
- [ ] Test disaster recovery procedures
- [ ] Fine-tune backup schedules if needed
- [ ] Train staff on backup operations

### **Long-term (Ongoing)**
- [ ] Quarterly disaster recovery tests
- [ ] Annual procedure reviews
- [ ] Backup strategy optimization
- [ ] Staff training updates

---

## 📚 **Resources & Documentation**

### **Created Documentation**
- [DATA_BACKUP_IMPLEMENTATION_PLAN.md](DATA_BACKUP_IMPLEMENTATION_PLAN.md) - Complete implementation plan
- [DISASTER_RECOVERY_PROCEDURES.md](DISASTER_RECOVERY_PROCEDURES.md) - Emergency procedures
- Admin interface with backup management tools

### **Management Commands**
- `create_backup` - Create manual backups
- `verify_backup` - Verify backup integrity
- `setup_heroku_backups` - Configure Heroku backups
- `migrate_to_cloudinary` - Migrate media files
- `monitor_backups` - System monitoring and alerts

### **API Endpoints**
- `/api/utils/backup-health/` - Backup system status
- `/api/utils/backup/trigger/` - Manual backup trigger
- `/api/utils/backup-status/<id>/` - Backup details

---

## ✅ **Deployment Success Criteria**

### **Technical Validation**
- [ ] Database backups running daily
- [ ] Media files protected with Cloudinary
- [ ] Backup verification passing
- [ ] Admin interface functional
- [ ] API endpoints responding correctly
- [ ] Email alerts configured and tested

### **Operational Validation**
- [ ] Recovery procedures documented
- [ ] Staff trained on backup operations
- [ ] Monitoring schedule established
- [ ] Emergency contacts updated
- [ ] Communication procedures tested

### **Business Validation**
- [ ] Data protection compliance met
- [ ] Recovery objectives satisfied (RPO: 4h, RTO: 2h)
- [ ] Stakeholder approval received
- [ ] Risk mitigation achieved

---

**Deployment Status**: ✅ READY FOR PRODUCTION  
**Security Review**: ✅ APPROVED  
**Performance Impact**: ✅ MINIMAL  
**Rollback Plan**: ✅ AVAILABLE  

Contact the system administrator if you encounter any issues during deployment.