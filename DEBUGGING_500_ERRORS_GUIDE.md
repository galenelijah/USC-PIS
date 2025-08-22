# Django 500 Error Debugging Guide

## Overview
This guide provides systematic procedures for debugging 500 Internal Server Errors in the USC-PIS Django application, with specific focus on API endpoints and file upload issues.

## Quick Reference
- **500 Error**: Internal server error - problem on server side
- **Most Common Causes**: Unhandled exceptions, missing imports, model validation failures, file handling errors
- **Key Tools**: Django logs, browser DevTools, direct API testing

## Step-by-Step Debugging Process

### 1. Enable Debug Mode (Development Only)

**IMPORTANT**: Only enable debug mode in development environment.

```python
# In backend/settings.py
DEBUG = True

# Add detailed logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'health_info': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### 2. Capture Server Logs

#### Method 1: Django Development Server
```bash
cd USC-PIS/backend
python manage.py runserver

# Watch for output when error occurs
# Look for stack traces and error messages
```

#### Method 2: Production Logging
```bash
# Check Heroku logs (if deployed)
heroku logs --tail -a your-app-name

# Check local log files
tail -f /path/to/logfile.log
```

### 3. Browser DevTools Analysis

#### Network Tab Investigation
1. Open DevTools (F12)
2. Go to Network tab
3. Clear existing entries
4. Reproduce the error
5. Find the failed request (red status)
6. Click on the failed request
7. Examine:
   - **Headers** tab: Request/response headers
   - **Request** tab: Payload data sent
   - **Response** tab: Server response (may show HTML error page)
   - **Timing** tab: Request timing information

#### Console Tab Monitoring
1. Check Console tab for JavaScript errors
2. Look for CORS issues
3. Monitor XHR/Fetch request failures

### 4. Direct API Testing

#### Using curl
```bash
# Replace with actual endpoint and data
curl -X POST "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token your_auth_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Campaign",
    "description": "Test description",
    "campaign_type": "GENERAL", 
    "start_date": "2024-12-01T08:00:00Z",
    "end_date": "2024-12-31T17:00:00Z",
    "content": "Test content"
  }' \
  -v
```

#### Using Python requests
```python
import requests

# Test script for API debugging
def test_api_endpoint():
    url = 'http://localhost:8000/api/health-info/campaigns/'
    headers = {
        'Authorization': 'Token your_token_here',
        'Content-Type': 'application/json'
    }
    
    data = {
        'title': 'Debug Test Campaign',
        'description': 'Testing API directly',
        'campaign_type': 'GENERAL',
        'start_date': '2024-12-01T08:00:00Z',
        'end_date': '2024-12-31T17:00:00Z', 
        'content': 'Test content for debugging'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 500:
            print("500 Error detected - check server logs")
        elif response.status_code == 201:
            print("Success! Issue is frontend-specific")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == '__main__':
    test_api_endpoint()
```

### 5. Common 500 Error Patterns

#### File Upload Issues
**Symptoms**: "Empty file" errors, file validation failures
**Debug Steps**:
```python
# Add to views.py
import logging
logger = logging.getLogger(__name__)

def create(self, request, *args, **kwargs):
    # Log file details
    for key, file in request.FILES.items():
        logger.info(f"File {key}: name={file.name}, size={file.size}")
        if hasattr(file, 'content_type'):
            logger.info(f"Content type: {file.content_type}")
```

#### Model Validation Errors
**Symptoms**: IntegrityError, ValidationError
**Debug Steps**:
```python
# Add to serializer validate method
def validate(self, data):
    logger.info(f"Validating data: {data}")
    try:
        # Your validation logic
        return data
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise
```

#### Missing Foreign Key Relations
**Symptoms**: DoesNotExist errors, RelatedObjectDoesNotExist
**Debug Steps**:
```python
# Check for null/missing relations
def perform_create(self, serializer):
    logger.info(f"User: {self.request.user}")
    logger.info(f"User authenticated: {self.request.user.is_authenticated}")
    
    if not self.request.user.is_authenticated:
        raise ValidationError("User must be authenticated")
```

#### Import/Module Errors
**Symptoms**: ImportError, ModuleNotFoundError, AttributeError
**Debug Steps**:
```python
# Add at top of problematic file
import logging
logger = logging.getLogger(__name__)

try:
    from .models import YourModel
    logger.info("Model import successful")
except ImportError as e:
    logger.error(f"Model import failed: {e}")
    raise
```

### 6. Specific Debugging for Campaign Creation

#### Add Debug Logging to Views
```python
# In health_info/views.py
def create(self, request, *args, **kwargs):
    logger = logging.getLogger(__name__)
    logger.info("=== Campaign Creation Debug Start ===")
    logger.info(f"User: {request.user} (ID: {getattr(request.user, 'id', 'None')})")
    logger.info(f"Method: {request.method}")
    logger.info(f"Content-Type: {request.META.get('CONTENT_TYPE')}")
    logger.info(f"Data keys: {list(request.data.keys())}")
    logger.info(f"Files keys: {list(request.FILES.keys())}")
    
    # Log each data field
    for key, value in request.data.items():
        logger.info(f"Data[{key}]: {value} (type: {type(value).__name__})")
    
    # Log each file
    for key, file in request.FILES.items():
        logger.info(f"File[{key}]: name={file.name}, size={file.size}")
    
    try:
        result = super().create(request, *args, **kwargs)
        logger.info("=== Campaign Creation Success ===")
        return result
    except Exception as e:
        logger.error(f"=== Campaign Creation Failed: {str(e)} ===")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
```

#### Add Debug Logging to Serializer
```python
# In health_info/serializers.py
class HealthCampaignCreateUpdateSerializer(serializers.ModelSerializer):
    def validate(self, data):
        logger = logging.getLogger(__name__)
        logger.info("=== Serializer Validation Start ===")
        logger.info(f"Input data keys: {list(data.keys())}")
        
        for key, value in data.items():
            logger.info(f"Field[{key}]: {value} (type: {type(value).__name__})")
        
        try:
            result = super().validate(data)
            logger.info("=== Serializer Validation Success ===") 
            return result
        except Exception as e:
            logger.error(f"=== Serializer Validation Failed: {str(e)} ===")
            raise
    
    def create(self, validated_data):
        logger = logging.getLogger(__name__)
        logger.info("=== Serializer Create Start ===")
        logger.info(f"Validated data: {validated_data}")
        
        try:
            instance = super().create(validated_data)
            logger.info(f"=== Serializer Create Success: {instance.id} ===")
            return instance
        except Exception as e:
            logger.error(f"=== Serializer Create Failed: {str(e)} ===")
            raise
```

### 7. Database-Related 500 Errors

#### Check Model Constraints
```bash
# Check for database integrity issues
python manage.py dbshell
# Then run SQL queries to check constraints
```

#### Migration Issues
```bash
# Check migration status
python manage.py showmigrations

# Apply missing migrations
python manage.py migrate

# Create new migration if model changes
python manage.py makemigrations
```

### 8. Environment and Dependency Issues

#### Check Installed Packages
```bash
pip list | grep django
pip list | grep rest
pip list | grep cloudinary
```

#### Verify Environment Variables
```python
# Add to views.py temporarily
import os
logger.info(f"DEBUG setting: {settings.DEBUG}")
logger.info(f"Database engine: {settings.DATABASES['default']['ENGINE']}")
logger.info(f"Cloudinary configured: {'CLOUDINARY_STORAGE' in settings.INSTALLED_APPS}")
```

### 9. Frontend Request Analysis

#### Add Request Interception
```javascript
// In API service file
api.interceptors.request.use(request => {
    console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    });
    return request;
});

