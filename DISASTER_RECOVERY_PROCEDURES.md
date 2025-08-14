# USC-PIS Disaster Recovery Procedures

**Document Date**: August 14, 2025  
**Classification**: CRITICAL INFRASTRUCTURE  
**Review Frequency**: Quarterly  
**Last Updated**: Implementation Date  

---

## 🚨 **Emergency Contacts**

### **Primary Response Team**
- **System Administrator**: [Add contact info]
- **Database Administrator**: [Add contact info]
- **Network Administrator**: [Add contact info]
- **Project Lead**: [Add contact info]

### **Service Providers**
- **Heroku Support**: https://help.heroku.com/
- **Cloudinary Support**: https://support.cloudinary.com/
- **Domain Provider**: [Add contact info]

---

## 📋 **Disaster Recovery Overview**

### **Recovery Objectives**
- **Recovery Point Objective (RPO)**: 4 hours maximum data loss
- **Recovery Time Objective (RTO)**: 2 hours maximum downtime
- **Business Impact**: Healthcare operations, student services, medical records

### **Backup Components**
1. **Database**: Heroku Postgres automated backups (daily)
2. **Media Files**: Cloudinary persistent storage with redundancy
3. **Application Code**: GitHub repository with version control
4. **Configuration**: Environment variables and settings

---

## 🛠️ **Recovery Procedures**

### **SCENARIO 1: Database Corruption/Loss**

#### **Assessment (5-10 minutes)**
1. Verify database accessibility:
   ```bash
   heroku pg:info --app usc-pis
   ```
2. Check recent backup availability:
   ```bash
   heroku pg:backups --app usc-pis
   ```
3. Assess extent of data corruption

#### **Recovery Steps (30-60 minutes)**
1. **Create maintenance mode** (if application is running):
   ```bash
   heroku maintenance:on --app usc-pis
   ```

2. **Identify latest good backup**:
   ```bash
   heroku pg:backups --app usc-pis
   # Note the backup ID (e.g., b001)
   ```

3. **Restore database from backup**:
   ```bash
   heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app usc-pis
   # Example: heroku pg:backups:restore b001 DATABASE_URL --app usc-pis
   ```

4. **Verify restoration**:
   ```bash
   heroku run python manage.py shell --app usc-pis
   # In Django shell:
   # from patients.models import Patient
   # print(f"Patient count: {Patient.objects.count()}")
   # from authentication.models import User
   # print(f"User count: {User.objects.count()}")
   ```

5. **Run migrations** (if needed):
   ```bash
   heroku run python manage.py migrate --app usc-pis
   ```

6. **Remove maintenance mode**:
   ```bash
   heroku maintenance:off --app usc-pis
   ```

7. **Verify application functionality**:
   - Test user login
   - Check patient records access
   - Verify medical certificate generation

#### **Post-Recovery Actions**
- Document incident and recovery time
- Update backup verification schedule
- Review backup retention policy
- Communicate restoration to stakeholders

---

### **SCENARIO 2: Complete Application Failure**

#### **Assessment (10-15 minutes)**
1. Check application status:
   ```bash
   heroku apps:info --app usc-pis
   heroku logs --tail --app usc-pis
   ```
2. Verify domain accessibility
3. Check database and media storage status

#### **Recovery Steps (60-90 minutes)**
1. **Check recent deployments**:
   ```bash
   heroku releases --app usc-pis
   ```

2. **Rollback if recent deployment caused issue**:
   ```bash
   heroku rollback --app usc-pis
   ```

3. **If rollback doesn't work, redeploy from GitHub**:
   ```bash
   git checkout main
   git pull origin main
   heroku git:remote --app usc-pis
   git push heroku main
   ```

4. **Verify database connection**:
   ```bash
   heroku run python manage.py check --database default --app usc-pis
   ```

5. **Run migrations** (if needed):
   ```bash
   heroku run python manage.py migrate --app usc-pis
   ```

6. **Collect static files**:
   ```bash
   heroku run python manage.py collectstatic --noinput --app usc-pis
   ```

7. **Verify application recovery**:
   - Test application accessibility
   - Verify user authentication
   - Check critical functionality

---

### **SCENARIO 3: Media Files Loss**

#### **Assessment (5 minutes)**
1. Check Cloudinary dashboard for service status
2. Verify media file accessibility in application
3. Check local backup availability

#### **Recovery Steps (30-45 minutes)**
1. **If using Cloudinary** (recommended):
   - Check Cloudinary service status
   - Verify API credentials
   - Contact Cloudinary support if needed

2. **If using local storage backup**:
   ```bash
   # Upload backup media files to new Cloudinary account
   python manage.py migrate_to_cloudinary --backup-first
   ```

