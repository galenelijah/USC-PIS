# USC-PIS API Documentation
## Enhanced Features - July 15, 2025

### Overview
This document provides comprehensive API documentation for the enhanced USC Patient Information System (USC-PIS) features implemented on July 15, 2025, including medical certificate workflow, health campaign system, and security improvements.

---

## API Versioning and Rate Limiting

### API Versioning
All API endpoints now support versioning through Accept headers.

```http
GET /api/patients/
Accept: application/json; version=v1
```

**Response Headers**:
```http
API-Version: v1
X-API-Version: v1
Content-Type: application/json
```

### Rate Limiting
- **Authenticated Users**: 100 requests/hour
- **Unauthenticated Users**: 20 requests/hour
- **Rate Limit Headers**: Included in all responses

**Rate Limit Exceeded Response**:
```json
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Medical Certificate API

### Base URL
```
/api/medical-certificates/
```

### Authentication
All medical certificate endpoints require authentication via token.

```http
Authorization: Token <your-token-here>
```

### Endpoints

#### 1. List Medical Certificates
```http
GET /api/medical-certificates/certificates/
```

**Response**:
```json
[
  {
    "id": 1,
    "patient": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@usc.edu.ph"
    },
    "template": {
      "id": 1,
      "name": "Default Medical Certificate"
    },
    "diagnosis": "Common cold",
    "recommendations": "Rest and fluids",
    "valid_from": "2025-07-15",
    "valid_until": "2025-07-22",
    "status": "approved",
    "issued_by": {
      "id": 1,
      "email": "doctor@usc.edu.ph",
      "first_name": "Dr.",
      "last_name": "Smith"
    },
    "approved_by": {
      "id": 1,
      "email": "doctor@usc.edu.ph",
      "first_name": "Dr.",
      "last_name": "Smith"
    },
    "created_at": "2025-07-15T10:00:00Z",
    "approved_at": "2025-07-15T10:30:00Z"
  }
]
```

#### 2. Create Medical Certificate
```http
POST /api/medical-certificates/certificates/
Content-Type: application/json

{
  "patient": 1,
  "template": 1,
  "diagnosis": "Flu symptoms",
  "recommendations": "Rest for 3 days",
  "valid_from": "2025-07-15",
  "valid_until": "2025-07-18",
  "additional_notes": "Follow up if symptoms persist"
}
```

**Response**:
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 2,
  "patient": 1,
  "template": 1,
  "diagnosis": "Flu symptoms",
  "recommendations": "Rest for 3 days",
  "valid_from": "2025-07-15",
  "valid_until": "2025-07-18",
  "status": "draft",
  "issued_by": 1,
  "created_at": "2025-07-15T14:00:00Z"
}
```

#### 3. Submit Certificate for Approval
```http
POST /api/medical-certificates/certificates/2/submit/
```

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Certificate submitted for approval",
  "status": "pending"
}
```

#### 4. Approve Certificate
```http
POST /api/medical-certificates/certificates/2/approve/
```

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Certificate approved successfully",
  "status": "approved",
  "approved_at": "2025-07-15T15:00:00Z"
}
```

#### 5. Reject Certificate
```http
POST /api/medical-certificates/certificates/2/reject/
```

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Certificate rejected",
  "status": "rejected",
  "approved_at": "2025-07-15T15:00:00Z"
}
```

#### 6. Render Certificate PDF
```http
GET /api/medical-certificates/certificates/1/render_pdf/
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="medical_certificate_1.pdf"

[PDF Binary Content]
```

#### 7. Get Certificate HTML Preview
```http
GET /api/medical-certificates/certificates/1/render/
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: text/html

<html>
  <head>
    <title>Medical Certificate</title>
  </head>
  <body>
    <h1>Medical Certificate</h1>
    <p>This is to certify that John Doe...</p>
  </body>
</html>
```

---

## Health Campaign API

### Base URL
```
/api/health-info/
```

### Endpoints

#### 1. List Health Campaigns
```http
GET /api/health-info/campaigns/
```

**Query Parameters**:
- `status` - Filter by status (DRAFT, SCHEDULED, ACTIVE, COMPLETED)
- `campaign_type` - Filter by type (VACCINATION, MENTAL_HEALTH, etc.)
- `search` - Search in title and description
- `ordering` - Order by fields (created_at, start_date, priority)

**Response**:
```json
[
  {
    "id": 1,
    "title": "COVID-19 Vaccination Drive - Fall 2025",
    "description": "Campus-wide vaccination campaign",
    "campaign_type": "VACCINATION",
    "status": "ACTIVE",
    "priority": "HIGH",
    "start_date": "2025-08-01T09:00:00Z",
    "end_date": "2025-08-31T17:00:00Z",
    "featured_until": "2025-08-15T23:59:59Z",
    "view_count": 150,
    "engagement_count": 45,
    "created_by": {
      "id": 1,
      "email": "admin@usc.edu.ph",
      "first_name": "System",
      "last_name": "Administrator"
    },
    "template": {
      "id": 1,
      "name": "COVID-19 Vaccination Campaign"
    },
    "is_active": true,
    "is_featured": true
  }
]
```

#### 2. Create Health Campaign
```http
POST /api/health-info/campaigns/
Content-Type: application/json

