# USC-PIS Security Audit Report

## Executive Summary

This document provides a comprehensive security audit of the USC Patient Information System (USC-PIS), identifying critical vulnerabilities, security strengths, and actionable remediation steps. The system demonstrates good security awareness but contains several **critical vulnerabilities** requiring immediate attention.

**Risk Level**: 🔴 **HIGH** - Multiple critical vulnerabilities requiring immediate remediation

## Critical Security Vulnerabilities

### 🔴 **Critical Issue #1: Hardcoded Secret Key**
**Location**: `backend/backend/settings.py:59`
```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-q0=r7vwj)6n3rfwu6tcdz)n1c#*hy8$kdd55@m7ikx46u)3m-4')
```
**Risk**: **CRITICAL** - Complete system compromise possible
**Impact**: Session hijacking, CSRF bypass, data tampering
**Remediation**: Remove fallback, require environment variable

### 🔴 **Critical Issue #2: SQL Injection Vulnerability**
**Location**: `backend/authentication/views.py:384-397`
```python
cursor.execute("""
    SELECT...
""")
```
**Risk**: **CRITICAL** - Database compromise possible
**Impact**: Data exfiltration, data manipulation, privilege escalation
**Remediation**: Use parameterized queries or Django ORM

### 🔴 **Critical Issue #3: Production Credentials Exposure**
**Location**: `backend/.env` (tracked in repository)
```
DATABASE_URL=postgres://ud3u7jqbnm24pu:p0ece0857bf635a8bb146e289b3ed8d5c06fe6a6796450ae790af3b89adad82dc@...
```
**Risk**: **CRITICAL** - Production database access
**Impact**: Complete data breach, system compromise
**Remediation**: Remove from repository, use secure secret management

### 🟡 **High Issue #4: CSRF Protection Bypass**
**Location**: `backend/authentication/views.py:1015`
```python
@csrf_exempt
def api_test(request):
```
**Risk**: **HIGH** - Cross-site request forgery
**Impact**: Unauthorized actions on behalf of users
**Remediation**: Remove exemption or justify with proper documentation

## Security Assessment by Component

### **Authentication & Authorization**

#### ✅ **Strengths**
- Token-based authentication with Django REST Framework
- Role-based access control (ADMIN, STAFF, DOCTOR, NURSE, STUDENT)
- Password validation with multiple validators
- Rate limiting on login attempts (implemented)
- USC domain validation for new registrations

#### ⚠️ **Issues**
- Hardcoded secret key fallback
- No session timeout configuration
- Missing concurrent session limits
- No automatic token rotation

#### 📋 **Recommendations**
```python
# Secure secret key management
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

# Session security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Token security
TOKEN_EXPIRY = 24 * 60 * 60  # 24 hours
ROTATE_TOKENS = True
```

### **Input Validation & Data Security**

#### ✅ **Strengths**
- Comprehensive file upload validation
- Magic byte checking for file types
- File size limits enforced
- Email validation with USC domain checking
- XSS protection through Django templates

#### ⚠️ **Issues**
- SQL injection in database health checks
- Missing input sanitization in some endpoints
- No rate limiting on file uploads
- Large file uploads can cause DoS

#### 📋 **Recommendations**
```python
# Input sanitization
import bleach

def sanitize_input(data):
    if isinstance(data, str):
        return bleach.clean(data, tags=[], strip=True)
    return data

# File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_TEMP_DIR = '/secure/temp/uploads'
```

### **Database Security**

#### ✅ **Strengths**
- PostgreSQL with proper foreign key constraints
- Parameterized queries in most locations
- User role separation
- Audit trails with timestamps

#### ⚠️ **Issues**
- Raw SQL execution in health checks
- No field-level encryption for sensitive data
- Missing database connection encryption verification
- No query logging for security events

#### 📋 **Recommendations**
```python
# Database security
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',
    'connect_timeout': 10,
}

# Sensitive data encryption
ENCRYPTED_FIELDS = ['medical_history', 'allergies', 'emergency_contact_phone']

# Query logging
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['security_file'],
        }
    }
}
```

### **Network Security**

#### ✅ **Strengths**
- CORS properly configured
- HTTPS enforcement in production
- Proper HTTP methods restriction

#### ⚠️ **Issues**
- Missing security headers
- No Content Security Policy (CSP)
- Missing HTTP Strict Transport Security (HSTS)
- No X-Frame-Options protection

#### 📋 **Recommendations**
```python
# Security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
```

## HIPAA Compliance Assessment

### **Current Compliance Status**: 🟡 **Partial**

#### **Administrative Safeguards**
- ⚠️ **Missing**: Designated security officer
- ⚠️ **Missing**: Formal security policies
- ✅ **Present**: User access controls
- ⚠️ **Missing**: Regular security training

#### **Physical Safeguards**
- ⚠️ **Unknown**: Data center physical security (Heroku managed)
- ⚠️ **Missing**: Workstation access controls
- ⚠️ **Missing**: Media disposal procedures

#### **Technical Safeguards**
- ✅ **Present**: Access controls
- ⚠️ **Partial**: Audit logs (limited)
- ⚠️ **Missing**: Data integrity controls
- ⚠️ **Missing**: Transmission security (partial)

### **HIPAA Recommendations**
1. **Implement audit logging** for all patient data access
2. **Add data encryption** at rest and in transit
3. **Create data retention** and disposal policies
4. **Establish user training** programs
5. **Document security** policies and procedures