3. **Update Django settings** (if needed):
   ```python
   # Ensure correct Cloudinary configuration
   DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

4. **Verify media file restoration**:
   - Test file uploads
   - Check existing file accessibility
   - Verify campaign images display

---

### **SCENARIO 4: Complete Infrastructure Loss**

#### **Assessment (15-20 minutes)**
1. Verify scope of outage
2. Check service provider status pages
3. Assess backup availability
4. Estimate recovery time

#### **Recovery Steps (2-4 hours)**
1. **Create new Heroku application**:
   ```bash
   heroku create usc-pis-recovery
   ```

2. **Set up new database**:
   ```bash
   heroku addons:create heroku-postgresql:mini --app usc-pis-recovery
   ```

3. **Configure environment variables**:
   ```bash
   heroku config:set SECRET_KEY="[new-secret-key]" --app usc-pis-recovery
   heroku config:set DEBUG=False --app usc-pis-recovery
   heroku config:set CLOUDINARY_CLOUD_NAME="[value]" --app usc-pis-recovery
   heroku config:set CLOUDINARY_API_KEY="[value]" --app usc-pis-recovery
   heroku config:set CLOUDINARY_API_SECRET="[value]" --app usc-pis-recovery
   heroku config:set EMAIL_HOST_PASSWORD="[sendgrid-key]" --app usc-pis-recovery
   ```

4. **Deploy application**:
   ```bash
   git remote add recovery https://git.heroku.com/usc-pis-recovery.git
   git push recovery main
   ```

5. **Restore database from latest backup**:
   ```bash
   # Get backup URL from previous app (if accessible)
   heroku pg:backups:url [BACKUP_ID] --app usc-pis
   # Restore to new database
   heroku pg:backups:restore '[BACKUP_URL]' DATABASE_URL --app usc-pis-recovery
   ```

6. **Update domain configuration**:
   - Update DNS records to point to new application
   - Update domain configuration in Heroku

7. **Verify complete system restoration**:
   - Test all critical functionality
   - Verify data integrity
   - Check all integrations

---

## 📊 **Recovery Verification Checklist**

### **Database Recovery Verification**
- [ ] User authentication working
- [ ] Patient records accessible
- [ ] Medical records display correctly
- [ ] Medical certificates generate properly
- [ ] Health campaigns load with images
- [ ] Feedback system functional
- [ ] Admin panel accessible
- [ ] Reports generate correctly

### **Application Recovery Verification**
- [ ] Homepage loads correctly
- [ ] User login/logout works
- [ ] All navigation menus functional
- [ ] Forms submit without errors
- [ ] File uploads working
- [ ] Email notifications sending
- [ ] Search functionality works
- [ ] Export features operational

### **System Integration Verification**
- [ ] Database queries performing normally
- [ ] Media files displaying correctly
- [ ] Email system functioning
- [ ] Backup system operational
- [ ] Monitoring systems active
- [ ] Security features enabled

---

## 🔧 **Backup System Recovery**

### **If Backup System Fails**
1. **Check backup monitoring**:
   ```bash
   python manage.py monitor_backups --check-heroku
   ```

2. **Verify Heroku backup schedule**:
   ```bash
   heroku pg:backups:schedules --app usc-pis
   ```

3. **Recreate backup schedule if missing**:
   ```bash
   python manage.py setup_heroku_backups --app usc-pis
   ```

4. **Run manual backup verification**:
   ```bash
   python manage.py verify_backup
   ```

5. **Test backup creation**:
   ```bash
   python manage.py create_backup --type full --verify
   ```

---

## 📞 **Communication Procedures**

### **Internal Communication**
1. **Immediate notification** (within 15 minutes):
   - Notify system administrator
   - Alert project stakeholders
   - Update status page/communication channels

2. **Regular updates** (every 30 minutes during recovery):
   - Progress updates to stakeholders
   - Estimated restoration time
   - Any issues encountered

3. **Recovery completion** (when service restored):
   - Confirm full service restoration
   - Document incident details
   - Schedule post-incident review

### **User Communication**
1. **Service disruption notice**:
   - Post on main USC-PIS portal
   - Email registered users
   - Update social media if applicable

2. **Recovery updates**:
   - Regular status updates
   - Expected restoration time
   - Alternative contact methods

3. **Service restoration announcement**:
   - Confirm service availability
   - Apologize for inconvenience
   - Provide incident summary

---

## 🔍 **Post-Incident Procedures**

### **Immediate Post-Recovery (within 24 hours)**
1. **Verify system stability**:
   - Monitor for 24 hours
   - Check all critical functions
   - Verify backup operations resume

2. **Document incident**:
   - Timeline of events
   - Root cause analysis
   - Recovery steps taken
   - Lessons learned

3. **Update procedures**:
   - Revise recovery procedures if needed
   - Update contact information
   - Improve monitoring if gaps identified

### **Follow-up Actions (within 1 week)**
1. **Conduct post-incident review**:
   - Review response effectiveness
   - Identify improvement opportunities
   - Update disaster recovery plan

2. **Test recovery procedures**:
   - Schedule disaster recovery test
   - Verify backup integrity
   - Update documentation

3. **Implement improvements**:
   - Address identified weaknesses
   - Enhance monitoring capabilities
   - Update backup strategies

---

## 📝 **Recovery Testing Schedule**

### **Monthly Testing**
- Backup verification and integrity checks
- Database restoration test (development environment)
- Communication procedures review

### **Quarterly Testing**
- Full disaster recovery simulation
- Complete infrastructure recovery test
- Update emergency contact information
- Review and update procedures

### **Annual Testing**
- Complete disaster recovery drill
- Third-party service recovery testing
- Full documentation review and update
- Staff training and certification

---

## 📚 **Additional Resources**

### **Documentation References**
- [Heroku Postgres Backups Documentation](https://devcenter.heroku.com/articles/heroku-postgres-backups)
- [Cloudinary Backup and Recovery](https://cloudinary.com/documentation/backup_and_restore)
- [Django Database Backup Best Practices](https://docs.djangoproject.com/en/stable/topics/db/backup/)

### **Monitoring Tools**
- Heroku Application Metrics
- Database Performance Monitoring
- Backup System Health Checks
- Uptime Monitoring Services

### **Emergency Supplies**
- Alternative internet connection
- Backup communication methods
- Access to recovery systems
- Emergency contact lists

---

**Document Control**
- **Version**: 1.0
- **Last Review**: August 14, 2025
- **Next Review**: November 14, 2025
- **Approved By**: [System Administrator]
- **Distribution**: System Administration Team, Project Stakeholders

**CONFIDENTIAL**: This document contains sensitive system recovery information and should be secured appropriately.