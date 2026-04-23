# Database Schema & Data Dictionary: USC-PIS
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)
**Architecture:** Django-PostgreSQL ORM with `pgcrypto` Encryption

---

## 1. Authentication & Security Models

### 1.1 CustomUser
Extends Django's `AbstractUser`. Acts as the central identity for the application.
*   **Role Constants**: `ADMIN`, `DOCTOR`, `DENTIST`, `NURSE`, `STAFF`, `FACULTY`, `STUDENT`.
*   **Fields**: `email` (PK), `role`, `requested_role`, `is_verified` (MFA Status), `completeSetup`.

### 1.2 Access Control
*   **SafeEmail**: Pre-authorized email list (`email`, `role`) for role bypassing during registration.
*   **VerificationCode**: 6-digit MFA numeric tokens (`code`, `expires_at`).

---

## 2. Patient Records Models (PHI)

### 2.1 Patient
One-to-One link with `CustomUser`. Stores demographic and sensitive medical history.
*   **PHI Fields (pgcrypto Encrypted)**: `allergies_enc`, `illness_enc`, `medications_enc`, `emergency_contact_number_enc`.
*   **Context**: `department`, `course`, `year_level`.

### 2.2 Medical & Dental Records
*   **MedicalRecord**: Visit-based log containing vital signs (JSON), and encrypted `diagnosis_enc`, `treatment_enc`, and `notes_enc`.
*   **DentalRecord**: FDI tooth charting (JSON), `priority` urgency flags, and encrypted treatment logs.
*   **Consultation**: Lightweight model for screening notes (`chief_complaints_enc`, `treatment_plan`).

---

## 3. Health Information & Campaigns Models

### 3.1 Content Management
*   **HealthInformation**: Static health articles (`title`, `category`, `content`).
*   **HealthInformationImage**: One-to-many images mapped to HealthInformation.

### 3.2 Campaign Engine
*   **CampaignTemplate**: Reusable layouts for health outreach.
*   **HealthCampaign**: Active outreach events with `target_audience` and `status` (Draft, Published).
*   **CampaignResource**: Associated Cloudinary assets.
*   **CampaignFeedback**: Student interaction tracking (`is_helpful`, `read_status`).

---

## 4. Medical Certificates Models

### 4.1 Certificate Generation
*   **CertificateTemplate**: Layout definitions (e.g., ACA-HSD-04F).
*   **MedicalCertificate**: The actual issued certificate.
    *   **Fields**: `purpose`, `recommendations`, `valid_from`, `valid_until`.
    *   **Doctor Only**: `fitness_status` (Fit/Not Fit), `approval_status`, `fitness_reason`.

---

## 5. Notifications & Administration Models

### 5.1 User Preferences
*   **NotificationPreference**: Granular channel control (`email_notifications`, `in_app_notifications`, `desktop_notifications`).

### 5.2 System Configurations
*   **GlobalEmailSettings**: Singleton model for master system kill-switch.
*   **SystemEmailConfiguration**: Maps `event_type` to templates and role-based recipients.
*   **NotificationTemplate**: HTML/Text layouts with Django template variables.

### 5.3 Delivery Tracking
*   **Notification**: Specific alerts sent to users (`title`, `message`, `is_read`).
*   **NotificationLog**: Immutable audit trail of delivery success/failure.
*   **NotificationCampaign**: Mass broadcast management with `engagement_rate` tracking.

---

## 6. Feedback & Files

### 6.1 Feedback Management
*   **Feedback**: Post-visit surveys capturing `rating` (1-5), `staff_courteous` (Boolean), and `comments`.

### 6.2 File Handling
*   **UploadedFile**: Tracks Cloudinary uploads with `file_name`, `file_type`, and `file_size` validation.

---

## 7. Reporting & Analytics Models

### 7.1 Report Generation
*   **ReportTemplate**: Base HTML layouts for PDF generation.
*   **GeneratedReport**: Produced outputs (`report_type`, `date_range`, `status`, `file_url`).
*   **ReportSchedule**: Automated generation tasks (`frequency`, `recipients`).

### 7.2 Data Analytics
*   **ReportMetric** & **ReportChart**: Stored pre-calculated statistics for dashboard performance.
*   **ReportAnalytics**: Aggregate engagement tracking.

---

## 8. Infrastructure Utilities

### 8.1 System Health
*   **HealthMetric**: Real-time snapshots of the **7-Point Diagnostic Audit** results.
*   **BackupStatus**: Tracks PostgreSQL snapshots, execution time, and 7-day retention integrity.
*   **BackupSchedule**: Automated cron-like scheduling for database backups.

---

## 9. Security Implementation
*   **Encryption Standard**: AES-256 symmetric encryption via **pgcrypto** applied exclusively via logic-tier model managers to isolate plaintext from the database layer.
*   **Audit Trail**: High-criticality actions are captured with timestamp and user attribution within the `NotificationLog` and `BackupStatus` tables.