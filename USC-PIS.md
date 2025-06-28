# USC Patient Information System (USC-PIS)

A comprehensive clinic management system for the University of Southern California, built with Django REST Framework and React.

## 🏫 USC DOMAIN REQUIREMENT

**IMPORTANT**: This system primarily serves the USC community with special provisions for existing users.

### Email Validation Strategy:

#### 🔒 **New User Registration**
- ✅ **Strict USC Domain**: Only `@usc.edu.ph` emails accepted
- 🔍 **Typo Detection**: Suggests corrections (e.g., `@usc.edu` → `@usc.edu.ph`)
- 🛡️ **Security Validation**: Prevents suspicious email patterns
- 🚫 **External domains blocked**: Gmail, Yahoo, Outlook, etc. are not allowed

#### 🔓 **Existing User Login**
- ✅ **Legacy Support**: Existing users with non-USC emails can continue to login
- ✅ **USC Emails Welcome**: USC users can login normally
- 🔍 **Format Validation**: Basic email format validation still applies
- 📧 **Database Check**: System verifies if user already exists before applying domain restrictions

### Accepted USC Email Examples:
- `john.doe@usc.edu.ph` ✅
- `student123@usc.edu.ph` ✅
- `faculty.member@usc.edu.ph` ✅
- `admin@usc.edu.ph` ✅

### Implementation Details:
```python
# For new registrations (strict)
result = strict_email_validator(email)  # Requires USC domain

# For login (lenient for existing users)
result = email_validator(email, check_existing=True)  # Allows existing users
```

This ensures backward compatibility while transitioning to USC-only registration.

## Project Overview

USC-PIS is a full-featured patient information system designed for university clinic management. It provides role-based access control, patient management, medical records, certificate generation, and comprehensive health information management.

### Key Features
- **Multi-role Authentication System** (Student, Doctor, Nurse, Staff, Admin)
- **USC Email Verification** - Exclusive access for USC community
- **Patient Management** with automatic profile creation for students
- **Medical Records Management** with medical and dental record types
- **Medical Certificate System** with template-based generation and workflow approval
- **File Upload System** with comprehensive security validation
- **Feedback Collection** and analytics
- **Health Information Management**
- **Real-time Dashboard** with health statistics
- **Comprehensive Edge Case Handling** ✅ **IMPLEMENTED**
- **System Monitoring & Recovery** ✅ **IMPLEMENTED**
- **Enhanced Security Features** ✅ **IMPLEMENTED**
- **Frontend Error Handling** ✅ **IMPLEMENTED**

## Technology Stack

### Backend
- **Django 4.2+**
- **Django REST Framework** - API development
- **PostgreSQL/SQLite** - Database
- **Python 3.8+**

### Frontend
- **React 18** (Vite)
- **Material UI** - Component library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

### Deployment
- **Heroku** ready configuration
- **WhiteNoise** for static file serving
- **Gunicorn** WSGI server

## Enhanced Security & Edge Case Handling ✅ **FULLY IMPLEMENTED**

### Authentication Security ✅ **IMPLEMENTED**
- **USC Domain Enforcement**: Only `@usc.edu.ph` emails allowed with typo detection
- **Rate Limiting**: Protection against brute force attacks
- **Enhanced Email Validation**: USC domain verification, typo suggestions, suspicious pattern detection
- **Password Security**: Breach checking, complexity validation, sequential character detection
- **Session Management**: Concurrent login handling, token expiration
- **Account Lockout**: Automatic lockout after failed attempts

### Data Validation & Consistency ✅ **IMPLEMENTED**
- **Patient Data Validation**: Comprehensive name, date, phone, email validation
- **Duplicate Detection**: Fuzzy matching algorithm for patient duplicates
- **Data Consistency Checks**: User-Patient profile synchronization
- **Medical Record Validation**: Date ranges, content validation, duplicate prevention

### File Upload Security ✅ **IMPLEMENTED**
- **Malware Detection**: File signature analysis, suspicious content detection
- **File Type Validation**: MIME type verification, extension validation
- **Size Limits**: Category-specific file size limits
- **Filename Security**: Path traversal prevention, reserved name handling
- **Content Validation**: Image verification, document integrity checks

