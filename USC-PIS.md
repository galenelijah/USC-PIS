# USC Patient Information System (USC-PIS)

## Overview
USC-PIS is a full-stack web application designed to manage patient information for the University of San Carlos. It provides secure, role-based access for students, doctors, nurses, and staff to manage, view, and update patient records, profiles, and health information. The system is built for scalability, maintainability, and ease of use, supporting both clinical workflows and administrative oversight.

## Technology Stack
- **Backend:** Django, Django REST Framework (DRF)
- **Frontend:** React (Vite, Material UI, React Router, Axios)
- **State Management:** Redux Toolkit
- **Database:** Managed by Django ORM (default: SQLite, can be configured for PostgreSQL, etc.)
- **Deployment:** Procfile for Heroku or similar PaaS; frontend is built and served by Django in production

## Key Features
- User authentication (login, registration, password reset)
- Role-based access control (Student, Doctor, Nurse, Staff, etc.)
- Patient record management (CRUD)
- Profile management and setup
- **Automatic Patient Profile Creation:** When a user registers as a student and completes profile setup, a Patient profile is automatically created and linked to their user account.
- **Patient Feedback Collection and Analysis:**
  - Digital feedback forms for patients after consultations or treatments (including general feedback).
  - Feedback form includes: star rating, comments, staff courtesy, recommendation, and improvement suggestions.
  - Feedback is linked to a specific visit or can be general.
  - Admin/staff can analyze feedback for quality improvement.
- Dashboard with health statistics
- Database health monitoring

## Project Structure
```
USC-PIS/
├── backend/                # Django backend (API, models, migrations, etc.)
│   └── frontend/frontend/  # React frontend (Vite, src/, etc.)
├── requirements.txt        # Python dependencies
├── package.json            # Node dependencies for frontend
├── Procfile                # Deployment process file
├── README.md               # Basic project info
├── USC-PIS.md              # (This file) Main project documentation
└── ...
```

## Setup & Development Workflow
### Backend
1. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Run migrations:
   ```sh
   python manage.py migrate
   ```
3. Start the backend server:
   ```sh
   python manage.py runserver
   ```

### Frontend
1. Install Node dependencies:
   ```sh
   cd backend/frontend/frontend
   npm install
   ```
2. Build the frontend for production (required before running Django server):
   ```sh
   npm run build
   ```

### Development Notes
- The Django backend serves the built frontend assets in production.
- For local development, always rebuild the frontend after making changes to React code.
- Use Redux DevTools for debugging state in development.

## Deployment
- Use the `Procfile` for deployment to Heroku or similar platforms.
- Ensure all environment variables and database settings are configured for production.
- The frontend should be built (`npm run build`) before deploying.

## Database Schema
> **IMPORTANT:**
> - Document all models and migrations here.
> - Update this section after every major schema change or migration.

### User (`authentication.User`)
- id: AutoField (PK)
- email: EmailField, unique, required (used as username)
- username: CharField, unique, required (set to email by default)
- role: CharField, choices: ADMIN, DOCTOR, NURSE, STAFF, STUDENT (default: STUDENT)
- completeSetup: BooleanField (default: False)
- middle_name: CharField, optional
- id_number: CharField, optional
- course: CharField, optional
- year_level: CharField, optional
- school: CharField, optional
- sex: CharField, optional
- civil_status: CharField, optional
- birthday: DateField, optional
- nationality: CharField, optional
- religion: CharField, optional
- address_permanent: CharField, optional
- address_present: CharField, optional
- phone: CharField, optional
- weight: CharField, optional
- height: CharField, optional
- bmi: CharField, optional
- father_name: CharField, optional
- mother_name: CharField, optional
- emergency_contact: CharField, optional
- emergency_contact_number: CharField, optional
- illness: CharField, optional
- childhood_diseases: CharField, optional
- special_needs: CharField, optional
- existing_medical_condition: CharField, optional
- medications: CharField, optional
- allergies: CharField, optional
- hospitalization_history: CharField, optional
- surgical_procedures: CharField, optional
- department: CharField, optional
- phone_number: CharField, optional
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

### Patient (`patients.Patient`)
- id: AutoField (PK)
- user: OneToOneField to User, nullable, blank, (patient_profile reverse relation)
- first_name: CharField
- last_name: CharField
- date_of_birth: DateField
- gender: CharField, choices: M, F, O
- email: EmailField, unique
- phone_number: CharField
- address: TextField
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
- created_by: ForeignKey to User, nullable

### MedicalRecord (`patients.MedicalRecord`)
- id: AutoField (PK)
- patient: ForeignKey to Patient (medical_records reverse relation)
- visit_date: DateField
- diagnosis: TextField
- treatment: TextField
- notes: TextField, blank
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
- created_by: ForeignKey to User, nullable

### Feedback (`feedback.Feedback`)
- id: AutoField (PK)
- patient: ForeignKey to Patient
- medical_record: ForeignKey to MedicalRecord (nullable, if feedback is for a specific visit)
- rating: IntegerField (1-5)
- comments: TextField (optional)
- courteous: CharField (yes/no, optional)
- recommend: CharField (yes/no, optional)
- improvement: TextField (optional)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

### HealthInformation (`health_info.HealthInformation`)
- id: AutoField (PK)
- title: CharField (max_length=200)
- content: TextField
- category: CharField (max_length=100)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
- author: ForeignKey to User (nullable, blank, on delete SET_NULL)

## Migration & Documentation Rules
- After adding a major feature or completing a milestone, update this file.
- Document the entire database schema here.
- For new migrations, add them to this file.

### Health Information API

- **Base URL:** `/api/health-info/health-information/`
- **Methods:**
  - `GET` (list, retrieve): All users (patients/students: read-only)
  - `POST`, `PUT`, `PATCH`, `DELETE`: Only staff/admins
- **Fields:** id, title, content, category, created_at, updated_at, author, author_email, author_role
- **Permissions:** Patients/students can only read; staff/admins can create, update, and delete.

## API Endpoints Documentation

### Authentication (`/api/auth/`)
// ... existing auth endpoints ...

### Patient (`/api/patients/`)
// ... existing patient endpoints ...

### Health Information (`/api/health-info/health-information/`)
// ... existing health info endpoints ...

### Feedback (`/api/feedback/`)
- **Base URL:** `/api/feedback/`
- **Methods:**
  - `GET` (list): Admin/Staff see all; Patients see their own.
  - `POST` (create): Authenticated users with a linked Patient profile.
  - `GET` (retrieve), `PUT`/`PATCH` (update), `DELETE` (destroy): Standard ModelViewSet, permissions may vary based on object/user.
- **Analytics Sub-Endpoint:** `/api/feedback/analytics/`
  - `GET`: Returns aggregated feedback statistics (total count, average rating, rating distribution, courteous counts, recommend counts).
  - **Permissions:** Admin/Staff only.

## Frontend Components Notes

- Key components are located in `backend/frontend/frontend/src/components/` and `backend/frontend/frontend/src/pages/`.
- **FeedbackAnalytics.jsx:** Displays feedback summary statistics and charts. Used within the admin feedback view.
- **AdminFeedbackList.jsx:** Displays a table of all feedback entries and integrates `FeedbackAnalytics.jsx`. Accessible to Admin/Staff.
- **FeedbackForm.jsx / FeedbackSelector.jsx:** Handles feedback submission by patients.

---

For more details, see `USER_GUIDE.md`, `CONTRIBUTING.md`, and other documentation files. 