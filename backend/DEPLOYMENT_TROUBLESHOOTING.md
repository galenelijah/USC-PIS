# USC-PIS Deployment Troubleshooting Guide

## Common Build Issues

### 1. Build Failed - Module Not Found

**Error Message:**
```
ModuleNotFoundError: No module named 'cloudinary_storage'
ModuleNotFoundError: No module named 'cloudinary'
```

**Cause**: Cloudinary packages are commented in requirements.txt but Django tries to import them.

**Solution**:
1. If NOT using Cloudinary: Current deployment should work (packages are commented by design)
2. If activating Cloudinary: Uncomment packages in requirements.txt:
   ```
   # Change from:
   # cloudinary==1.36.0
   # django-cloudinary-storage==0.3.0
   
   # To:
   cloudinary==1.36.0
   django-cloudinary-storage==0.3.0
   ```

### 2. Django Settings Import Error

**Error Message:**
```
ImportError: No module named 'cloudinary'
django.core.exceptions.ImproperlyConfigured
```

**Cause**: Django settings.py tries to import cloudinary modules when `USE_CLOUDINARY=True` but packages aren't installed.

**Solution**:
1. Verify `USE_CLOUDINARY` environment variable:
   ```bash
   heroku config:get USE_CLOUDINARY
   ```
2. If set to True, ensure cloudinary packages are uncommented in requirements.txt
3. If not planning to use Cloudinary, unset the variable:
   ```bash
   heroku config:unset USE_CLOUDINARY
   ```

### 3. Build Succeeds but App Won't Start

**Error in logs:**
```
Application error
An error occurred in the application and your page could not be served
```

**Debugging Steps**:
1. Check detailed logs:
   ```bash
   heroku logs --tail
   ```
2. Look for Django startup errors
3. Common causes:
   - Missing environment variables
   - Database connection issues
   - Static file collection problems

## Profile Setup Issues

### 1. Users Redirected to Profile Setup After Completion

**Symptoms**: Users complete profile setup successfully but get redirected back to `/profile-setup`

**Cause**: Redux state not properly synchronized with API response

**Debug Steps**:
1. Check browser console for debug messages:
   - `RequireProfileSetup: Starting profile check`
   - `RequireProfileSetup: User completeSetup: true/false`
2. Check API response: `/api/auth/me` should return `completeSetup: true`

**Solution**: The fix is already implemented in the current codebase with improved state synchronization.

### 2. Nurse Profile Setup "Nothing Happens"

**Symptoms**: Clicking "Complete Setup" button does nothing

**Cause**: Form validation errors or API endpoint issues

**Debug Steps**:
1. Open browser console
2. Look for debug messages:
   - `Complete Setup button clicked`
   - `Form validation result: true/false`
   - `Form errors: {}`
3. Check network tab for API calls

**Solution**: The fix is implemented with improved validation and error handling.

## Image Display Issues

### 1. Images Not Displaying in Production

**Symptoms**: Campaign images show broken image icons or placeholders

**Root Cause**: Heroku's ephemeral filesystem deletes uploaded files

**Immediate Fix**:
```bash
heroku run python manage.py restore_campaign_images
```
This removes broken references from database.

**Permanent Solution**: Activate Cloudinary following CLOUDINARY_SETUP.md

### 2. Images Work Locally But Not in Production

**Explanation**: This is expected behavior:
- **Local development**: Uses filesystem storage (works)
- **Production (Heroku)**: Ephemeral filesystem (files disappear)

**Solution**: Implement persistent storage (Cloudinary) for production

## Environment Variable Issues

### 1. Database Connection Problems

**Error**: `django.db.utils.OperationalError`

**Check**:
```bash
heroku config:get DATABASE_URL
```

**Solution**: Ensure DATABASE_URL is set correctly

### 2. Static Files Not Loading

**Error**: CSS/JS files return 404

**Check**:
```bash
heroku config:get DISABLE_COLLECTSTATIC
```

**Solution**: Ensure DISABLE_COLLECTSTATIC is NOT set (or set to 0)

## Memory and Performance Issues

### 1. R14 Memory Quota Exceeded

**Error**: `Process running mem=512M(100.0%)`

**Solutions**:
1. Check for memory leaks in code
2. Optimize database queries
3. Consider upgrading Heroku dyno type

### 2. H12 Request Timeout

**Error**: `Request timeout`

**Solutions**:
1. Optimize slow database queries
2. Implement caching
3. Check for infinite loops in code

## Database Issues

### 1. Migration Failures

**Error**: `django.db.migrations.exceptions.MigrationSchemaMissing`

**Solution**:
```bash
heroku run python manage.py migrate --fake-initial
```

### 2. Database Connection Pool Exhausted

**Error**: `django.db.utils.OperationalError: FATAL: sorry, too many clients already`

**Solution**: Implemented connection pooling in current settings.py

## Verification Commands

### Check System Status
```bash
# Check app status
heroku ps

# Check recent logs
heroku logs --tail

# Check config vars
heroku config

# Check database status
heroku pg:info

# Run Django checks
heroku run python manage.py check --deploy
```

### Test Specific Components
```bash
# Test database connection
heroku run python manage.py dbshell

# Check migrations
heroku run python manage.py showmigrations

# Test media storage
heroku run python manage.py shell -c "
from django.core.files.storage import default_storage
print('Storage backend:', default_storage.__class__.__name__)
"
```

## Contact Information

If issues persist:
1. Check the main CLAUDE.md documentation
2. Review CLOUDINARY_SETUP.md for media storage issues
3. Run `python verify_cloudinary_setup.py` to check Cloudinary readiness
4. Check Heroku status: https://status.heroku.com/

## Quick Fix Checklist

- [ ] Check Heroku logs: `heroku logs --tail`
- [ ] Verify config vars: `heroku config`
- [ ] Check app status: `heroku ps`
- [ ] Test locally first: `python manage.py runserver`
- [ ] Run verification: `python verify_cloudinary_setup.py`
- [ ] Check database: `heroku run python manage.py dbshell`
- [ ] Clear broken images: `heroku run python manage.py restore_campaign_images`

---

**Last Updated**: July 29, 2025  
**Status**: Covers all known deployment issues  
**Compatibility**: USC-PIS production deployment on Heroku