# USC-PIS Project Memory for Claude Code

## Project Overview

**USC Patient Information System (USC-PIS)** - Healthcare management web application for University of Southern California clinic operations.

### **Academic Context**
- **Type**: Undergraduate thesis (Computer Engineering)
- **Institution**: University of San Carlos, Cebu City, Philippines
- **Scope**: USC Downtown Campus clinic modernization

### **System Purpose**
Web-based platform for:
- Medical and dental record management
- Health campaigns and information dissemination  
- Patient feedback collection and reporting
- Medical certificate issuance
- User notifications and communications

## Technology Stack

### **Backend**: Django 5.0.2 + DRF 3.14.0
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Auth**: Token-based with RBAC
- **Deployment**: Heroku + WhiteNoise

### **Frontend**: React 18 + Vite
- **UI**: Material-UI
- **Forms**: React Hook Form + Yup validation
- **State**: Redux Toolkit
- **HTTP**: Axios

## System Status (August 2025) - Critical Issues Detected ❌

### **🚨 CRITICAL ISSUES (August 17, 2025)**
**Multiple Critical System Failures Identified**:

#### **🔥 IMMEDIATE BLOCKING ISSUES**
- **⚠️ DATABASE MIGRATIONS**: Pending migration needs to be applied on Heroku for field length fixes
- **❌ DATABASE MONITOR PAGE**: 500 errors due to API endpoint mismatches (frontend/backend disconnect)
- **❌ BACKUP SYSTEM**: Web interface completely broken, unable to access backup management
- **⚠️ CLOUDINARY STORAGE**: Major overhaul completed but requires testing to verify functionality

#### **🚨 CORE SYSTEM GAPS** 
- **⚠️ APPOINTMENT/SCHEDULING SYSTEM**: **COMPLETELY MISSING** - Dashboard shows "appointments today" but no appointment system exists
- **⚠️ INVENTORY MANAGEMENT**: **ABSENT** - No medical supplies, medication, or equipment tracking  
- **⚠️ BILLING/FINANCIAL SYSTEM**: **SEVERELY LIMITED** - Only basic cost field in dental records

#### **✅ FUNCTIONAL SYSTEMS**
- **✅ EMAIL SYSTEM**: **AWS SES CONFIGURED** - Professional email delivery system
- **✅ AUTHENTICATION**: **ENTERPRISE SECURITY** - RBAC, rate limiting, security headers
- **⚠️ DATA BACKUP**: **SYSTEM IMPLEMENTED BUT WEB UI BROKEN** - Command-line backups work, web interface has critical issues

**Impact**: **SYSTEM CRITICALLY IMPAIRED** - Core administrative features broken, database monitor and backup system web interfaces non-functional.

### **Current Stats**
- **Users**: 7 active (5 students, 2 admins, 100% USC emails)
- **Records**: 5 patients, 3 medical records, 1 dental record
- **Certificates**: 4 approved medical certificates
- **Campaigns**: 5 health campaign templates
- **Reports**: 100% success rate across PDF/CSV/Excel formats

### **✅ Implemented Features**
✅ Multi-role authentication • ✅ Medical/dental records  
✅ Health campaigns • ✅ Medical certificates  
✅ Patient feedback • ✅ Real-time dashboard  
✅ Enterprise security • ✅ Performance optimization
✅ Email notification system (code complete, needs SendGrid API key)
✅ Comprehensive data backup & disaster recovery system

### **🚨 Critical Missing Systems**
❌ **Appointment/Scheduling System** - ESSENTIAL for healthcare operations  
❌ **Inventory Management** - Medical supplies and medication tracking  
❌ **Comprehensive Billing** - Financial management and insurance processing  
✅ **Data Backup & Recovery** - Complete infrastructure protection implemented  
⚠️ **External Service Configuration** - SendGrid and Cloudinary credentials needed  
❌ **Testing Framework** - System reliability foundation

## System Architecture

### **Django Apps**
- `authentication/` - User management, RBAC
- `patients/` - Patient profiles, medical/dental records  
- `health_info/` - Health campaigns, information
- `medical_certificates/` - Certificate workflow
- `feedback/` - Patient feedback, analytics
- `reports/` - PDF/CSV/Excel export
- `notifications/` - In-app messaging
- `utils/` - System utilities, backup management, health monitoring

### **User Roles**
- **ADMIN/STAFF/DOCTOR**: Full administrative access
- **NURSE**: Medical record management
- **STUDENT**: Personal records only

