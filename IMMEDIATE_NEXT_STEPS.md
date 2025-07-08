# USC-PIS Immediate Next Steps

## 🚨 **URGENT - Critical Security Fixes Required**

**Timeline**: Complete within 24-72 hours before continued production use

---

## ⏰ **Hour 1-2: Stop Production Access (Optional but Recommended)**

If possible, temporarily restrict production access while fixing critical vulnerabilities:

```bash
# Option 1: Add maintenance mode to Django
# Option 2: Temporarily disable user registration
# Option 3: Add IP whitelist for admin access only
```

**Rationale**: Prevents exploitation during vulnerability window

---

## 🔧 **Hours 2-4: Critical Security Fixes**

### **Fix #1: Remove Hardcoded Secret Key** ⚡ *5 minutes*

**File**: `backend/backend/settings.py` (line 59)

**Current (VULNERABLE)**:
```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-q0=r7vwj)6n3rfwu6tcdz)n1c#*hy8$kdd55@m7ikx46u)3m-4')
```

**Fixed**:
```python
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required in production")
```

**Action**: 
1. Edit settings.py
2. Generate new secret key: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
3. Set in production environment variables
4. Test locally first

### **Fix #2: Remove Production Database URL from .env** ⚡ *2 minutes*

**File**: `backend/.env`

**Action**:
1. Remove `DATABASE_URL=postgres://...` from `.env` file
2. Add `.env` to `.gitignore` if not already there
3. Set DATABASE_URL in Heroku config vars only
4. Verify local development uses SQLite

**Verification**:
```bash
# Check .env file doesn't contain production credentials
cat backend/.env | grep -v DATABASE_URL

# Verify .gitignore contains .env
grep ".env" .gitignore
```

### **Fix #3: Fix SQL Injection** ⚡ *15 minutes*

**File**: `backend/authentication/views.py` (lines 384-397)

**Current (VULNERABLE)**:
```python
cursor.execute("""
    SELECT...
""")
```

**Fixed**:
```python
# Replace with Django ORM queries or parameterized SQL
from django.db import connection

def get_database_health():
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
            ['public']
        )
        return cursor.fetchall()
```

### **Fix #4: Remove CSRF Exemption** ⚡ *2 minutes*

**File**: `backend/authentication/views.py` (line 1015)

**Action**:
```python
# Remove or justify this exemption
# @csrf_exempt  # REMOVE THIS LINE
def api_test(request):
    # Add proper CSRF handling or remove endpoint
```

---

## 🛡️ **Hours 4-6: Basic Security Headers**

### **Add Security Headers** ⚡ *10 minutes*

**File**: `backend/backend/settings.py`

**Add at the end**:
```python
# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS Settings (for production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

### **Test Security Headers** ⚡ *5 minutes*

**Tools**:
- Online: https://securityheaders.com/
- Command: `curl -I https://your-app.herokuapp.com`

**Expected Headers**:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## ✅ **Hours 6-8: Verification & Testing**

### **Security Verification Checklist**

- [ ] **Secret Key**: No hardcoded fallback in settings.py
- [ ] **Database URL**: Not in .env or any committed files
- [ ] **SQL Injection**: All raw SQL queries removed or parameterized  
- [ ] **CSRF**: No unjustified exemptions
- [ ] **Headers**: Security headers present in production
- [ ] **Testing**: All critical functions still work

### **Test Critical Functionality**

```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test", "password":"test"}'

# Test patient creation
curl -X GET http://localhost:8000/api/patients/patients/ \
  -H "Authorization: Token YOUR_TOKEN"

# Test dashboard
curl -X GET http://localhost:8000/api/patients/dashboard-stats/ \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## 📋 **Hours 8-24: Environment Hardening**

### **Production Environment Variables**

**Heroku Config** (set these):
```bash
heroku config:set SECRET_KEY="your-new-secret-key"
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS="your-app.herokuapp.com"

