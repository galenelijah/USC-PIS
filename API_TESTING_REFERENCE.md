# USC-PIS API Testing Reference Guide

## Overview
Comprehensive guide for testing USC-PIS API endpoints, with focus on campaign creation and file upload functionality.

## Authentication Setup

### Getting Authentication Token
```bash
# Method 1: Using curl
curl -X POST "http://localhost:8000/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@usc.edu.ph",
    "password": "your_password"
  }'

# Response will contain:
# {
#   "key": "your_auth_token_here",
#   "user": {...}
# }
```

```python
# Method 2: Using Python
import requests

def get_auth_token(email, password):
    response = requests.post('http://localhost:8000/api/auth/login/', {
        'email': email,
        'password': password
    })
    if response.status_code == 200:
        return response.json()['key']
    else:
        print(f"Login failed: {response.text}")
        return None

token = get_auth_token('your_email@usc.edu.ph', 'your_password')
```

### Test Authentication
```bash
curl -X GET "http://localhost:8000/api/auth/user/" \
  -H "Authorization: Token your_auth_token"
```

## Campaign API Testing

### 1. List Campaigns (GET)
```bash
curl -X GET "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token your_auth_token"
```

```python
import requests

headers = {'Authorization': 'Token your_auth_token'}
response = requests.get('http://localhost:8000/api/health-info/campaigns/', 
                       headers=headers)
print(f"Status: {response.status_code}")
print(f"Campaigns: {len(response.json().get('results', []))}")
```

### 2. Create Campaign - Minimal Required Fields
```bash
curl -X POST "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token your_auth_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Campaign",
    "description": "Testing campaign creation via API",
    "campaign_type": "GENERAL",
    "start_date": "2024-12-01T08:00:00Z",
    "end_date": "2024-12-31T17:00:00Z",
    "content": "This is test content for the campaign"
  }'
```

```python
import requests
from datetime import datetime, timedelta

def create_test_campaign(token):
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    # Generate future dates
    start_date = datetime.now().replace(microsecond=0)
    end_date = start_date + timedelta(days=30)
    
    data = {
        'title': 'Python API Test Campaign',
        'description': 'Testing campaign creation via Python API',
        'campaign_type': 'GENERAL',
        'start_date': start_date.isoformat() + 'Z',
        'end_date': end_date.isoformat() + 'Z',
        'content': 'This is test content created via Python API',
        'status': 'DRAFT'
    }
    
    response = requests.post(
        'http://localhost:8000/api/health-info/campaigns/',
        json=data,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Campaign created successfully!")
        print(f"Campaign ID: {response.json()['id']}")
    else:
        print(f"Error: {response.text}")
    
    return response

# Usage
token = "your_auth_token_here"
response = create_test_campaign(token)
```

### 3. Create Campaign with All Fields
```python
def create_comprehensive_campaign(token):
    headers = {'Authorization': f'Token {token}'}
    
    # Use multipart form data for comprehensive campaign
    data = {
        'title': 'Comprehensive Test Campaign',
        'description': 'Full featured campaign with all fields',
        'campaign_type': 'MENTAL_HEALTH',
        'status': 'DRAFT',
        'priority': 'HIGH',
        'content': 'Detailed content about mental health awareness',
        'summary': 'Brief summary of the mental health campaign',
        'target_audience': 'University students and faculty',
        'objectives': 'Raise awareness about mental health resources',
        'call_to_action': 'Contact the counseling center for support',
        'start_date': '2024-12-01T08:00:00Z',
        'end_date': '2024-12-31T17:00:00Z',
        'featured_until': '2024-12-15T23:59:59Z',
        'tags': 'mental health, awareness, students, counseling',
        'external_link': 'https://usc.edu.ph/counseling',
        'contact_info': 'counseling@usc.edu.ph'
    }
    
    response = requests.post(
        'http://localhost:8000/api/health-info/campaigns/',
        data=data,  # Use data instead of json for multipart
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    return response
```

