# Campaign Creation Troubleshooting Guide

## Current Issue Status
**Problem**: Campaign creation consistently fails with "Campaign creation failed: Empty file" error despite backend API testing showing successful responses.

**Status**: UNRESOLVED - Frontend shows 500 server error, but direct API testing works correctly.

## Error Details
- **Frontend Error**: "Campaign creation failed: Empty file"
- **HTTP Status**: 500 Internal Server Error
- **Occurrence**: When clicking "Create Campaign" button in frontend interface
- **Backend Testing**: Direct API calls succeed, suggesting frontend-specific issue

## Debugging Steps

### 1. Browser Network Tab Analysis
When the error occurs, check browser Developer Tools:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "Create Campaign" button
4. Find the failed POST request to `/api/health-info/campaigns/`
5. Click on the failed request
6. Check **Request** tab for:
   - Request method (should be POST)
   - Content-Type header
   - Form data being sent
   - File data (if any)
7. Check **Response** tab for:
   - Exact error message
   - Server response body
   - Response headers

### 2. Server Log Analysis
Check Django server logs for detailed error information:

```bash
# In backend directory
python manage.py runserver
# Look for log entries when campaign creation is attempted
```

Look for log entries containing:
- "Campaign creation request from user"
- "Request data keys"
- "File details"
- "Campaign creation error"
- Python stack traces

### 3. Direct API Testing
Test the API directly to isolate frontend vs backend issues:

#### Using curl (Command Line)
```bash
# Test with minimal data (no files)
curl -X POST "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Campaign",
    "description": "Test description",
    "campaign_type": "GENERAL",
    "start_date": "2024-12-01T08:00:00Z",
    "end_date": "2024-12-31T17:00:00Z",
    "content": "Test content"
  }'
```

#### Using Python requests
```python
import requests

# Get auth token first
login_response = requests.post('http://localhost:8000/api/auth/login/', {
    'email': 'your_email@usc.edu.ph',
    'password': 'your_password'
})
token = login_response.json()['key']

# Test campaign creation
headers = {
    'Authorization': f'Token {token}',
    'Content-Type': 'application/json'
}

data = {
    'title': 'Test Campaign Direct',
    'description': 'Test description via API',
    'campaign_type': 'GENERAL',
    'start_date': '2024-12-01T08:00:00Z',
    'end_date': '2024-12-31T17:00:00Z',
    'content': 'Test content'
}

response = requests.post('http://localhost:8000/api/health-info/campaigns/', 
                        json=data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

### 4. Frontend Form Data Analysis
Check what data the frontend is actually sending:

1. In the campaign creation component, add console logging:
```javascript
// In the form submission handler
console.log('Form data being sent:', formData);
console.log('Files being sent:', files);

// Log the actual FormData contents
for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}
```

### 5. Common Issues and Solutions

#### Issue: Empty File Fields
**Symptoms**: "Empty file" error even when no files are uploaded
**Cause**: Frontend sending empty file fields in FormData
**Solution**: 
```javascript
// Only add file fields if files are actually selected
if (bannerImage && bannerImage.length > 0) {
    formData.append('banner_image', bannerImage[0]);
}
```

#### Issue: Content-Type Header Problems
**Symptoms**: 400/500 errors with file uploads
**Cause**: Incorrect Content-Type header set manually
**Solution**: Let browser set Content-Type automatically for multipart/form-data

#### Issue: Authentication Problems
**Symptoms**: 401/403 errors
**Cause**: Missing or invalid authentication token
**Solution**: Verify token is included in Authorization header

#### Issue: Date Format Problems
**Symptoms**: Validation errors for date fields
**Cause**: Incorrect date format sent to backend
**Solution**: Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

## Current Implementation Analysis

### Backend Configuration ✅
- ✅ Parser classes configured: MultiPartParser, FormParser, JSONParser
- ✅ File validation with size checking
- ✅ Empty file detection and removal
- ✅ Comprehensive error logging
- ✅ Required field validation
- ✅ Permission classes configured correctly

### Frontend Investigation Needed ❓
- ❓ FormData construction in campaign creation form
- ❓ File input handling and validation
- ❓ Request headers and content type
- ❓ Error handling and display

## Immediate Action Items

### 1. Enable Debug Mode Temporarily
In `backend/settings.py`:
```python
DEBUG = True  # Temporarily for detailed error pages
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'health_info': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### 2. Add Frontend Debug Logging
In the campaign creation component, add comprehensive logging:

