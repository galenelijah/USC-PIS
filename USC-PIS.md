# USC Patient Information System (USC-PIS)

## Overview
USC-PIS is a full-stack web application designed to manage patient information for the University of San Carlos. It provides secure, role-based access for students, doctors, nurses, and staff to manage, view, and update patient records, profiles, and health information. The system is built for scalability, maintainability, and ease of use, supporting both clinical workflows and administrative oversight.

---

## Recent Fixes (May 2025)
- **Patient creation moved to profile setup:** Patient records are now created only after the user completes the multi-step profile setup, ensuring all required fields are present.
- **Multi-step profile setup validation:** Validation now only applies to the current step, improving user experience and preventing form errors.
- **Date handling and required fields:** Backend now properly converts date strings to Python date objects, and frontend sends the correct fields for patient creation.
- **Post-setup navigation:** After successful profile setup, Redux state is updated and users are redirected to the dashboard (`/home`).
- **API endpoint correction:** The frontend now fetches patient lists from `/api/patients/patients/` instead of `/api/patients/` to get actual patient data.
- **Registration authentication fix:** Registration now automatically logs users in after successful registration, eliminating 401 errors on subsequent API calls.
- **Profile setup completion handling:** Enhanced profile setup with proper state management and navigation flow, ensuring users are correctly redirected to dashboard after completion.
- **HealthRecords patient selection:** Added missing patient selection functionality to HealthRecords component, allowing proper creation of health records with patient assignment.
- **Medical certificate service consolidation:** Consolidated medical certificate service into main api.js file for better organization and consistency.
- **Default template confirmation:** Verified that default medical certificate template exists in database for template-based certificate generation.
- **General debugging:** Console and network tab were used to verify API responses and check for errors. Redux and navigation were checked to ensure state and routing were correct after profile setup.

---

## Registration & Profile Setup Flow
- Users register via `/api/auth/register/`.
- After registration, users are prompted to complete a multi-step profile setup form.
- Patient records are created only after profile setup is completed, not at registration.
- After successful profile setup, the frontend updates Redux state and redirects the user to `/home` (dashboard).
- The frontend fetches patient lists from `/api/patients/patients/`.

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
- **Medical Certificate Management:**
  - Template-based medical certificate generation with customizable HTML templates
  - Workflow-based certificate approval system (draft → pending → approved/rejected)
  - Role-based permissions for certificate creation, approval, and viewing
  - PDF generation and download functionality for approved certificates
  - Default template provided for standard USC Health Services medical certificates
- **Patient Feedback Collection and Analysis:**
  - Digital feedback forms for patients after consultations or treatments (including general feedback).
  - Feedback form includes: star rating, comments, staff courtesy, recommendation, and improvement suggestions.
  - Feedback is linked to a specific visit or can be general.
  - **Analytics Dashboard:** Admin/staff users have access to a dedicated feedback analytics dashboard showing statistics and visualizations (ratings distribution, courtesy/recommendation counts, etc.)
  - **Role-Based Navigation:** The sidebar Feedback link intelligently redirects to the appropriate view based on user role (admin/staff → analytics, others → feedback form).
- **Universal File Upload:** Allows any authenticated user to upload files (e.g., documents, images) with descriptions.
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

### UploadedFile (`file_uploads.UploadedFile`)
- id: AutoField (PK)
- uploaded_by: ForeignKey to User (nullable)
- file: FileField (upload_to='user_uploads/')
- original_filename: CharField
- description: TextField (nullable)
- upload_date: DateTimeField (auto)
- content_type: CharField
- file_size: PositiveIntegerField (nullable)

### CertificateTemplate (`medical_certificates.CertificateTemplate`)
- id: AutoField (PK)
- name: CharField (max_length=100)
- description: TextField (blank)
- content: TextField (HTML template with placeholders)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

### MedicalCertificate (`medical_certificates.MedicalCertificate`)
- id: AutoField (PK)
- patient: ForeignKey to Patient (medical_certificates reverse relation)
- template: ForeignKey to CertificateTemplate
- diagnosis: TextField
- recommendations: TextField
- valid_from: DateField
- valid_until: DateField
- additional_notes: TextField (blank)
- status: CharField (choices: draft, pending, approved, rejected, default: draft)
- issued_by: ForeignKey to User (issued_certificates reverse relation)
- approved_by: ForeignKey to User (approved_certificates reverse relation, nullable)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
- issued_at: DateTimeField (nullable)
- approved_at: DateTimeField (nullable)

### Consultation (`patients.Consultation`)
- id: AutoField (PK)
- patient: ForeignKey to Patient (consultations reverse relation)
- consultation_date: DateTimeField
- chief_complaint: TextField
- history_of_present_illness: TextField (blank)
- physical_examination: TextField (blank)
- assessment: TextField (blank)
- plan: TextField (blank)
- notes: TextField (blank)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
- created_by: ForeignKey to User (nullable)

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