{
  "title": "Mental Health Awareness Week",
  "description": "Campus mental health awareness campaign",
  "campaign_type": "MENTAL_HEALTH",
  "priority": "HIGH",
  "content": "<h2>Mental Health Matters</h2><p>Your mental health is important...</p>",
  "summary": "Take care of your mental health during exam season",
  "target_audience": "All USC students",
  "objectives": "Increase awareness of mental health resources",
  "call_to_action": "Contact counseling services today",
  "start_date": "2025-08-01T09:00:00Z",
  "end_date": "2025-08-07T17:00:00Z",
  "template": 2
}
```

#### 3. Create Campaign from Template
```http
POST /api/health-info/campaigns/create-from-template/
Content-Type: application/json

{
  "template_id": 1,
  "title": "COVID-19 Vaccination Drive - Spring 2025",
  "start_date": "2025-08-01T09:00:00Z",
  "end_date": "2025-08-31T17:00:00Z",
  "custom_content": "Updated content for spring semester"
}
```

#### 4. Track Campaign Engagement
```http
POST /api/health-info/campaigns/1/engage/
```

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Engagement tracked successfully",
  "engagement_count": 46
}
```

#### 5. Get Featured Campaigns
```http
GET /api/health-info/campaigns/featured/
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "COVID-19 Vaccination Drive - Fall 2025",
    "summary": "Get vaccinated to protect yourself and others",
    "campaign_type": "VACCINATION",
    "priority": "HIGH",
    "thumbnail_image": "/media/campaigns/vaccination/thumbnail.jpg",
    "is_featured": true,
    "view_count": 150
  }
]
```

#### 6. Campaign Analytics
```http
GET /api/health-info/campaigns/analytics/
```

**Response**:
```json
{
  "total_campaigns": 5,
  "active_campaigns": 2,
  "total_views": 500,
  "total_engagement": 125,
  "campaigns_by_type": {
    "VACCINATION": 2,
    "MENTAL_HEALTH": 1,
    "NUTRITION": 1,
    "HYGIENE": 1
  },
  "top_performing_campaigns": [
    {
      "id": 1,
      "title": "COVID-19 Vaccination Drive",
      "view_count": 150,
      "engagement_count": 45
    }
  ]
}
```

---

## Campaign Templates API

### Endpoints

#### 1. List Campaign Templates
```http
GET /api/health-info/campaign-templates/
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "COVID-19 Vaccination Campaign",
    "description": "Template for COVID-19 vaccination campaigns",
    "campaign_type": "VACCINATION",
    "priority": "HIGH",
    "title_template": "COVID-19 Vaccination Drive - {date}",
    "content_template": "<h2>COVID-19 Vaccination Campaign</h2>...",
    "summary_template": "Get vaccinated against COVID-19...",
    "usage_count": 3,
    "is_active": true,
    "created_at": "2025-07-15T10:00:00Z"
  }
]
```

#### 2. Get Template Details
```http
GET /api/health-info/campaign-templates/1/
```

**Response**:
```json
{
  "id": 1,
  "name": "COVID-19 Vaccination Campaign",
  "description": "Template for COVID-19 vaccination campaigns",
  "campaign_type": "VACCINATION",
  "priority": "HIGH",
  "title_template": "COVID-19 Vaccination Drive - {date}",
  "content_template": "<h2>COVID-19 Vaccination Campaign</h2><p>The University of Southern California is conducting a COVID-19 vaccination drive...</p>",
  "summary_template": "Get vaccinated against COVID-19 to protect yourself and our campus community.",
  "target_audience_template": "All USC students, faculty, and staff",
  "objectives_template": "- Achieve 90% vaccination rate\n- Provide easy access to vaccines\n- Educate about vaccine safety",
  "call_to_action_template": "Schedule your vaccination appointment today!",
  "tags_template": "covid-19, vaccination, health, safety, campus",
  "usage_count": 3,
  "is_active": true,
  "banner_image": "/media/campaign_templates/banners/covid_banner.jpg",
  "thumbnail_image": "/media/campaign_templates/thumbnails/covid_thumb.jpg",
  "created_at": "2025-07-15T10:00:00Z"
}
```

---

## Campaign Resources API

### Endpoints

#### 1. List Campaign Resources
```http
GET /api/health-info/campaign-resources/
```

**Query Parameters**:
- `campaign` - Filter by campaign ID
- `resource_type` - Filter by type (DOCUMENT, IMAGE, VIDEO, etc.)
- `is_public` - Filter by public/private status