### 4. Create Campaign with File Upload
```python
def create_campaign_with_images(token):
    headers = {'Authorization': f'Token {token}'}
    
    data = {
        'title': 'Campaign with Images',
        'description': 'Testing file upload functionality',
        'campaign_type': 'GENERAL',
        'start_date': '2024-12-01T08:00:00Z',
        'end_date': '2024-12-31T17:00:00Z',
        'content': 'Campaign content with image uploads'
    }
    
    files = {}
    
    # Add banner image if file exists
    try:
        with open('test_banner.jpg', 'rb') as f:
            files['banner_image'] = ('banner.jpg', f, 'image/jpeg')
    except FileNotFoundError:
        print("Warning: test_banner.jpg not found, skipping banner upload")
    
    # Add thumbnail image if file exists
    try:
        with open('test_thumbnail.jpg', 'rb') as f:
            files['thumbnail_image'] = ('thumbnail.jpg', f, 'image/jpeg')
    except FileNotFoundError:
        print("Warning: test_thumbnail.jpg not found, skipping thumbnail upload")
    
    response = requests.post(
        'http://localhost:8000/api/health-info/campaigns/',
        data=data,
        files=files if files else None,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    return response
```

### 5. Test File Upload Edge Cases
```python
def test_file_upload_edge_cases(token):
    headers = {'Authorization': f'Token {token}'}
    
    test_cases = [
        {
            'name': 'Empty File Test',
            'description': 'Test handling of empty files',
            'create_empty_file': True
        },
        {
            'name': 'Large File Test', 
            'description': 'Test handling of large files',
            'file_size': 10 * 1024 * 1024  # 10MB
        },
        {
            'name': 'Invalid File Type Test',
            'description': 'Test handling of invalid file types',
            'file_extension': '.txt'
        }
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"Running test case: {test_case['name']}")
        
        data = {
            'title': f'Test Case {i+1}: {test_case["name"]}',
            'description': test_case['description'],
            'campaign_type': 'GENERAL',
            'start_date': '2024-12-01T08:00:00Z',
            'end_date': '2024-12-31T17:00:00Z',
            'content': f'Testing: {test_case["description"]}'
        }
        
        files = {}
        
        if test_case.get('create_empty_file'):
            # Create an empty file
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                files['banner_image'] = ('empty.jpg', tmp, 'image/jpeg')
        
        elif test_case.get('file_size'):
            # Create a large dummy file
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(b'0' * test_case['file_size'])
                tmp.seek(0)
                files['banner_image'] = ('large.jpg', tmp, 'image/jpeg')
        
        elif test_case.get('file_extension'):
            # Create file with invalid extension
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=test_case['file_extension']) as tmp:
                tmp.write(b'test content')
                tmp.seek(0)
                files['banner_image'] = ('invalid' + test_case['file_extension'], tmp, 'text/plain')
        
        response = requests.post(
            'http://localhost:8000/api/health-info/campaigns/',
            data=data,
            files=files if files else None,
            headers=headers
        )
        
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
        print("-" * 50)
```

## Complete Test Suite

