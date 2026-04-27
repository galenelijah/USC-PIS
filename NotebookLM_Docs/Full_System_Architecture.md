# Full System Architecture: USC-DC Patient Information System (USC-PIS)
**Role:** Lead Systems Architect
**Status:** DEFINITIVE / AUDITED

This document serves as the primary technical source for the USC-DC PIS Software Requirements Specification (SRS), detailing the module-by-module model schemas, business logic, role-based access controls, and external integrations.

---

## 1. Module-by-Module Model Audit

### 1.1 Authentication & Authorization (`authentication`)
**Core Purpose:** Manages user identities, role-based access, and onboarding workflows.
*   **`User` (extends `AbstractUser`):**
    *   **Fields:** `email` (PK), `role` (Choices: ADMIN, DOCTOR, DENTIST, NURSE, STAFF, STUDENT, FACULTY), `is_verified`.
    *   **Metadata:** Academic/Demographic fields (`id_number`, `course`, `year_level`, `department`).
    *   **Encrypted Fields:** `emergency_contact_number_enc`, `illness_enc`, `medications_enc`, `allergies_enc` (stored as `BinaryField`).
*   **`SafeEmail` (SafeList Logic):**
    *   **Fields:** `email`, `role`, `is_active`.
    *   **Logic:** Pre-authorizes staff emails. During registration, if the email exists in this table, the 6-digit MFA is bypassed and the specified clinical role is instantly assigned.
*   **`VerificationCode`:**
    *   **Fields:** `code` (6-digit), `expires_at`, `is_used`.
    *   **Workflow:** Mandatory MFA for students enforcing the `@usc.edu.ph` domain constraint.

### 1.2 Patients & Clinical Records (`patients`)
**Core Purpose:** Handles patient demographics, medical history, and clinical visits.
*   **`Patient`:**
    *   **Fields:** `first_name`, `last_name`, `date_of_birth`, `gender`, `address`.
    *   **Security:** `first_name_enc`, `last_name_enc` (pgcrypto `BinaryField`).
*   **`MedicalRecord`:**
    *   **Fields:** `visit_date`, `concern`, `diagnosis`, `treatment`, `vital_signs` (JSON), `physical_examination` (JSON).
    *   **Security:** `diagnosis_enc` (pgcrypto `BinaryField`).
*   **`DentalRecord`:**
    *   **Fields:** `procedure_performed` (Choices: CLEANING, EXTRACTION, etc.), `tooth_numbers` (FDI notation, e.g., 11-48), `tooth_chart` (JSON), `oral_hygiene_status`.
    *   **FDI Logic:** The `tooth_numbers` field accepts comma-separated values. View layer validators enforce the 11-48 range constraints for standard FDI notation.
*   **`Consultation`:**
    *   **Fields:** `date_time`, `concern`, `treatment_plan`, `remarks`.

### 1.3 Health Campaigns & Information (`health_info`)
**Core Purpose:** Disseminates public health alerts and manages campaign resources.
*   **`HealthCampaign`:**
    *   **Fields:** `title`, `campaign_type` (VACCINATION, MENTAL_HEALTH, etc.), `priority`, `target_audience`, `start_date`, `end_date`.
    *   **Media:** `banner_image`, `pubmat_image`, `thumbnail_image`.
    *   **Workflow:** Automated active/inactive toggling based on `start_date` and `end_date`.
*   **`CampaignResource` & `CampaignTemplate`:**
    *   **Fields:** `resource_type` (DOCUMENT, INFOGRAPHIC), `file`.
    *   **Logic:** Allows admins to pre-define campaign structures and attach downloadable flyers/guidelines.

### 1.4 Feedback & Analytics (`feedback`)
**Core Purpose:** Evaluates clinic services and calculates satisfaction metrics.
*   **`Feedback` & `CampaignFeedback`:**
    *   **Fields:** `rating` (1-5), `comments`, `courteous`, `recommend`, `improvement`.
    *   **Relations:** Linked conditionally to either `MedicalRecord` or `DentalRecord`.
    *   **Constraints:** `UniqueConstraint` enforces exactly one feedback submission per clinical visit.

### 1.5 Medical Certificates (`medical_certificates`)
**Core Purpose:** Generates PDF fitness assessments for academic clearance.
*   **`MedicalCertificate`:**
    *   **Fields:** `fitness_status` (fit, not_fit), `fitness_reason`, `approval_status` (draft, pending, approved, rejected), `valid_from`, `valid_until`.
    *   **Workflow:** Drafted by Nurse $\rightarrow$ Pending $\rightarrow$ Approved by Doctor (`issued_by`, `approved_by` fields).
*   **`CertificateTemplate`:**
    *   **Logic:** Stores raw HTML templates injected with patient context during PDF rendering (`pisa`).