```javascript
const handleSubmit = async (formData) => {
    console.group('Campaign Creation Debug');
    console.log('1. Form data received:', formData);
    console.log('2. Files received:', files);
    
    const submitData = new FormData();
    
    // Log each field as it's added
    Object.keys(formData).forEach(key => {
        console.log(`Adding field: ${key} =`, formData[key]);
        submitData.append(key, formData[key]);
    });
    
    // Log file additions
    if (files.banner_image) {
        console.log('Adding banner_image:', files.banner_image);
        submitData.append('banner_image', files.banner_image);
    }
    
    // Log final FormData contents
    console.log('3. Final FormData entries:');
    for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
    }
    
    console.groupEnd();
    
    // Make the API call with enhanced error handling
    try {
        const response = await api.post('/health-info/campaigns/', submitData);
        console.log('Success response:', response.data);
    } catch (error) {
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
        throw error;
    }
};
```

### 3. Check Model Field Requirements
Verify all required model fields have appropriate defaults or are properly handled:

```python
# In health_info/models.py, check these fields:
title = models.CharField(max_length=200)  # Required
description = models.TextField()  # Required  
campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPES)  # Required
start_date = models.DateTimeField()  # Required
end_date = models.DateTimeField()  # Required
```

## Testing Procedures

### Manual Testing Checklist
- [ ] Test campaign creation with minimal required fields only
- [ ] Test with one image file attached
- [ ] Test with multiple image files
- [ ] Test with no files attached
- [ ] Test with empty file inputs
- [ ] Test with invalid file types
- [ ] Test with very large files
- [ ] Test with special characters in campaign title/description

### Automated Testing
Create a test script to validate the API:

```python
# test_campaign_creation.py
import requests
import json

def test_campaign_api():
    base_url = 'http://localhost:8000'
    
    # Test data sets
    test_cases = [
        {
            'name': 'Minimal Required Fields',
            'data': {
                'title': 'Test Campaign',
                'description': 'Test description',
                'campaign_type': 'GENERAL',
                'start_date': '2024-12-01T08:00:00Z',
                'end_date': '2024-12-31T17:00:00Z',
                'content': 'Test content'
            }
        },
        # Add more test cases
    ]
    
    for test_case in test_cases:
        print(f"Testing: {test_case['name']}")
        response = requests.post(
            f"{base_url}/api/health-info/campaigns/",
            json=test_case['data'],
            headers={'Authorization': 'Token YOUR_TOKEN'}
        )
        print(f"Status: {response.status_code}")
        if response.status_code != 201:
            print(f"Error: {response.text}")
        print("-" * 50)

if __name__ == '__main__':
    test_campaign_api()
```

## Resolution Strategy

### Phase 1: Data Collection
1. Gather exact error details from browser Network tab
2. Collect server logs during failed attempt
3. Compare working direct API call with failing frontend call

### Phase 2: Root Cause Identification
1. Identify differences between working and failing requests
2. Determine if issue is in request formation or server processing
3. Isolate specific field or file causing the problem

### Phase 3: Fix Implementation
1. Address identified root cause
2. Test fix with multiple scenarios
3. Add preventive measures to avoid regression

### Phase 4: Validation
1. Comprehensive testing of campaign creation functionality
2. Verify all file upload scenarios work correctly
3. Confirm error handling provides clear user feedback

## Next Steps

1. **IMMEDIATE**: Run the debugging procedures above to collect detailed error information
2. **URGENT**: Compare the exact request payload between working direct API calls and failing frontend calls
3. **HIGH**: Identify the specific field or file input causing the "Empty file" error
4. **MEDIUM**: Implement targeted fix based on root cause analysis
5. **LOW**: Add comprehensive testing suite to prevent similar issues

## Contact Information

For technical support or if additional debugging is needed:
- Check server logs in Django console
- Review browser Developer Tools Network tab
- Compare with working direct API tests
- Document exact error messages and request/response details

---

**Last Updated**: August 18, 2025
**Status**: TROUBLESHOOTING IN PROGRESS - Awaiting detailed error analysis