### Automated Test Runner
```python
#!/usr/bin/env python3
"""
USC-PIS Campaign API Test Suite
Run this script to test all campaign creation scenarios
"""

import requests
import json
from datetime import datetime, timedelta
import tempfile
import os

class CampaignAPITester:
    def __init__(self, base_url="http://localhost:8000", email=None, password=None):
        self.base_url = base_url
        self.token = None
        self.test_results = []
        
        if email and password:
            self.authenticate(email, password)
    
    def authenticate(self, email, password):
        """Get authentication token"""
        response = requests.post(f"{self.base_url}/api/auth/login/", {
            'email': email,
            'password': password
        })
        
        if response.status_code == 200:
            self.token = response.json()['key']
            print(f"✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.text}")
            return False
    
    def get_headers(self):
        """Get request headers with authentication"""
        return {'Authorization': f'Token {self.token}'} if self.token else {}
    
    def run_test(self, test_name, test_func):
        """Run a test and record results"""
        print(f"\n🧪 Running test: {test_name}")
        try:
            result = test_func()
            success = result.get('success', False)
            status = '✅ PASS' if success else '❌ FAIL'
            print(f"{status} - {result.get('message', 'No message')}")
            
            self.test_results.append({
                'test': test_name,
                'success': success,
                'message': result.get('message'),
                'response_code': result.get('response_code'),
                'details': result.get('details')
            })
            
        except Exception as e:
            print(f"❌ FAIL - Exception: {str(e)}")
            self.test_results.append({
                'test': test_name,
                'success': False,
                'message': f"Exception: {str(e)}"
            })
    
    def test_minimal_campaign_creation(self):
        """Test campaign creation with minimal required fields"""
        start_date = datetime.now().replace(microsecond=0)
        end_date = start_date + timedelta(days=30)
        
        data = {
            'title': 'Minimal Test Campaign',
            'description': 'Testing minimal campaign creation',
            'campaign_type': 'GENERAL',
            'start_date': start_date.isoformat() + 'Z',
            'end_date': end_date.isoformat() + 'Z',
            'content': 'Minimal test content'
        }
        
        response = requests.post(
            f"{self.base_url}/api/health-info/campaigns/",
            json=data,
            headers=self.get_headers()
        )
        
        return {
            'success': response.status_code == 201,
            'message': f"Campaign creation returned {response.status_code}",
            'response_code': response.status_code,
            'details': response.text if response.status_code != 201 else 'Created successfully'
        }
    
    def test_comprehensive_campaign_creation(self):
        """Test campaign creation with all optional fields"""
        start_date = datetime.now().replace(microsecond=0)
        end_date = start_date + timedelta(days=30)
        featured_until = start_date + timedelta(days=15)
        
        data = {
            'title': 'Comprehensive Test Campaign',
            'description': 'Testing comprehensive campaign creation',
            'campaign_type': 'MENTAL_HEALTH',
            'status': 'DRAFT',
            'priority': 'HIGH',
            'content': 'Comprehensive test content with all fields',
            'summary': 'Test summary',
            'target_audience': 'Students and faculty',
            'objectives': 'Test objectives',
            'call_to_action': 'Test call to action',
            'start_date': start_date.isoformat() + 'Z',
            'end_date': end_date.isoformat() + 'Z',
            'featured_until': featured_until.isoformat() + 'Z',
            'tags': 'test, comprehensive, api',
            'external_link': 'https://example.com',
            'contact_info': 'test@usc.edu.ph'
        }
        
        response = requests.post(
            f"{self.base_url}/api/health-info/campaigns/",
            data=data,  # Use form data for comprehensive test
            headers=self.get_headers()
        )
        
        return {
            'success': response.status_code == 201,
            'message': f"Comprehensive campaign creation returned {response.status_code}",
            'response_code': response.status_code,
            'details': response.text if response.status_code != 201 else 'Created successfully'
        }
    
    def test_empty_file_handling(self):
        """Test handling of empty file uploads"""
        data = {
            'title': 'Empty File Test Campaign',
            'description': 'Testing empty file handling',
            'campaign_type': 'GENERAL',
            'start_date': '2024-12-01T08:00:00Z',
            'end_date': '2024-12-31T17:00:00Z',
            'content': 'Testing empty file uploads'
        }
        
        # Create an empty temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            empty_file_path = tmp.name
        
        try:
            with open(empty_file_path, 'rb') as f:
                files = {'banner_image': ('empty.jpg', f, 'image/jpeg')}
                
                response = requests.post(
                    f"{self.base_url}/api/health-info/campaigns/",
                    data=data,
                    files=files,
                    headers=self.get_headers()
                )
        finally:
            # Clean up temporary file
            os.unlink(empty_file_path)
        
        # Should either succeed (by ignoring empty file) or return 400 with clear message
        success = response.status_code in [201, 400]
        
        return {
            'success': success,
            'message': f"Empty file test returned {response.status_code}",
            'response_code': response.status_code,
            'details': response.text
        }
    
    def test_invalid_data(self):
        """Test handling of invalid data"""
        test_cases = [
            {
                'name': 'Missing Title',
                'data': {
                    'description': 'Missing title test',
                    'campaign_type': 'GENERAL',
                    'start_date': '2024-12-01T08:00:00Z',
                    'end_date': '2024-12-31T17:00:00Z',
                    'content': 'Test content'
                }
            },
            {
                'name': 'Invalid Date Range',
                'data': {
                    'title': 'Invalid Date Test',
                    'description': 'Testing invalid date range',
                    'campaign_type': 'GENERAL',
                    'start_date': '2024-12-31T08:00:00Z',
                    'end_date': '2024-12-01T17:00:00Z',  # End before start
                    'content': 'Test content'
                }
            },
            {
                'name': 'Invalid Campaign Type',
                'data': {
                    'title': 'Invalid Type Test',
                    'description': 'Testing invalid campaign type',
                    'campaign_type': 'INVALID_TYPE',
                    'start_date': '2024-12-01T08:00:00Z',
                    'end_date': '2024-12-31T17:00:00Z',
                    'content': 'Test content'
                }
            }
        ]
        
        results = []
        for case in test_cases:
            response = requests.post(
                f"{self.base_url}/api/health-info/campaigns/",
                json=case['data'],
                headers=self.get_headers()
            )
            
            # Should return 400 for invalid data
            results.append({
                'case': case['name'],
                'success': response.status_code == 400,
                'status_code': response.status_code,
                'response': response.text
            })
        
        all_passed = all(r['success'] for r in results)
        
        return {
            'success': all_passed,
            'message': f"Invalid data tests: {sum(1 for r in results if r['success'])}/{len(results)} passed",
            'details': results
        }
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting USC-PIS Campaign API Test Suite")
        print(f"Base URL: {self.base_url}")
        
        if not self.token:
            print("❌ No authentication token - please authenticate first")
            return
        
        # Run all tests
        self.run_test("Minimal Campaign Creation", self.test_minimal_campaign_creation)
        self.run_test("Comprehensive Campaign Creation", self.test_comprehensive_campaign_creation)
        self.run_test("Empty File Handling", self.test_empty_file_handling)
        self.run_test("Invalid Data Handling", self.test_invalid_data)
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Total tests: {len(self.test_results)}")
        passed = sum(1 for r in self.test_results if r['success'])
        print(f"Passed: {passed}")
        print(f"Failed: {len(self.test_results) - passed}")
        
        if passed == len(self.test_results):
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed - check details above")
        
        return self.test_results

# Usage example
if __name__ == '__main__':
    # Configure your test environment
    tester = CampaignAPITester(
        base_url="http://localhost:8000",
        email="your_email@usc.edu.ph",  # Replace with your credentials
        password="your_password"
    )
    
    # Run all tests
    results = tester.run_all_tests()
```