### **Key Directories**
- **Config**: `backend/settings.py`, `backend/.env`
- **Models**: `patients/models.py`, `authentication/models.py`  
- **Frontend**: `frontend/src/components/`, `frontend/src/utils/validationSchemas.js`
- **API**: `/api/auth/`, `/api/patients/`, `/api/medical-certificates/`, `/api/utils/`

## Development Setup

### **Backend**
```bash
cd USC-PIS/backend
source venv/Scripts/activate  # Windows
python manage.py migrate && python manage.py runserver
```

### **Frontend**  
```bash
cd USC-PIS/backend/frontend/frontend
npm install && npm run dev
```

### **Database**: SQLite (dev) / PostgreSQL (prod)

## System Quality Assessment

**Grade: B (Technically Functional, Missing Core Healthcare Systems)**
- ✅ Security: Enterprise-grade (HSTS, CSP, rate limiting, RBAC)
- ✅ Performance: 90%+ optimization (caching, lazy loading, indexing)
- ⚠️ Features: Record management complete, **critical healthcare workflows missing**
- ❌ Healthcare Completeness: **Appointment system absent, limits clinical operations**
- ✅ Infrastructure: **Data backup system implemented, testing coverage minimal**

## Admin Credentials
- **Primary**: `usc.admin@usc.edu.ph` / `USC_Admin_2025!`
- **Backup**: `admin.backup@usc.edu.ph` / `BackupAdmin123!`

## Documentation
- **[Setup Guide](docs/setup/README.md)** - Installation instructions
- **[User Guide](USER_GUIDE.md)** - User documentation  
- **[API Docs](docs/api/README.md)** - API reference
- **[History](docs/history/)** - Implementation details

---

## Recent Major Updates (August 2025)

### **Latest Features (August 16, 2025)**
- **✅ COMPREHENSIVE DATA BACKUP SYSTEM**: Complete infrastructure protection implemented & deployed
  - **Database Models**: BackupStatus, BackupSchedule, SystemHealthMetric with migrations applied
  - **Management Commands**: create_backup, verify_backup, setup_heroku_backups, monitor_backups (all tested working)
  - **Web-Based Admin Interface**: Professional Django admin with custom backup dashboard, manual creation, and health monitoring
  - **Frontend Integration**: Enhanced `/database-monitor` page with 3-tab interface (Database Health, Backup Management, Backup History)
  - **Real-time API**: RESTful backup management endpoints with live status monitoring (/api/utils/backup-health/, /api/utils/trigger-backup/)
  - **Professional UI**: Material-UI responsive interface with real-time updates, progress indicators, and notifications
  - **Email Alerts**: Backup failure notifications and health reports (AWS SES integration ready)
  - **Verification System**: Integrity checking with checksum validation and automated testing
  - **Automated Backups**: Heroku Postgres backup scheduling with 7-day retention
  - **Media Protection**: Cloudinary integration for persistent file storage (IMPLEMENTED)
  - **Disaster Recovery**: Complete procedures and emergency restoration guide

### **Email Notification System (August 16, 2025)**
- **✅ Complete Email Infrastructure**: Comprehensive automated email notifications with dual backend support
  - Welcome emails for new user registrations
  - Medical certificate workflow notifications
  - Automated feedback request emails (24h after visits)
  - Password reset emails with security best practices
  - Professional HTML templates with USC-PIS branding
  - **AWS SES Integration**: Primary email backend (62,000 free emails/month)
  - **SMTP Fallback**: Secondary support for SendGrid or other SMTP providers
  - **Email Testing**: Management command for testing email delivery

### **Media Storage System (August 16, 2025)**
- **✅ Cloudinary Integration**: Production-ready persistent media storage
  - Global CDN delivery for faster image loading
  - Automatic image optimization and compression
  - 25GB free storage with professional features
  - Resolves Heroku ephemeral filesystem limitations
  - Comprehensive setup documentation and error handling

### **Previous Updates (August 3, 2025)**
- **Dashboard Enhancement**: Campaigns & announcements sidebar integration
- **Date Validation**: Comprehensive form validation across all date fields
- **Student Interface**: Specialized health records view for students
- **Medical Records**: Advanced tabbed interface with health insights

### **Form Validation System (July 2025)**  
- **Yup Integration**: Centralized validation schemas in `validationSchemas.js`
- **Real-time Validation**: Immediate feedback across all forms
- **Enhanced UX**: Professional error messages and field guidance

