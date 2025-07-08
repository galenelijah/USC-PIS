# USC-PIS Project Memory for Claude Code

## Project Overview

**USC Patient Information System (USC-PIS)** is a comprehensive healthcare management web application for the University of Southern California clinic operations. This document serves as memory for Claude Code to understand the project context across sessions.

## Project Context

### **Academic Background**
- **Type**: Undergraduate thesis project (Bachelor of Science in Computer Engineering)
- **Team**: Group L - 5 members (Engr. Elline Fabian, Engr. Kenneth Carl Labarosa, Ron Vanz Petiluna, Janren Renegado, Galen Elijah Sabequil)
- **Institution**: University of San Carlos, Cebu City, Philippines
- **Date**: July 2024
- **Scope**: USC Downtown Campus clinic modernization

### **System Purpose**
Modernize USC-DC Clinic's paper-based patient information system with a secure, web-based platform that:
- Ensures comprehensive medical and dental record-keeping
- Promotes health campaigns and information dissemination
- Gathers patient feedback and automates reporting
- Facilitates medical certificate issuance
- Sends notifications and manages user communications

## Technology Stack

### **Backend**
- **Framework**: Django 5.0.2 with Django REST Framework 3.14.0
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Token-based with role-based access control
- **Deployment**: Heroku with WhiteNoise for static files
- **Security**: Comprehensive validation, rate limiting, file security

### **Frontend**
- **Framework**: React 18 with Vite build system
- **UI Library**: Material-UI design system
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **HTTP Client**: Axios

### **Infrastructure**
- **Hosting**: Heroku (production)
- **Database**: Heroku Postgres
- **Version Control**: GitHub
- **CI/CD**: Heroku Pipelines

## System Architecture

### **Django Apps Structure**
- `authentication/` - User management and authentication
- `patients/` - Patient profiles and medical records
- `health_info/` - Health campaigns and information
- `feedback/` - Patient feedback collection and analytics
- `file_uploads/` - Secure file upload system
- `medical_certificates/` - Certificate generation and workflow
- `notifications/` - In-app notification system
- `reports/` - Comprehensive reporting system
- `utils/` - System monitoring and management commands

### **User Roles**
- **ADMIN**: Full system access
- **STAFF**: Administrative functions
- **DOCTOR**: Medical record management
- **NURSE**: Medical record management  
- **STUDENT**: Limited access to own records

## Current System Status (As of July 8, 2025)

### **Production Database Statistics**
- **Total Users**: 17 (15 students, 2 admins)
- **USC Email Compliance**: 76.5% (13/17 users have @usc.edu.ph emails)
- **Complete Profiles**: 76.5% (13/17 users completed setup)
- **Active Period**: 90 days (April 7 - July 7, 2025)
- **Patients**: 9 in system
- **Medical Records**: 3 created
- **Dental Records**: 1 created
- **Feedback Entries**: 2 collected
- **Uploaded Files**: 0 currently

### **Key Features Implemented**
✅ **Complete**: 
- Multi-role authentication system
- Patient management with profile creation
- Medical and dental records management (comprehensive)
- File upload system with security validation
- Feedback collection and analytics
- Health information management
- Real-time dashboard with statistics
- System monitoring and recovery
- Enhanced security features

⚠️ **Partially Implemented**:
- Medical certificate workflow
- Health campaign system
- Email notifications (only in-app notifications exist)

❌ **Missing from Thesis**:
- Inventory management (deferred)
- Appointment scheduling (deferred)

## Security Implementation

### **Strengths**
- Comprehensive input validation and file security
- Rate limiting on authentication endpoints  
- Password security with breach checking
- USC domain enforcement for new registrations
- CORS configuration and CSRF protection
- System monitoring with automated alerts

### **Critical Issues Identified**
🔴 **High Priority**:
- Hardcoded fallback secret key in settings.py:59
- SQL injection vulnerability in authentication/views.py:384-397
- Production database credentials exposed in .env file

🟡 **Medium Priority**:
- Missing security headers (CSP, XSS, HSTS)
- No API versioning strategy
- Mixed email domains against USC policy

## Performance Analysis

### **Backend Issues**
- N+1 query problems in patient views
- Missing database indexes on frequently queried fields
- Large view methods (1000+ lines in authentication views)
- No caching strategy implemented

### **Frontend Issues**
- No code splitting or lazy loading
- Missing React.memo and useCallback optimizations
- Bundle size not optimized
- Inconsistent error handling patterns

### **Database Performance**
- 39 tables with low data volumes (possible over-engineering)
- Complex user model (45+ columns) needs normalization
- Good audit trails but missing performance indexes

## Improvement Recommendations

### **Phase 1: Critical Security (Week 1)**
1. Remove hardcoded secrets and fix SQL injection
2. Implement proper security headers
3. Secure database credential management
4. Address email compliance gaps

### **Phase 2: Performance Optimization (Weeks 2-4)**
1. Database query optimization and indexing
2. Frontend code splitting and React optimization
3. API caching implementation
4. Component refactoring and state management

### **Phase 3: Architecture Improvements (Weeks 5-8)**
1. Testing suite enhancement (target >80% coverage)
2. TypeScript migration planning
3. CI/CD pipeline implementation
4. Comprehensive monitoring setup

## Key Files and Locations

### **Critical Configuration**
- `backend/backend/settings.py` - Main Django configuration
- `backend/.env` - Environment variables (⚠️ contains production DB URL)
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies

### **Important Models**
- `authentication/models.py` - User model (45+ fields)
- `patients/models.py` - Patient, MedicalRecord, DentalRecord
- `feedback/models.py` - Feedback collection
- `file_uploads/models.py` - File upload security

### **API Endpoints**
- Authentication: `/api/auth/`
- Patients: `/api/patients/`
- Health Info: `/api/health-info/`
- Reports: `/api/reports/`
- System Health: `/api/system/`

## Development Environment Setup

### **Backend Setup**
```bash
cd USC-PIS/backend
source venv/Scripts/activate  # Windows
# or: source venv/bin/activate  # Linux/Mac
python manage.py migrate
python manage.py runserver
```

### **Frontend Setup**
```bash
cd USC-PIS/backend/frontend/frontend
npm install
npm run dev
```

### **Database Access**
- **Development**: SQLite (db.sqlite3)
- **Production**: PostgreSQL via DATABASE_URL environment variable
- **Connection**: Use venv/Scripts/python.exe for Windows paths

## Thesis vs Implementation Analysis

### **Strong Alignment**
- Technology stack matches exactly (Django + React + PostgreSQL)
- All core features delivered and exceed requirements
- Security implementation far surpasses "basic" thesis requirements

### **Areas Exceeded**
- Advanced security (enterprise-grade vs basic)
- Comprehensive dental records (27 fields vs basic)
- System monitoring and automated recovery
- Production-ready deployment features

### **Minor Gaps**
- Medical certificate workflow needs enhancement
- Health campaign system needs development
- Email notifications vs in-app only

## Next Steps Priority

1. **Immediate**: Fix critical security vulnerabilities
2. **Short-term**: Increase system adoption (low usage despite good implementation)
3. **Medium-term**: Performance optimization and testing
4. **Long-term**: Advanced features and compliance enhancements

---

**Last Updated**: July 8, 2025
**System Status**: Production-ready but underutilized
**Priority Focus**: Security fixes and user adoption