### System Monitoring ✅ **IMPLEMENTED**
- **Database Health Monitoring**: Connection pools, query performance, locks
- **Resource Monitoring**: CPU, memory, disk usage with automated recovery
- **Performance Tracking**: Request times, error rates, endpoint analytics
- **Automated Alerts**: Email notifications for critical issues
- **Real-time Dashboard**: System health visualization

### Frontend Error Handling ✅ **IMPLEMENTED**
- **Network Recovery**: Offline detection, request retry queuing
- **Comprehensive Error Parsing**: Detailed error categorization and messaging
- **User-Friendly Notifications**: Toast notifications with retry options
- **Form Validation**: Real-time field validation with server error handling
- **Global Error Boundary**: React error boundary for crash protection

## Database Schema

### Core Models

#### User (Authentication)
```python
class User(AbstractUser):
    email = EmailField(unique=True)
    role = CharField(choices=Role.choices)
    first_name = CharField(max_length=30)
    last_name = CharField(max_length=30)
    middle_name = CharField(max_length=30, blank=True)
    sex = CharField(max_length=10, choices=SEX_CHOICES)
    birthday = DateField(null=True, blank=True)
    phone = CharField(max_length=15)
    address_permanent = TextField(blank=True)
    address_present = TextField(blank=True)
    course = CharField(max_length=100, blank=True)
    year_level = CharField(max_length=20, blank=True)
    school = CharField(max_length=100, blank=True)
    id_number = CharField(max_length=20, blank=True)
    completeSetup = BooleanField(default=False)
```

#### Patient
```python
class Patient(models.Model):
    user = OneToOneField(User, related_name='patient_profile')
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    date_of_birth = DateField()
    gender = CharField(max_length=1, choices=GENDER_CHOICES)
    phone_number = CharField(max_length=15)
    email = EmailField()
    address = TextField()
    created_at = DateTimeField(auto_now_add=True)
    created_by = ForeignKey(User, on_delete=SET_NULL)
```

#### MedicalRecord
```python
class MedicalRecord(models.Model):
    patient = ForeignKey(Patient, on_delete=CASCADE)
    visit_date = DateField()
    diagnosis = TextField()
    treatment = TextField()
    notes = TextField(blank=True)
    record_type = CharField(choices=RECORD_TYPE_CHOICES)
    created_by = ForeignKey(User, on_delete=SET_NULL)
    created_at = DateTimeField(auto_now_add=True)
```

#### MedicalCertificate
```python
class MedicalCertificate(models.Model):
    patient = ForeignKey(Patient, on_delete=CASCADE)
    template = ForeignKey(CertificateTemplate, on_delete=CASCADE)
    status = CharField(choices=STATUS_CHOICES, default='DRAFT')
    content = JSONField()
    issued_date = DateField(null=True, blank=True)
    valid_until = DateField(null=True, blank=True)
    created_by = ForeignKey(User, on_delete=SET_NULL)
    approved_by = ForeignKey(User, on_delete=SET_NULL)
```

#### UploadedFile (Enhanced)
```python
class UploadedFile(models.Model):
    file = FileField(upload_to='uploads/')
    original_filename = CharField(max_length=255)
    file_size = PositiveIntegerField()
    content_type = CharField(max_length=100)
    checksum = CharField(max_length=64)  # SHA-256 hash
    uploaded_by = ForeignKey(User, on_delete=CASCADE)
    upload_date = DateTimeField(auto_now_add=True)
    is_secure = BooleanField(default=True)
    scan_result = JSONField(null=True, blank=True)
```

## API Endpoints

### Authentication ✅ **IMPLEMENTED**
- `POST /api/auth/register/` - Enhanced user registration with validation
- `POST /api/auth/login/` - Enhanced login with rate limiting
- `POST /api/auth/logout/` - Secure logout
- `POST /api/auth/check-email/` - Email validation with typo detection
- `POST /api/auth/complete-profile/` - Profile setup with edge case handling