### 1.6 Notifications & Reports (`notifications`, `reports`)
**Core Purpose:** Automates background tasks and report generation.
*   **`Notification`:**
    *   **Fields:** `notification_type` (APPOINTMENT_REMINDER, FOLLOW_UP), `delivery_method` (EMAIL, IN_APP).
    *   **Workflow:** Triggered by Django `post_save` signals (e.g., creating a MedicalRecord schedules a 24-hour feedback reminder).
*   **`GeneratedReport` & `ReportTemplate`:**
    *   **Fields:** `report_type` (VISIT_TRENDS, PATIENT_SUMMARY), `export_format` (PDF, EXCEL, CSV), `status`.
    *   **Workflow:** Handled asynchronously via Redis/Celery (conceptually) to prevent HTTP timeouts during heavy aggregation.

---

## 2. Complete API & Security Map

### 2.1 Access Constraints (DRF Permission Classes)
The system enforces strict Role-Based Access Control (RBAC) at the API routing layer:

| Module / Endpoint | Allowed Methods | DRF Permission Class | Authorized Roles |
| :--- | :--- | :--- | :--- |
| **Authentication** | | | |
| `/api/auth/register/` | POST | `AllowAny` | Unauthenticated users |
| `/api/auth/profile/me/` | GET, PATCH | `IsAuthenticated` | All Roles (Own data only) |
| **Patients** | | | |
| `/api/patients/patients/` | GET, POST | `IsStaffUser` | ADMIN, STAFF, DOCTOR, NURSE, DENTIST |
| `/api/patients/records/` | POST, PATCH | `MedicalRecordPermission`| DOCTOR, NURSE, DENTIST |
| **Medical Certificates**| | | |
| `/api/medical-certificates/` | GET, POST | `IsStaffOrMedicalPersonnel`| DOCTOR, NURSE |
| `/api/certificates/{id}/assess/`| POST | `IsDoctorUser` | DOCTOR (Approval Only) |
| **Health Info & Campaigns** | | | |
| `/api/health-info/campaigns/` | GET | `IsAuthenticated` | All Roles |
| `/api/health-info/campaigns/` | POST, PUT | `IsStaffOrReadOnly` | ADMIN, STAFF |
| **Feedback** | | | |
| `/api/feedback/submit/` | POST | `IsAuthenticated` | STUDENT, FACULTY |
| `/api/feedback/analytics/` | GET | `IsAdminOrStaff` | ADMIN, STAFF |
| **Reports** | | | |
| `/api/reports/generate/` | POST | `IsStaffOrReadOnly` | ADMIN, STAFF |

### 2.2 Security-at-Rest (`pgp_sym_encrypt` Signal Logic)
To comply with data privacy laws, sensitive fields are encrypted at the database level using PostgreSQL's `pgcrypto` extension. This bypasses Django's ORM plain-text memory overhead.

**Implementation (`backend/patients/signals.py` & `backend/authentication/signals.py`):**
```python
@receiver(post_save, sender=User)
def encrypt_sensitive_user_fields(sender, instance, **kwargs):
    # 1. Vendor-Aware Isolation: Prevent SQLite crashes during local dev
    if connection.vendor != 'postgresql':
        return
    
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key: return
    
    # 2. Raw SQL Injection for bytea casting
    with connection.cursor() as cursor:
        for field in ['illness', 'existing_medical_condition', 'allergies']:
            value = getattr(instance, field, None)
            if value:
                enc_col = f"{field}_enc"
                cursor.execute(
                    f"UPDATE authentication_user SET {enc_col} = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s",
                    [value, key, instance.id]
                )
```
*Note: A similar signal triggers for `MedicalRecord.diagnosis` and `Patient.first_name` / `last_name`.*

---

## 3. External Interfaces

### 3.1 Heroku Postgres
*   **Integration:** `dj_database_url` parses the Heroku-provided `DATABASE_URL` environment variable.
*   **Security:** `DATABASE_SSL_REQUIRE=True` is strictly enforced for production connections to Heroku.
*   **Performance:** Configured with `conn_max_age=600` and `ATOMIC_REQUESTS=True` to handle high clinical concurrency.

### 3.2 Cloudinary Media Storage
*   **Integration:** `cloudinary_storage` acts as the backend for Django's `ImageField` and `FileField`.
*   **Usage:** Automatically routes PubMats, Campaign Banners, and generated Report PDFs (`RawMediaCloudinaryStorage`) to the CDN for fast regional delivery.
*   **Fallback:** The system checks `USE_CLOUDINARY=True`. If `False`, it gracefully falls back to local FileSystem storage (crucial for local testing).

### 3.3 Gmail API Notifications
*   **Integration:** Replaces standard SMTP with `gmailapi_backend.mail.GmailBackend`.
*   **Authentication:** Utilizes OAuth 2.0 (`GMAIL_API_CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`) to prevent Google from blocking the server as a "less secure app".
*   **Workflow:** Used to dispatch OTP Verification Codes (MFA), Medical Certificate approvals, and 24-hour Feedback Reminders from `21100727@usc.edu.ph`.