api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.error('Response Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data
            }
        });
        return Promise.reject(error);
    }
);
```

### 10. Production Debugging (Limited)

For production environments where DEBUG=False:

#### Custom Error Handler
```python
# In views.py
from django.http import JsonResponse
import logging
import traceback

def handle_500_error(request, exception):
    logger = logging.getLogger(__name__)
    logger.error(f"500 Error: {str(exception)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    if request.path.startswith('/api/'):
        return JsonResponse({
            'error': 'Internal server error',
            'detail': 'Please contact administrator'
        }, status=500)
```

#### Log Analysis
```bash
# Search for specific errors
grep -n "ERROR" logfile.log
grep -n "500" logfile.log
grep -n "Exception" logfile.log
```

## Troubleshooting Checklist

### Pre-Debugging
- [ ] Can reproduce error consistently
- [ ] Have access to server logs
- [ ] Debug mode enabled (development only)
- [ ] Clear browser cache and try again

### Data Collection
- [ ] Captured exact error message
- [ ] Recorded browser network request details
- [ ] Collected server log output
- [ ] Noted timestamp of error occurrence

### Investigation
- [ ] Tested direct API call (bypass frontend)
- [ ] Compared working vs failing requests
- [ ] Checked database integrity
- [ ] Verified environment configuration

### Resolution
- [ ] Identified root cause
- [ ] Implemented targeted fix
- [ ] Tested fix in multiple scenarios
- [ ] Added preventive measures

## Common Solutions

### File Upload Issues
```python
# Ensure proper parser classes
parser_classes = [MultiPartParser, FormParser, JSONParser]

# Handle empty files
if file.size == 0:
    continue  # Skip empty files
```

### Authentication Issues
```python
# Verify user authentication
if not request.user.is_authenticated:
    return Response({'error': 'Authentication required'}, 
                   status=status.HTTP_401_UNAUTHORIZED)
```

### Validation Issues
```python
# Add comprehensive validation
def validate(self, data):
    errors = {}
    
    if not data.get('title'):
        errors['title'] = 'Title is required'
    
    if errors:
        raise serializers.ValidationError(errors)
    
    return data
```

## Recovery Procedures

### Database Recovery
```bash
# Reset migrations (development only)
python manage.py migrate health_info zero
python manage.py migrate health_info

# Restore from backup
python manage.py loaddata backup.json
```

### Code Recovery
```bash
# Revert to last working commit
git log --oneline
git reset --hard COMMIT_HASH

# Create hotfix branch
git checkout -b hotfix/campaign-creation
```

---

**Last Updated**: August 18, 2025  
**Priority**: HIGH - Campaign creation is critical functionality  
**Status**: DEBUGGING PROCEDURES DOCUMENTED - Apply systematically to identify root cause