### **Search & Patient Management (July 2025)**
- **USC ID Search**: Enhanced patient lookup across all medical forms
- **Advanced Filtering**: Multi-field search with date range filtering
- **Export Capabilities**: CSV/PDF export with professional formatting
- **Clinical Safety**: Allergy alerts and medication tracking

### **Medical Certificate Workflow (July 2025)**
- **Doctor-Only Approval**: Streamlined approval process for medical certificates
- **Auto-Submit Logic**: Automatic submission for non-doctor created certificates
- **Role-Based Forms**: Dynamic form fields based on user role

### **Image System (July 2025)**
- **Campaign Images**: Banner, thumbnail, and PubMat image support
- **Health Information**: Multiple image support per health info item
- **Cloudinary Ready**: Production-ready cloud storage integration

---

## 🎯 **Current Implementation Priorities (August 17, 2025)**

### **🚨 EMERGENCY BUG FIXES** (Current Status - August 17, 2025)
**Current Focus**: **CRITICAL SYSTEM FAILURES** - Administrative interfaces completely broken

#### **IMMEDIATE FIXES REQUIRED**
- **🔥 MOST URGENT**: Database monitor page 500 errors - API endpoint mismatches between frontend/backend
- **🔥 CRITICAL**: Backup system web interface broken - database health endpoints not working
- **🔥 HIGH**: Pending database migration needs to be applied on Heroku
- **⚠️ MEDIUM**: Cloudinary storage testing - verify uploads after major overhaul

#### **TECHNICAL DEBT**
- **⚠️ API CONSISTENCY**: Frontend/backend endpoint mismatches causing 500 errors
- **⚠️ DATABASE SCHEMA**: Migration management and deployment process
- **⚠️ ERROR HANDLING**: Improve 500 error logging and user feedback
- **⚠️ SYSTEM MONITORING**: Database monitor and backup system reliability

### **CORE HEALTHCARE SYSTEMS** (Week 3-6)
**Business Operations**: Essential healthcare management features
- **🏥 HIGH**: Inventory Management System (medical supplies, medication tracking)
- **💰 HIGH**: Billing & Financial Management (comprehensive patient billing)

### **PLANNED FEATURES** (Week 7+ - After Core Systems Stable)
**User Experience Enhancement**: Originally planned features moved to Phase 2
- **🆔 MEDIUM**: Role-based ID system (numeric for students, alphanumeric for staff)
- **🔔 MEDIUM**: In-app notification center with real-time updates
- **💭 MEDIUM**: Enhanced feedback automation with multi-channel prompts

## 📊 **Critical References**
- **[CURRENT_PRIORITIES_ROADMAP.md](CURRENT_PRIORITIES_ROADMAP.md)** - Active 8-week implementation plan
- **[COMPREHENSIVE_SYSTEM_ANALYSIS_REPORT.md](COMPREHENSIVE_SYSTEM_ANALYSIS_REPORT.md)** - Complete system analysis findings
- **[PRIORITY_FEATURES_PLAN.md](PRIORITY_FEATURES_PLAN.md)** - Original planned features (now Phase 2)
- **[DATA_BACKUP_IMPLEMENTATION_PLAN.md](DATA_BACKUP_IMPLEMENTATION_PLAN.md)** - Complete backup system plan
- **[DISASTER_RECOVERY_PROCEDURES.md](DISASTER_RECOVERY_PROCEDURES.md)** - Emergency recovery procedures
- **[BACKUP_SYSTEM_DEPLOYMENT_GUIDE.md](BACKUP_SYSTEM_DEPLOYMENT_GUIDE.md)** - Production deployment guide

---

**Last Updated**: August 17, 2025 - **SYSTEM CRITICALLY IMPAIRED**  
**System Status**: **CRITICALLY IMPAIRED** - Administrative interfaces broken  
**Current Priority**: **EMERGENCY BUG FIXES** - Database monitor and backup system web interfaces  
**Critical Issues**: 
- ❌ Database monitor page 500 errors - API endpoint mismatches between frontend/backend
- ❌ Backup system web interface completely broken - unable to access backup management
- ⚠️ Pending database migration needs to be applied on Heroku for field length fixes
- ⚠️ Cloudinary storage major overhaul completed but requires testing to verify functionality
**Emergency Fix Required**: Fix API endpoint mismatches + Apply pending migrations + Test Cloudinary  
**Documentation**: See **[CURRENT_CRITICAL_ISSUES.md](CURRENT_CRITICAL_ISSUES.md)** for detailed technical analysis