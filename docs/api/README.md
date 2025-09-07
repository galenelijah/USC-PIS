# USC-PIS API Documentation

[![API Version](https://img.shields.io/badge/API-v1.0-blue)]()
[![Status](https://img.shields.io/badge/Status-Production-success)]()
[![Framework](https://img.shields.io/badge/Django_REST-3.14.0-green)]()

## Overview
USC Patient Information System REST API provides comprehensive healthcare management functionality with enterprise-grade security and role-based access control.

## 🆕 Recent Updates (August 18, 2025)
- **✅ Email Administration APIs**: Complete email automation management endpoints with real-time testing and monitoring
- **✅ Email System Testing**: Multi-type email testing API with dry-run capabilities (feedback, welcome, certificates, alerts)
- **✅ Automated Email Controls**: API endpoints for manual email triggers with customizable settings
- **✅ API Authentication Fix**: Resolved HTML redirect issues, proper JSON responses for all admin endpoints
- **✅ Enterprise Backup System APIs**: Complete backup execution, download, and restore endpoints with smart conflict resolution
- **✅ Data Recovery APIs**: Intelligent backup restore with merge strategies (replace, merge, skip) and preview functionality
- **✅ Performance Optimization**: Quick backup API options for 50%+ faster completion
- **✅ System Health Monitoring**: Enhanced database health and backup status endpoints
- **✅ Email Notification System**: Automated email API integration with professional templates
- **✅ Enhanced Dashboard**: Campaigns & announcements API integration
- **✅ Advanced Validation**: Comprehensive date validation across endpoints
- **✅ Student Optimization**: Role-based filtering and data access patterns  
- **✅ Data Compatibility**: Enhanced JSON handling for nested medical data
- **✅ Search Enhancement**: USC ID search across all medical endpoints
- **✅ Export APIs**: Professional CSV/PDF export with clinical formatting

## Authentication Endpoints

### Register User
- **URL**: `/api/auth/register/`
- **Method**: `POST`
- **Data**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "password2": "password123",
    "role": "STUDENT",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

### Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Data**:
  ```json
  {
    "username": "user@example.com",
    "password": "password123"
  }
  ```

### Get User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

### Update User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `PUT`
- **Headers**: `Authorization: Token <token>`

## Patient Endpoints

### List Patients
- **URL**: `/api/patients/patients/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse

### Create Patient
- **URL**: `/api/patients/patients/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2000-01-01",
    "gender": "M",
    "email": "patient@example.com",
    "phone_number": "1234567890",
    "address": "123 Main St",
    "user": 1  // Optional: Link to User account for students
  }
  ```

### Get Patient Details
- **URL**: `/api/patients/patients/<id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse

## Medical Records Endpoints

### List Medical Records
- **URL**: `/api/patients/medical-records/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Filtering**: 
  - Students: Only their own records (requires linked Patient profile)
  - Medical Staff: All records

### Create Medical Record
- **URL**: `/api/patients/medical-records/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "patient": 1,
    "visit_date": "2025-08-02",
    "diagnosis": "Common cold",
    "treatment": "Rest and fluids",
    "notes": "Patient advised to rest",
    "vital_signs": {
      "blood_pressure": "120/80",
      "temperature": "36.5",
      "heart_rate": "72",
      "respiratory_rate": "16"
    }
  }
  ```

### Get Medical Record Details
- **URL**: `/api/patients/medical-records/<id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

## Dental Records Endpoints

### List Dental Records
- **URL**: `/api/patients/dental-records/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Filtering**: Same as medical records

### Create Dental Record
- **URL**: `/api/patients/dental-records/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "patient": 1,
    "visit_date": "2025-08-02",
    "procedure_performed": "CLEANING",
    "tooth_number": "14",
    "diagnosis": "Routine cleaning",
    "treatment_performed": "Professional dental cleaning",
    "pain_level": 0,
    "cost": "50.00",
    "insurance_covered": true
  }
  ```

## Health Information & Campaign Endpoints (Updated August 3, 2025)

### Get Featured Campaigns
- **URL**: `/api/health-info/campaigns/featured/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Description**: Returns up to 3 featured campaigns for dashboard display
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Flu Vaccination Campaign",
      "category": "VACCINATION",
      "description": "Annual flu vaccination program for all students",
      "created_at": "2025-08-01T10:00:00Z",
      "status": "ACTIVE"
    }
  ]
  ```

### Get Health Information
- **URL**: `/api/health-info/health-information/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users

### Dashboard Stats with Campaign Integration
- **URL**: `/api/auth/dashboard-stats/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Enhanced Response** (includes announcements for dashboard):
  ```json
  {
    "total_patients": 150,
    "total_records": 300,
    "recent_patients": [...],
    "visits_by_month": [...],
    "appointments_today": 5,
    "pending_requests": 3,
    "next_appointment": {...},
    "recent_health_info": {...},
    "profile_completion": 85,
    "announcements": [
      {
        "id": 1,
        "title": "Clinic Hours Update",
        "content": "New clinic hours effective next week",
        "created_at": "2025-08-03T09:00:00Z"
      }
    ]
  }
  ```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Authentication

All endpoints except `/api/auth/login/` and `/api/auth/register/` require authentication.
Include the token in the request header:
```
Authorization: Token <your-token-here>
```

## Email Notification System

USC-PIS includes automated email notifications triggered by various API actions:

### **Automated Email Triggers**

#### **User Registration** (`POST /api/auth/register/`)
- **Trigger**: Successful user account creation
- **Email**: Welcome email sent to new user
- **Template**: Professional welcome message with system overview
- **Timing**: Immediate (asynchronous)

#### **Medical Certificate Events**
- **Certificate Creation**: Confirmation email to student, notification to doctors
- **Certificate Approval**: Approval notification to student
- **Certificate Rejection**: Update notification to student
- **Endpoints**: All `/api/medical-certificates/` workflow endpoints

#### **Password Reset** (`POST /api/auth/password-reset/`)
- **Trigger**: Password reset request
- **Email**: Secure reset link (24-hour expiration)
- **Security**: Token-based authentication required

### **Email Management Commands**

#### **Test Email System**
```bash
# Test email configuration
python manage.py test_email --email user@usc.edu.ph --type welcome

# Test password reset email
python manage.py test_email --email user@usc.edu.ph --type password_reset
```

#### **Automated Feedback Emails**
```bash
# Send feedback requests for visits from 24 hours ago
python manage.py send_feedback_emails --hours 24

# Dry run to preview emails
python manage.py send_feedback_emails --dry-run
```

### **Email Configuration**

#### **Environment Variables Required**
```bash
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@usc-pis.herokuapp.com
EMAIL_HOST=smtp.sendgrid.net  # Optional (default)
EMAIL_PORT=587               # Optional (default)
```

#### **Email Backend Settings**
- **Production**: SMTP backend with SendGrid integration
- **Development**: Console backend (emails printed to terminal)
- **Fallback**: Automatic fallback if SMTP configuration missing

### **Email Features**
- ✅ **Professional Templates**: USC-PIS branded, mobile-responsive design
- ✅ **Security**: Secure token-based links with expiration
- ✅ **Error Handling**: Email failures don't interrupt API operations
- ✅ **Logging**: Comprehensive email delivery logging
- ✅ **Testing**: Built-in testing commands for verification

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Backup & Recovery System APIs

### Backup Health Status
- **URL**: `/api/utils/backup-health/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff only
- **Description**: Get comprehensive system health and backup status
- **Response**:
  ```json
  {
    "database_health": {
      "status": "healthy",
      "total_tables": 15,
      "total_records": 1250,
      "last_backup": "2025-08-17T10:30:00Z"
    },
    "backup_summary": {
      "total_backups": 5,
      "successful_backups": 5,
      "failed_backups": 0,
      "last_successful_backup": "2025-08-17T10:30:00Z"
    },
    "recent_backups": [...]
  }
  ```

### Create Backup
- **URL**: `/api/utils/backup/trigger/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff only
- **Data**:
  ```json
  {
    "backup_type": "database",
    "quick_backup": true,
    "verify_integrity": false
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "backup_id": 123,
    "message": "Backup queued for execution"
  }
  ```

### Download Backup
- **URL**: `/api/utils/backup/download/<backup_id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff only
- **Description**: Download backup file (JSON for database, ZIP for media/full)
- **Response**: Binary file download

### Restore Backup
- **URL**: `/api/utils/backup/restore/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin only
- **Data**:
  ```json
  {
    "backup_id": 123,
    "merge_strategy": "merge",
    "preview_only": false
  }
  ```
- **Merge Strategies**:
  - `replace`: Overwrite existing data (disaster recovery)
  - `merge`: Update only empty fields (safer)
  - `skip`: Add new records only (safest)

## Medical Certificates API

### List Certificates
- **URL**: `/api/medical-certificates/certificates/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Filtering**: Students see only their certificates

### Create Certificate Request
- **URL**: `/api/medical-certificates/certificates/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Data**:
  ```json
  {
    "patient_name": "John Doe",
    "purpose": "Job Application",
    "requested_date": "2025-08-20",
    "fitness_for_work": true,
    "fitness_reason": "Physically fit for desk work"
  }
  ```

### Approve/Reject Certificate
- **URL**: `/api/medical-certificates/certificates/<id>/approve/`
- **URL**: `/api/medical-certificates/certificates/<id>/reject/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Doctor only

## Feedback System API

### Submit Feedback
- **URL**: `/api/feedback/feedback/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Data**:
  ```json
  {
    "patient": 1,
    "visit_date": "2025-08-17",
    "staff_professionalism": 5,
    "service_quality": 5,
    "facility_cleanliness": 4,
    "wait_time_satisfaction": 4,
    "overall_satisfaction": 5,
    "comments": "Excellent service!"
  }
  ```

### Get Feedback Analytics
- **URL**: `/api/feedback/analytics/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Response**: Comprehensive analytics including satisfaction scores and trends

## Reports & Export API

### Generate Report
- **URL**: `/api/reports/reports/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "report_type": "patient_records",
    "format": "PDF",
    "date_from": "2025-01-01",
    "date_to": "2025-08-17",
    "include_personal_info": true
  }
  ```

### Download Report
- **URL**: `/api/reports/reports/<id>/download/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Response**: Binary file download (PDF/CSV/Excel)

## File Upload API

### Upload File
- **URL**: `/api/files/upload/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`, `Content-Type: multipart/form-data`
- **Role Access**: All authenticated users
- **Data**: Form data with file field
- **Features**: 
  - Automatic virus scanning
  - File type validation
  - Size limits (10MB max)
  - Cloudinary integration for persistence

## Notifications API

### Get User Notifications
- **URL**: `/api/notifications/notifications/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Query Parameters**:
  - `unread_only=true`: Filter unread notifications
  - `limit=10`: Limit number of results

### Mark Notification as Read
- **URL**: `/api/notifications/notifications/<id>/mark-read/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Notification owner only

## Search & Filtering

### Patient Search
- **URL**: `/api/patients/patients/?search=<query>`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Search Fields**: first_name, last_name, email, phone_number
- **USC ID Search**: Supports USC ID number searches across all medical forms

### Advanced Filtering
All list endpoints support filtering parameters:
- **Date Ranges**: `date_from`, `date_to`
- **Status Filtering**: `status=active`
- **User Filtering**: `created_by=<user_id>`
- **Role-based Filtering**: Automatic based on user role

## API Versioning & Headers

### Standard Headers
```http
Authorization: Token <your-token>
Content-Type: application/json
Accept: application/json; version=v1
```

### Response Headers
```http
API-Version: v1
X-API-Version: v1
Content-Type: application/json
```

## Performance & Monitoring

### Performance Features
- **Database Optimization**: Comprehensive indexing on all major lookup fields
- **Query Optimization**: select_related and prefetch_related for related data
- **Caching**: Strategic caching for frequently accessed data
- **Rate Limiting**: 500 requests/hour for authenticated users, 100 for anonymous

### Monitoring & Logging
- **Request Logging**: All API requests logged with user, duration, and status
- **Performance Monitoring**: Slow requests (>1s) and high query counts logged
- **Security Logging**: Failed authentication and rate limit violations
- **Health Checks**: `/health` endpoint for system status monitoring

## Security Features

### Authentication & Authorization
- **Token-based Authentication**: Secure API token system
- **Role-based Access Control**: Fine-grained permissions by user role
- **CORS Configuration**: Secure cross-origin resource sharing
- **CSRF Protection**: Cross-site request forgery protection

### Security Headers
- **HSTS**: HTTP Strict Transport Security
- **CSP**: Content Security Policy
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection

### Data Protection
- **Input Validation**: Comprehensive validation using Django REST serializers
- **SQL Injection Protection**: Django ORM provides automatic protection
- **XSS Protection**: Automatic escaping and sanitization
- **File Upload Security**: Type validation and malware scanning

## Email Administration APIs

### Get Email System Status
- **URL**: `/api/utils/email/status/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor only
- **Description**: Get current email system configuration and status
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "email_backend": "django.core.mail.backends.smtp.EmailBackend",
      "is_development_mode": false,
      "smtp_host": "smtp.gmail.com",
      "from_email": "noreply@usc-pis.herokuapp.com",
      "recent_visits_7_days": 15,
      "estimated_feedback_emails": 15,
      "system_health": "operational",
      "last_updated": "2025-08-18T10:30:00Z"
    }
  }
  ```

### Test Email System
- **URL**: `/api/utils/email/test/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor only
- **Data**:
  ```json
  {
    "email": "test@usc.edu.ph",
    "types": ["feedback", "welcome", "certificate", "health_alert"],
    "dry_run": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sent": 2,
      "failed": 0,
      "skipped": 0,
      "details": [
        {
          "type": "feedback",
          "success": true,
          "message": "Feedback email sent to test@usc.edu.ph"
        }
      ]
    },
    "dry_run": true
  }
  ```