### Patients ✅ **IMPLEMENTED**
- `GET /api/patients/patients/` - List patients with role-based filtering
- `POST /api/patients/patients/` - Create patient with duplicate detection
- `GET /api/patients/patients/{id}/` - Get patient details
- `PUT /api/patients/patients/{id}/` - Update patient with validation
- `GET /api/patients/patients/{id}/check-duplicates/` - Check for duplicates

### Medical Records ✅ **IMPLEMENTED**
- `GET /api/patients/medical-records/` - List medical records
- `POST /api/patients/medical-records/` - Create medical record with validation
- `GET /api/patients/medical-records/{id}/` - Get medical record
- `PUT /api/patients/medical-records/{id}/` - Update medical record

### File Uploads ✅ **IMPLEMENTED**
- `POST /api/files/upload/` - Secure file upload with validation
- `GET /api/files/files/` - List user files
- `GET /api/files/files/{id}/download/` - Secure file download

### System Health ✅ **IMPLEMENTED**
- `GET /api/system/health/` - Comprehensive system health check
- `GET /api/system/database-health/` - Database-specific health metrics
- `GET /api/system/performance/` - Performance statistics
- `GET /api/system/resources/` - System resource monitoring

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (recommended) or SQLite (development)

### Backend Setup
```bash
cd USC-PIS/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd USC-PIS/backend/frontend/frontend
npm install
npm run dev  # Development
npm run build  # Production
```

### Environment Variables
```bash
# .env file
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost/uscpis
FRONTEND_URL=http://localhost:3000
DEFAULT_FROM_EMAIL=noreply@uscpis.com

# Security Settings ✅ **IMPLEMENTED**
RATE_LIMIT_ENABLED=True
PASSWORD_BREACH_CHECK=True
FILE_SCAN_ENABLED=True
SYSTEM_MONITORING=True
```

## Edge Case Handling Implementation ✅ **FULLY IMPLEMENTED**

### 1. Authentication Edge Cases ✅ **IMPLEMENTED**
```python
# Rate limiting
from authentication.validators import rate_limiter
is_limited, time_remaining = rate_limiter.is_rate_limited(client_ip, 'login')

# Email validation with typo detection
from authentication.validators import email_validator
validation_error = email_validator(email)
if 'Did you mean' in validation_error:
    # Suggest correction to user

# Password breach checking
from authentication.validators import password_validator
password_errors = password_validator.validate(password, user_data)
```

### 2. Patient Data Edge Cases ✅ **IMPLEMENTED**
```python
# Duplicate detection
from patients.validators import duplicate_detector
potential_duplicates = duplicate_detector.find_potential_duplicates(patient_data)

# Data validation
from patients.validators import patient_validator
validation_errors = patient_validator.validate_patient_data(data)

# Consistency checking
from patients.validators import consistency_checker
consistency_errors = consistency_checker.check_user_patient_consistency(user, patient_data)
```

### 3. File Upload Edge Cases ✅ **IMPLEMENTED**
```python
# Comprehensive file validation
from file_uploads.validators import file_security_validator
validation_errors = file_security_validator.validate_file(uploaded_file)

# Malware detection
if any(sig in file_content for sig in SUSPICIOUS_SIGNATURES):
    raise ValidationError("File contains suspicious content")

# Duplicate file detection
from file_uploads.validators import file_integrity_checker
existing_file_id = file_integrity_checker.check_duplicate_file(uploaded_file, user)
```

### 4. System Monitoring ✅ **IMPLEMENTED**
```python
# Database health monitoring
from utils.system_monitors import db_monitor
db_monitor.start_monitoring()

# Resource monitoring with recovery
from utils.system_monitors import resource_monitor
resource_monitor.start_monitoring()

# Performance tracking
from utils.system_monitors import performance_monitor
performance_monitor.record_request(request_time, endpoint, status_code)
```

### 5. Frontend Error Handling ✅ **IMPLEMENTED**
```javascript
// Comprehensive error handling
import { useErrorHandler, networkRecovery } from './utils/errorHandling';

const { errors, handleError, executeAsync } = useErrorHandler();

// Network recovery
if (errorInfo.retryable) {
    networkRecovery.addToRetryQueue(requestFunction, context);
}

// User-friendly notifications
ErrorNotificationManager.show(errorInfo, { showRetryButton: true });
```