### File Uploads (`/api/files/`)
- **Base URL:** `/api/files/uploads/`
- **Methods:**
  - `POST` (create): Upload a new file. Requires authentication. Associates file with the logged-in user. Expects multipart/form-data with 'file' and optionally 'description'.
  - `GET` (list): List all uploaded files. Requires authentication.
  - `GET` (retrieve): Retrieve details of a specific file by ID. Requires authentication.
  - `DELETE` (destroy): Delete a file by ID. Requires authentication (permission might be restricted further, e.g., to owner or admin).
- **Permissions:** `IsAuthenticated` for all methods currently.

### Medical Certificates (`/api/medical-certificates/`)
- **Base URL:** `/api/medical-certificates/certificates/`
- **Methods:**
  - `GET` (list): List all medical certificates. Requires authentication.
  - `POST` (create): Create a new medical certificate. Requires authentication and staff/medical personnel permissions.
  - `GET` (retrieve): Retrieve details of a specific certificate by ID.
  - `PUT`/`PATCH` (update): Update a certificate (only for draft status).
  - `DELETE` (destroy): Delete a certificate (only for draft status).
- **Workflow Actions:**
  - `POST` `/api/medical-certificates/certificates/{id}/submit/`: Submit certificate for approval.
  - `POST` `/api/medical-certificates/certificates/{id}/approve/`: Approve a pending certificate.
  - `POST` `/api/medical-certificates/certificates/{id}/reject/`: Reject a pending certificate.
- **Templates:**
  - `GET` `/api/medical-certificates/templates/`: List all certificate templates.
  - `POST` `/api/medical-certificates/templates/`: Create a new template.
  - `GET`/`PUT`/`DELETE` `/api/medical-certificates/templates/{id}/`: Template CRUD operations.
- **Rendering:**
  - `GET` `/api/medical-certificates/certificates/{id}/render/`: Generate HTML preview of certificate.
  - `GET` `/api/medical-certificates/certificates/{id}/render_pdf/`: Download certificate as PDF.
- **Permissions:** Staff/medical personnel for creation and approval actions; patients can view their own certificates.

## Frontend Components Notes

- Key components are located in `backend/frontend/frontend/src/components/` and `backend/frontend/frontend/src/pages/`.
- **FeedbackAnalytics.jsx:** Displays feedback summary statistics and charts, including average rating, rating distribution with chart visualization, and courtesy/recommendation counts. Used within the admin feedback view.
- **AdminFeedbackList.jsx:** Displays a table of all feedback entries and integrates `FeedbackAnalytics.jsx`. Accessible to Admin/Staff.
- **FeedbackForm.jsx / FeedbackSelector.jsx:** Handles feedback submission by patients.
- **Sidebar.jsx:** Implements role-based navigation, redirecting users based on their role (e.g., Feedback link redirects admin/staff to analytics and regular users to the feedback form).
- **FileUploadPage.jsx:** Provides an interface for users to upload new files and view/delete their existing uploads. Located at `/uploads`.

## Known Limitations and Solutions

- **Authentication State:** The application implements a hybrid approach to authentication state management, with both Redux and localStorage backup to ensure stable user recognition across refreshes.
- **Patient Profile Linking:** Patient profiles are automatically created for student users, either during registration or on-demand when accessing patient-specific features.

## UI/UX Improvements

The USC Patient Information System has undergone significant UI/UX improvements to enhance user experience and visual appeal:

### Global UI Enhancements
- **Modern Theme**: Updated color palette with improved contrast and accessibility
- **Consistent Typography**: Enhanced typography system with better readability and hierarchy
- **Improved Shadows and Elevation**: Modern shadow system for better depth perception
- **Responsive Design**: All components are fully responsive across different device sizes
- **Animations and Transitions**: Subtle animations for better user feedback and engagement

### Component Improvements
- **Sidebar**: Enhanced with user avatar, role display, and better organization of navigation items
- **Header**: Improved search functionality, user profile dropdown, and notification system
- **Dashboard**: Redesigned with modern stat cards, quick actions, and better data visualization
- **Login Page**: Complete redesign with split-panel layout, improved form validation, and better error handling
- **Loading States**: Consistent loading indicators throughout the application
- **Error States**: Standardized error handling with clear messages and recovery options
- **Empty States**: Informative empty state displays when no data is available

### New Utility Components
- **PageHeader**: Consistent page headers with breadcrumbs, actions, and descriptions
- **LoadingState**: Reusable loading component with customizable appearance
- **ErrorState**: Standardized error display with retry functionality
- **EmptyState**: Consistent empty state display with optional actions

These improvements create a more cohesive, intuitive, and visually appealing user interface that enhances the overall user experience of the USC Patient Information System.

---

For more details, see `USER_GUIDE.md`, `CONTRIBUTING.md`, and other documentation files. 