### Send Feedback Emails
- **URL**: `/api/utils/email/feedback/send/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor only
- **Data**:
  ```json
  {
    "hours": 24,
    "dry_run": false
  }
  ```
- **Description**: Manually trigger feedback emails for visits from X hours ago
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sent_count": 3,
      "error_count": 0,
      "hours_ago": 24,
      "dry_run": false,
      "output": "Sent 3 feedback emails successfully"
    }
  }
  ```

### Send Health Alert
- **URL**: `/api/utils/email/health-alert/send/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor only
- **Data**:
  ```json
  {
    "alert_level": "warning",
    "force_alert": false,
    "dry_run": false
  }
  ```
- **Alert Levels**: 
  - `all`: Send alerts for all issues
  - `warning`: Send for warning-level and above
  - `unhealthy`: Send only for unhealthy status
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "alert_sent": true,
      "alert_level": "warning",
      "force_alert": false,
      "dry_run": false,
      "output": "Alert email sent to administrators"
    }
  }
  ```

### Get Email Automation Statistics
- **URL**: `/api/utils/email/stats/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor only
- **Description**: Get statistics about email automation and system health
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "visits": {
        "today": 5,
        "yesterday": 8,
        "last_7_days": 45,
        "last_30_days": 180
      },
      "estimated_feedback_emails": {
        "pending_today": 5,
        "pending_yesterday": 8
      },
      "system_health": {
        "overall_status": "healthy",
        "health_percentage": 95.5,
        "healthy_checks": 18,
        "warning_checks": 1,
        "unhealthy_checks": 0
      },
      "last_updated": "2025-08-18T10:30:00Z"
    }
  }
  ```

## Email Setup Guide

For complete email system deployment instructions, see:
**[EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md)**

## Backup System Guide

For comprehensive backup & recovery documentation, see:
**[BACKUP_SYSTEM_GUIDE.md](../../BACKUP_SYSTEM_GUIDE.md)** 
## Feedback Endpoints (Updated Sept 7, 2025)

### Submit Feedback
- **URL**: `/api/feedback/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Authenticated users (patients)
- **Data**:
  ```json
  {
    "medical_record": 123,    // optional; omit for general feedback
    "rating": 5,              // 1–5
    "comments": "Great service",
    "courteous": "yes",       // optional: yes/no
    "recommend": "yes"        // optional: yes/no
  }
  ```

### Check Pending Feedback
- **URL**: `/api/feedback/pending/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Authenticated users (patients)
- **Response**:
  ```json
  {
    "has_pending": true,
    "medical_pending": 1,
    "dental_pending": 1
  }
  ```