# Verify no sensitive data in config
heroku config
```

### **Local Development Setup**

**Create new `.env` for local development**:
```bash
# backend/.env (local only)
DEBUG=True
SECRET_KEY=local-dev-key-not-for-production
# No DATABASE_URL = uses SQLite
```

### **Git Security Cleanup**

```bash
# Remove sensitive data from git history if needed
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CAUTION - coordinate with team)
git push origin --force --all
```

---

## 🔍 **Day 2-3: Security Validation**

### **Automated Security Scanning**

```bash
# Install security tools
pip install bandit safety

# Run security scans
bandit -r backend/
safety check -r backend/requirements.txt

# Check for secrets in code
git-secrets --scan
```

### **Manual Security Testing**

1. **Authentication Testing**:
   - Try accessing protected endpoints without tokens
   - Test with expired/invalid tokens
   - Verify role-based access control

2. **Input Validation Testing**:
   - Test file uploads with malicious files
   - Try SQL injection in form fields
   - Test XSS in text inputs

3. **Session Security Testing**:
   - Check session timeout behavior
   - Verify secure cookie flags
   - Test concurrent session handling

---

## 📊 **Day 3-7: Database Optimization (Quick Wins)**

### **Add Critical Database Indexes**

**File**: Create `backend/add_indexes.sql`

```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email 
  ON authentication_user(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role 
  ON authentication_user(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_user 
  ON patients_patient(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_patient_date 
  ON patients_medicalrecord(patient_id, visit_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dental_patient_date 
  ON patients_dentalrecord(patient_id, visit_date);
```

**Apply indexes**:
```bash
# Connect to production database
heroku pg:psql --app your-app-name < add_indexes.sql
```

### **Quick Query Optimization**

**File**: `backend/patients/views.py`

**Find and replace**:
```python
# BEFORE (N+1 queries)
patients = Patient.objects.all()

# AFTER (optimized)
patients = Patient.objects.select_related('user', 'created_by').prefetch_related(
    'medical_records__created_by',
    'dental_records__created_by'
)
```

---

## 🎯 **Success Criteria**

### **Week 1 Goals**
- [ ] **Zero critical security vulnerabilities**
- [ ] **Production credentials secured**
- [ ] **Security headers implemented**
- [ ] **Basic database optimization completed**
- [ ] **All functionality tested and working**

### **Immediate Validation**

**Security Check**:
```bash
# No hardcoded secrets
grep -r "django-insecure" backend/ || echo "✅ No hardcoded secrets"

# No production URLs in code
grep -r "amazonaws.com" backend/ || echo "✅ No production URLs"

# Security headers present
curl -I https://your-app.herokuapp.com | grep -E "(X-Frame|X-Content|X-XSS)"
```

**Performance Check**:
```bash
# Database query count (should be lower after optimization)
# Check Django toolbar or add query logging
```

---

## 🚨 **Emergency Rollback Plan**

If anything breaks during fixes:

1. **Immediate Rollback**:
   ```bash
   git checkout HEAD~1  # Previous commit
   git push heroku main --force
   ```

2. **Restore Database Access**:
   ```bash
   heroku config:set DATABASE_URL="backup-url"
   ```

3. **Contact List**:
   - Team members: [Add contact info]
   - Heroku support: [If needed]
   - Database backup: [Location]

---

## 📞 **Support & Resources**

### **If You Get Stuck**
1. **Claude Code**: Reference CLAUDE.md and ask for help
2. **Documentation**: Check Django/DRF official docs
3. **Security**: OWASP guidelines for web applications
4. **Community**: Stack Overflow, Django forums

### **Key Commands Reference**
```bash
# Start local development
cd backend && source venv/Scripts/activate && python manage.py runserver

# Deploy to production
git push heroku main

# Check production logs
heroku logs --tail

# Access production database
heroku pg:psql
```

---

**⚡ START WITH HOUR 1-2 IMMEDIATELY**

**📅 Timeline**: Complete all critical fixes within 72 hours
**🎯 Goal**: Zero critical vulnerabilities, production-ready security
**📊 Success**: System secure and performant

---

**Created**: July 8, 2025  
**Priority**: 🔴 URGENT  
**Estimated Time**: 8-24 hours total  
**Prerequisites**: Access to production environment and git repository