## Deployment

### Heroku Deployment
```bash
# Install Heroku CLI
heroku create usc-pis-app
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set SECRET_KEY=your_secret_key
heroku config:set DEBUG=False
git push heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### Production Configuration ✅ **IMPLEMENTED**
```python
# settings/production.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Enhanced security settings ✅ **IMPLEMENTED**
RATELIMIT_ENABLE = True
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
```

## Security Features ✅ **FULLY IMPLEMENTED**

### Authentication Security ✅ **IMPLEMENTED**
- JWT-based authentication with secure token handling
- Rate limiting on login attempts (5 attempts per 15 minutes)
- Account lockout after excessive failed attempts
- Password breach checking against known compromised passwords
- Email validation with disposable email detection

### Data Protection ✅ **IMPLEMENTED**
- Input sanitization and validation on all endpoints
- SQL injection prevention through ORM usage
- XSS protection with Content Security Policy
- CSRF protection for all state-changing operations
- Duplicate patient detection with fuzzy matching

### File Upload Security ✅ **IMPLEMENTED**
- Comprehensive file type validation (MIME + extension)
- Malware signature detection
- File size limits (10MB images, 50MB documents)
- Filename sanitization and path traversal prevention
- Content verification for images and documents

### System Security ✅ **IMPLEMENTED**
- Database connection monitoring and leak detection
- Resource usage monitoring with automated recovery
- Performance tracking and anomaly detection
- Automated alert system for critical issues
- Comprehensive logging and error tracking

## Testing

### Backend Tests ✅ **IMPLEMENTED**
```bash
cd USC-PIS/backend
python manage.py test
python manage.py test authentication.tests.test_edge_cases
python manage.py test patients.tests.test_validation
python manage.py test file_uploads.tests.test_security
```

### Frontend Tests ✅ **IMPLEMENTED**
```bash
cd USC-PIS/backend/frontend/frontend
npm test
npm run test:coverage
```

### Security Testing ✅ **IMPLEMENTED**
```bash
# Rate limiting tests
python manage.py test authentication.tests.test_rate_limiting

# File upload security tests
python manage.py test file_uploads.tests.test_malware_detection

# Data validation tests
python manage.py test patients.tests.test_duplicate_detection
```

## Monitoring & Maintenance ✅ **IMPLEMENTED**

### System Health Monitoring ✅ **IMPLEMENTED**
- Database connection health and performance monitoring
- System resource usage tracking (CPU, memory, disk)
- Application performance metrics and error tracking
- Automated recovery mechanisms for common issues

### Maintenance Tasks ✅ **IMPLEMENTED**
```bash
# Database maintenance
python manage.py cleanup_expired_tokens
python manage.py optimize_database_indexes
python manage.py check_data_consistency

# System cleanup
python manage.py clean_temporary_files
python manage.py archive_old_records
python manage.py generate_health_report

# Start system monitoring
python manage.py start_monitoring --daemon
```

### Performance Optimization ✅ **IMPLEMENTED**
- Database query optimization with select_related/prefetch_related
- File upload streaming for large files
- Caching for frequently accessed data
- Background task processing for heavy operations

## Contributing

### Development Guidelines
1. Follow Django and React best practices
2. Implement comprehensive edge case handling for all new features
3. Add appropriate validation and security checks
4. Include unit tests for all new functionality
5. Update documentation for any changes

### Code Quality
- Use type hints in Python code
- Follow PEP 8 styling guidelines
- Use ESLint and Prettier for JavaScript formatting
- Implement proper error handling and logging
- Add comprehensive docstrings and comments

## License

This project is proprietary software developed for the University of Southern California.

## Support

For technical support or questions about the system:
- Create an issue in the project repository
- Contact the development team
- Check the system health dashboard for real-time status

---

**Last Updated**: December 2024
**Version**: 2.1.0 (Fully implemented with comprehensive edge case handling)
**Maintainer**: USC IT Development Team
**Status**: ✅ **PRODUCTION READY** 