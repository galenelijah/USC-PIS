# USC-PIS Emergency Repair Guide

**Date Created**: August 17, 2025  
**Status**: **CRITICAL SYSTEM FAILURES**  
**Emergency Contact**: Claude Code Assistant  

---

## 🚨 **EMERGENCY ALERT**

**SYSTEM CRITICALLY IMPAIRED** - Multiple administrative interfaces are completely broken. The USC-PIS system is currently in a state where core administrative functions are inaccessible, severely limiting operational capabilities.

---

## 📋 **Quick Repair Checklist**

### **Step 1: Fix Database Monitor API Endpoints** ⏱️ 30 minutes
- [ ] Deploy frontend API endpoint fix
- [ ] Test database monitor page access
- [ ] Verify all 3 tabs load without errors

### **Step 2: Apply Database Migration** ⏱️ 10 minutes  
- [ ] Run `heroku run python backend/manage.py migrate`
- [ ] Verify migration applied successfully
- [ ] Test health information creation

### **Step 3: Test Cloudinary Storage** ⏱️ 30 minutes
- [ ] Test image upload functionality
- [ ] Verify images reach Cloudinary servers
- [ ] Check image URL format and accessibility

### **Step 4: Verify System Recovery** ⏱️ 15 minutes
- [ ] Test backup system web interface
- [ ] Confirm database health monitoring works
- [ ] Validate all administrative functions

---

## 🔥 **Critical Issues Summary**

### **1. Database Monitor Page - COMPLETELY BROKEN**
**Issue**: Frontend calling wrong API endpoints  
**Error**: 500 HTML response instead of JSON data  
**Fix Applied**: Changed `/auth/database-health/` to `/utils/database-health/` in frontend  
**Status**: ✅ Code fixed, needs deployment  

### **2. Backup System Web Interface - INACCESSIBLE**
**Issue**: Same API endpoint mismatch as database monitor  
**Impact**: Cannot manage backups through web interface  
**Fix**: Will be resolved with database monitor fix  
**Status**: ⏳ Pending deployment  

### **3. Database Migration - PENDING**
**Issue**: Category field length migration not applied to production  
**Risk**: Potential 500 errors on health information creation  
**Fix Required**: `heroku run python backend/manage.py migrate`  
**Status**: ⏳ Ready to apply  

### **4. Cloudinary Storage - UNKNOWN STATUS**
**Issue**: Major overhaul completed but not tested  
**Risk**: Image uploads may not function properly  
**Fix Required**: Comprehensive testing of upload functionality  
**Status**: ⏳ Needs verification  

---

## 🛠️ **Detailed Repair Instructions**

### **Repair 1: Database Monitor API Endpoints**

**Problem**: Frontend calling `/auth/database-health/` instead of `/utils/database-health/`

**Solution Applied**:
```javascript
// Fixed in /frontend/src/services/api.js
getDatabaseHealth: async () => {
    const response = await api.get('/utils/database-health/', {  // Fixed endpoint
        headers: { 'Authorization': `Token ${token}` }
    });
}
```

**Deployment Commands**:
```bash
git add frontend/frontend/src/services/api.js
git commit -m "Emergency Fix: Correct database monitor API endpoints"
git push heroku main
```

**Verification**:
1. Login as admin user
2. Navigate to `/database-monitor`
3. Verify all tabs load without 500 errors:
   - Database Health
   - Backup Management
   - Backup History

### **Repair 2: Database Migration**

**Problem**: Migration 0008 created but not applied on Heroku

**Commands**:
```bash
# Apply pending migration
heroku run python backend/manage.py migrate

# Verify migration applied
heroku run python backend/manage.py showmigrations health_info

# Check field constraints
heroku run python backend/manage.py shell -c "
from health_info.models import HealthInformation
field = HealthInformation._meta.get_field('category')
print(f'Category max_length: {field.max_length}')
"
```

**Success Criteria**:
- Migration 0008 shows as applied
- Category field max_length = 200
- No errors when creating health information

### **Repair 3: Cloudinary Storage Testing**

**Problem**: Major storage system overhaul completed but functionality unknown

**Testing Steps**:
1. Login as admin/staff user
2. Navigate to `/health-info`
3. Create new health information with image
4. Verify:
   - Image uploads successfully
   - Image URL starts with `https://res.cloudinary.com/dgczr6ueb/`
   - Image displays properly in frontend
   - Image persists after upload

**Success Criteria**:
- Images upload to Cloudinary (not local filesystem)
- URLs include version timestamp
- Images accessible via generated URLs
- No 404 errors on image requests

### **Repair 4: System Verification**

**Post-Repair Validation**:
1. **Database Monitor**: All tabs functional
2. **Backup System**: Web interface accessible
3. **Health Information**: Creation works without errors
4. **Image Uploads**: Cloudinary storage functional
5. **User Authentication**: Still working properly
6. **Core Patient Records**: Basic functionality intact

---

## 📊 **System Impact Assessment**

### **Before Repairs**
- ❌ Database monitoring: Completely inaccessible
- ❌ Backup management: Web interface broken
- ❌ System health oversight: Impossible
- ⚠️ Health information: Potentially unstable
- ❓ Image uploads: Status unknown
- ✅ User authentication: Working
- ✅ Basic patient records: Functional

### **After Successful Repairs**
- ✅ Database monitoring: Fully functional
- ✅ Backup management: Web interface restored
- ✅ System health oversight: Complete visibility
- ✅ Health information: Stable with expanded capacity
- ✅ Image uploads: Cloudinary integration working
- ✅ User authentication: Still working
- ✅ Basic patient records: Fully operational

---

## ⚠️ **Known Limitations Post-Repair**

Even after successful emergency repairs, these critical gaps remain:

1. **❌ Appointment/Scheduling System**: Still completely missing
2. **❌ Inventory Management**: No medical supplies tracking
3. **❌ Comprehensive Billing**: Limited to basic cost fields
4. **⚠️ Testing Coverage**: Minimal test coverage increases risk

**Next Development Priority**: Appointment/scheduling system implementation

---

## 🔒 **Rollback Procedures**

If repairs cause additional issues:

### **Database Monitor Rollback**:
```bash
# Revert frontend API endpoint change
git revert [commit-hash]
git push heroku main
```

### **Migration Rollback**:
```bash
# Rollback migration if issues occur
heroku run python backend/manage.py migrate health_info 0007
```

### **Emergency Fallback**:
- Command-line backup tools remain functional
- Core patient record system continues working
- User authentication unaffected

---

## 📞 **Emergency Escalation**

If repairs fail or cause additional system failures:

1. **Immediate**: Use command-line tools for critical operations
2. **Communication**: Notify USC clinic staff of administrative limitations
3. **Priority**: Focus on maintaining core patient record functionality
4. **Recovery**: Consider system rollback to last stable state

---

## ✅ **Success Confirmation**

Mark as complete when:
- [ ] Database monitor page loads without errors
- [ ] Backup system web interface is accessible
- [ ] Database migration applied successfully
- [ ] Cloudinary image uploads working properly
- [ ] All administrative functions restored

**Target Completion Time**: 1-2 hours  
**Critical Path**: API fix → Migration → Testing → Verification

---

**Last Updated**: August 17, 2025  
**Status**: **EMERGENCY REPAIRS REQUIRED**  
**Next Review**: After successful completion of all repairs