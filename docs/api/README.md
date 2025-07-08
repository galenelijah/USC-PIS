# USC-PIS API Documentation

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
- **URL**: `/api/patients/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

### Create Patient
- **URL**: `/api/patients/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <token>`
- **Data**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2000-01-01",
    "gender": "M",
    "email": "patient@example.com",
    "phone_number": "1234567890",
    "address": "123 Main St"
  }
  ```

### Get Patient Details
- **URL**: `/api/patients/<id>/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <token>`

### Update Patient
- **URL**: `/api/patients/<id>/`
- **Method**: `PUT`
- **Headers**: `Authorization: Token <token>`

### Delete Patient
- **URL**: `/api/patients/<id>/`
- **Method**: `DELETE`
- **Headers**: `Authorization: Token <token>`

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