## File Upload Security Analysis

### **Current Implementation**
```python
# File validation in file_uploads/validators.py
- MIME type checking
- File signature validation
- Size limits (varies by type)
- Filename sanitization
- Virus scanning capabilities
```

#### ✅ **Strengths**
- Comprehensive file type validation
- Magic byte checking prevents bypass
- Path traversal protection
- Malware signature detection

#### ⚠️ **Risks**
- No real-time virus scanning
- Missing file quarantine system
- No file access logging
- Large files can cause memory issues

### **Enhanced Security Recommendations**
```python
# Enhanced file security
SECURE_FILE_STORAGE = {
    'VIRUS_SCAN': True,
    'QUARANTINE_SUSPICIOUS': True,
    'LOG_ALL_ACCESS': True,
    'ENCRYPT_STORAGE': True,
    'AUTO_DELETE_TEMP': True,
}
```

## API Security Assessment

### **Current API Security**
- Token-based authentication
- CORS configuration
- Rate limiting (partial)
- Input validation

#### ⚠️ **API Vulnerabilities**
1. **No API versioning** - Breaking changes affect all clients
2. **Inconsistent error responses** - Information leakage possible
3. **Missing request ID tracking** - Difficult to trace attacks
4. **No API rate limiting** on most endpoints

### **API Security Recommendations**
```python
# Enhanced API security
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.NamespaceVersioning',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# Request tracking
MIDDLEWARE += ['security.middleware.RequestTrackingMiddleware']
```

## Security Monitoring & Logging

### **Current State**
- Basic Django logging
- Limited security event tracking
- No centralized log management
- Missing security alerting

### **Enhanced Monitoring Recommendations**
```python
# Security logging
LOGGING = {
    'version': 1,
    'handlers': {
        'security_file': {
            'class': 'logging.FileHandler',
            'filename': '/var/log/security.log',
            'formatter': 'security_formatter',
        },
        'security_email': {
            'class': 'django.utils.log.AdminEmailHandler',
            'level': 'ERROR',
        }
    },
    'loggers': {
        'security': {
            'handlers': ['security_file', 'security_email'],
            'level': 'INFO',
        }
    }
}

# Security events to log
SECURITY_EVENTS = [
    'failed_login_attempts',
    'privilege_escalation_attempts',
    'suspicious_file_uploads',
    'database_access_anomalies',
    'configuration_changes'
]
```

## Penetration Testing Recommendations

### **Immediate Testing Priorities**
1. **SQL Injection testing** across all endpoints
2. **Authentication bypass** attempts
3. **File upload security** testing
4. **Session management** vulnerabilities
5. **Cross-site scripting** (XSS) testing

### **Testing Tools**
- **OWASP ZAP** for automated vulnerability scanning
- **SQLMap** for SQL injection testing
- **Burp Suite** for manual testing
- **Bandit** for static code analysis

## Compliance Requirements

### **Healthcare Data Protection**
As a healthcare system handling patient data:
1. **HIPAA compliance** requirements
2. **Data encryption** standards
3. **Access logging** requirements
4. **Breach notification** procedures
5. **Data retention** policies

### **University Requirements**
1. **FERPA compliance** for student records
2. **Institutional security** policies
3. **Data classification** standards
4. **Incident response** procedures

## Remediation Timeline

### **Phase 1: Critical Fixes (Week 1)**
- [ ] Remove hardcoded secret key
- [ ] Fix SQL injection vulnerability
- [ ] Secure production database credentials
- [ ] Implement security headers

### **Phase 2: High-Priority (Weeks 2-3)**
- [ ] Remove CSRF exemptions
- [ ] Implement comprehensive logging
- [ ] Add API rate limiting
- [ ] Enhance input validation

### **Phase 3: Medium-Priority (Weeks 4-6)**
- [ ] Implement data encryption
- [ ] Add audit logging
- [ ] Create security policies
- [ ] Enhance monitoring

### **Phase 4: Compliance (Weeks 6-8)**
- [ ] HIPAA compliance assessment
- [ ] Security training program
- [ ] Incident response procedures
- [ ] Penetration testing

## Security Tools & Resources

### **Static Analysis Tools**
```bash
# Security scanning
bandit -r backend/
safety check
semgrep --config=security backend/

# Dependency scanning
pip-audit
```

### **Runtime Security**
```python
# Security middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'security.middleware.SecurityHeadersMiddleware',
    'security.middleware.RequestTrackingMiddleware',
    # ... other middleware
]
```

## Conclusion

The USC-PIS system demonstrates **good security awareness** in design but contains **critical vulnerabilities** that must be addressed immediately before continued production use. The system has strong foundations but requires focused security hardening.

**Immediate Actions Required**:
1. Fix hardcoded credentials and SQL injection (within 24 hours)
2. Implement basic security headers (within 48 hours)
3. Secure production database access (within 72 hours)
4. Begin comprehensive security review (within 1 week)

**Overall Security Rating**: 🔴 **2.5/5** (High Risk)
- After critical fixes: 🟡 **3.5/5** (Medium Risk)
- After full remediation: 🟢 **4.5/5** (Low Risk)

---

**Audit Date**: July 8, 2025  
**Auditor**: Claude Code Analysis  
**Next Review**: After Phase 1 critical fixes  
**Classification**: Internal Use - Healthcare Data