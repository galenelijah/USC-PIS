# USC-PIS API Documentation

[![API Version](https://img.shields.io/badge/API-v1.0-blue)]()
[![Status](https://img.shields.io/badge/Status-Production-success)]()
[![Framework](https://img.shields.io/badge/Django_REST-3.14.0-green)]()

## Overview
USC Patient Information System REST API provides comprehensive healthcare management functionality with enterprise-grade security and role-based access control.

## 🆕 Recent Updates (August 2025)
- **✅ Enhanced Dashboard**: Campaigns & announcements API integration
- **✅ Advanced Validation**: Comprehensive date validation across endpoints
- **✅ Student Optimization**: Role-based filtering and data access patterns  
- **✅ Data Compatibility**: Enhanced JSON handling for nested medical data
- **✅ Search Enhancement**: USC ID search across all medical endpoints
- **✅ Export APIs**: Professional CSV/PDF export with clinical formatting

## Authentication Endpoints

### Register User
- **URL**: `/api/auth/register/`
- **Method**: `POST`
- **Data**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "password2": "password123",
    "role": "STUDENT",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

### Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Data**:
  ```json
  {
    "username": "user@example.com",
    "password": "password123"
  }
  ```

### Get User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

### Update User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `PUT`
- **Headers**: `Authorization: Token <token>`

## Patient Endpoints

### List Patients
- **URL**: `/api/patients/patients/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse

### Create Patient
- **URL**: `/api/patients/patients/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2000-01-01",
    "gender": "M",
    "email": "patient@example.com",
    "phone_number": "1234567890",
    "address": "123 Main St",
    "user": 1  // Optional: Link to User account for students
  }
  ```

### Get Patient Details
- **URL**: `/api/patients/patients/<id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse

## Medical Records Endpoints

### List Medical Records
- **URL**: `/api/patients/medical-records/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Filtering**: 
  - Students: Only their own records (requires linked Patient profile)
  - Medical Staff: All records

### Create Medical Record
- **URL**: `/api/patients/medical-records/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "patient": 1,
    "visit_date": "2025-08-02",
    "diagnosis": "Common cold",
    "treatment": "Rest and fluids",
    "notes": "Patient advised to rest",
    "vital_signs": {
      "blood_pressure": "120/80",
      "temperature": "36.5",
      "heart_rate": "72",
      "respiratory_rate": "16"
    }
  }
  ```

### Get Medical Record Details
- **URL**: `/api/patients/medical-records/<id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

## Dental Records Endpoints

### List Dental Records
- **URL**: `/api/patients/dental-records/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Filtering**: Same as medical records

### Create Dental Record
- **URL**: `/api/patients/dental-records/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: Admin, Staff, Doctor, Nurse
- **Data**:
  ```json
  {
    "patient": 1,
    "visit_date": "2025-08-02",
    "procedure_performed": "CLEANING",
    "tooth_number": "14",
    "diagnosis": "Routine cleaning",
    "treatment_performed": "Professional dental cleaning",
    "pain_level": 0,
    "cost": "50.00",
    "insurance_covered": true
  }
  ```

## Health Information & Campaign Endpoints (Updated August 3, 2025)

### Get Featured Campaigns
- **URL**: `/api/health-info/campaigns/featured/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Description**: Returns up to 3 featured campaigns for dashboard display
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Flu Vaccination Campaign",
      "category": "VACCINATION",
      "description": "Annual flu vaccination program for all students",
      "created_at": "2025-08-01T10:00:00Z",
      "status": "ACTIVE"
    }
  ]
  ```

### Get Health Information
- **URL**: `/api/health-info/health-information/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users

### Dashboard Stats with Campaign Integration
- **URL**: `/api/auth/dashboard-stats/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`
- **Role Access**: All authenticated users
- **Enhanced Response** (includes announcements for dashboard):
  ```json
  {
    "total_patients": 150,
    "total_records": 300,
    "recent_patients": [...],
    "visits_by_month": [...],
    "appointments_today": 5,
    "pending_requests": 3,
    "next_appointment": {...},
    "recent_health_info": {...},
    "profile_completion": 85,
    "announcements": [
      {
        "id": 1,
        "title": "Clinic Hours Update",
        "content": "New clinic hours effective next week",
        "created_at": "2025-08-03T09:00:00Z"
      }
    ]
  }
  ```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Authentication

All endpoints except `/api/auth/login/` and `/api/auth/register/` require authentication.
Include the token in the request header:
```
Authorization: Token <your-token-here>
```

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error 