### Quick Test Commands
```bash
# Save the above script as test_campaigns.py, then run:
python test_campaigns.py

# Or run individual curl tests:

# Test 1: Basic creation
curl -X POST "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick Test","description":"Quick test campaign","campaign_type":"GENERAL","start_date":"2024-12-01T08:00:00Z","end_date":"2024-12-31T17:00:00Z","content":"Quick test content"}'

# Test 2: List campaigns
curl -X GET "http://localhost:8000/api/health-info/campaigns/" \
  -H "Authorization: Token YOUR_TOKEN"

# Test 3: Get specific campaign
curl -X GET "http://localhost:8000/api/health-info/campaigns/1/" \
  -H "Authorization: Token YOUR_TOKEN"
```

## Expected Results

### Successful Campaign Creation (201)
```json
{
  "id": 123,
  "title": "Test Campaign",
  "description": "Test description", 
  "campaign_type": "GENERAL",
  "status": "DRAFT",
  "created_at": "2024-08-18T10:30:00Z",
  "created_by_name": "Test User",
  "banner_image_url": null,
  "thumbnail_image_url": null,
  "pubmat_image_url": null
}
```

### Validation Error (400)
```json
{
  "title": ["This field is required."],
  "start_date": ["End date must be after start date."]
}
```

### Authentication Error (401)
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Server Error (500)
```json
{
  "error": "Campaign creation failed: Empty file"
}
```

## Next Steps for Debugging

1. **Run the automated test suite** to identify which scenarios work vs fail
2. **Compare successful API calls** with failing frontend requests
3. **Use browser DevTools** to inspect the exact request being sent by frontend
4. **Check server logs** during both successful and failed requests
5. **Isolate the specific field or file** causing the "Empty file" error

---

**Last Updated**: August 18, 2025  
**Status**: READY FOR USE - Run tests to identify campaign creation issue root cause