**Response**:
```json
[
  {
    "id": 1,
    "campaign": 1,
    "title": "Vaccination Information Brochure",
    "description": "Comprehensive guide to COVID-19 vaccines",
    "resource_type": "DOCUMENT",
    "file": "/media/campaign_resources/vaccination_brochure.pdf",
    "file_size": 2048576,
    "download_count": 25,
    "is_public": true,
    "created_at": "2025-07-15T10:00:00Z"
  }
]
```

#### 2. Upload Campaign Resource
```http
POST /api/health-info/campaigns/1/upload_resource/
Content-Type: multipart/form-data

{
  "title": "Vaccination Safety Guide",
  "description": "Safety information for COVID-19 vaccines",
  "resource_type": "DOCUMENT",
  "file": [binary file data],
  "is_public": true
}
```

#### 3. Download Resource
```http
GET /api/health-info/campaign-resources/1/download/
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="vaccination_brochure.pdf"

[PDF Binary Content]
```

---

## Campaign Feedback API

### Endpoints

#### 1. Submit Campaign Feedback
```http
POST /api/health-info/campaigns/1/feedback/
Content-Type: application/json

{
  "rating": 5,
  "usefulness": 4,
  "clarity": 5,
  "comments": "Very informative campaign about vaccination safety",
  "suggestions": "Could include more information about side effects",
  "will_recommend": true,
  "took_action": true,
  "learned_something_new": true
}
```

**Response**:
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "campaign": 1,
  "rating": 5,
  "usefulness": 4,
  "clarity": 5,
  "comments": "Very informative campaign about vaccination safety",
  "will_recommend": true,
  "took_action": true,
  "learned_something_new": true,
  "created_at": "2025-07-15T14:00:00Z"
}
```

#### 2. Get Campaign Feedback
```http
GET /api/health-info/campaigns/1/feedback/
```

**Response**:
```json
{
  "feedback_count": 10,
  "average_rating": 4.2,
  "average_usefulness": 4.1,
  "average_clarity": 4.3,
  "recommendation_rate": 0.8,
  "action_taken_rate": 0.6,
  "learning_rate": 0.9,
  "recent_feedback": [
    {
      "id": 1,
      "rating": 5,
      "comments": "Very informative campaign",
      "created_at": "2025-07-15T14:00:00Z"
    }
  ]
}
```

---

## Enhanced Notifications API

### Base URL
```
/api/notifications/
```

### Endpoints

#### 1. List Notifications
```http
GET /api/notifications/
```

**Query Parameters**:
- `is_read` - Filter by read status
- `notification_type` - Filter by type
- `limit` - Number of notifications to return

**Response**:
```json
[
  {
    "id": 1,
    "title": "Medical Certificate Approved",
    "message": "Your medical certificate has been approved by Dr. Smith. You can now download it.",
    "notification_type": "certificate_approved",
    "is_read": false,
    "created_at": "2025-07-15T15:00:00Z"
  },
  {
    "id": 2,
    "title": "New Health Campaign: Mental Health Awareness",
    "message": "A new health campaign about Mental Health Awareness is now active. Check it out!",
    "notification_type": "campaign_activated",
    "is_read": false,
    "created_at": "2025-07-15T14:30:00Z"
  }
]
```

#### 2. Mark Notification as Read
```http
POST /api/notifications/1/mark_read/
```

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Notification marked as read",
  "is_read": true
}
```

#### 3. Get Unread Count
```http
GET /api/notifications/unread_count/
```

**Response**:
```json
{
  "unread_count": 5
}
```

---

## Security Features

### Request/Response Headers
All API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Error Handling
Standardized error responses across all endpoints:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "This field is required"
    }
  }
}
```

### Authentication Errors
```json
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication credentials were not provided"
  }
}
```

### Permission Errors
```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action"
  }
}
```

---

## Performance Optimizations

### Database Query Optimization
All endpoints use optimized queries with select_related and prefetch_related:

```python
# Example optimized query
patients = Patient.objects.select_related('user', 'created_by').prefetch_related('medical_records')
```

### Caching Headers
Appropriate caching headers are set for static content:

```http
Cache-Control: max-age=3600
ETag: "d41d8cd98f00b204e9800998ecf8427e"
```

---

## Testing and Development

### API Testing
Use the provided test scripts for validation:

```bash
# Test medical certificates
python test_medical_certificates_simple.py

# Test health campaigns
python test_health_campaigns_simple.py

# Test security improvements
python test_security_improvements.py
```

### Development Environment
```bash
# Start development server
python manage.py runserver

# Run tests
python manage.py test

# Check security
python manage.py check --deploy
```

---

## Conclusion

The USC-PIS API now provides comprehensive endpoints for:
- **Medical Certificate Management** - Complete workflow with approvals
- **Health Campaign System** - Templates, scheduling, and analytics
- **Enhanced Security** - Rate limiting, versioning, and monitoring
- **Notification System** - Real-time notifications across all modules

All endpoints follow RESTful conventions and include proper error handling, authentication, and performance optimizations.

---

**Document Created**: July 15, 2025
**API Version**: v1
**Security Level**: Enterprise-Grade
**Performance**: Optimized with caching and database indexes