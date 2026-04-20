# Database Schema & Data Dictionary: USC-PIS
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)
**Architecture:** Django-PostgreSQL ORM with `pgcrypto` Encryption

---

## 1. Core Identity & Access Models

### 1.1 User (CustomUser)
The central identity model extending Django's `AbstractUser`.
*   **Authentication**: `email` (Primary Identifier/Username), `password` (Hashed).
*   **Role Management**:
    *   `role`: Current active role (ADMIN, DOCTOR, DENTIST, NURSE, STAFF, STUDENT, TEACHER).
    *   `requested_role`: Stores a pending professional role request awaiting Admin approval.
*   **Status Flags**: `is_verified` (MFA status), `completeSetup` (Onboarding status), `is_active`, `is_staff`, `is_superuser`.
*   **Profile Metadata**: `id_number`, `course`, `year_level`, `department`, `birthday`, `sex`, `phone`.

### 1.2 Access Control & Verification
*   **SafeEmail**: A whitelist for trusted users.
    *   `email`: The authorized USC email address.
    *   `role`: The **Pre-Authorized Role** assigned automatically upon registration.
*   **VerificationCode**: Manages 6-digit MFA tokens.
    *   `code`: 6-digit numeric string.
    *   `expires_at`: 15-minute expiration window.

---

## 2. Clinical Data Models (PHI)

### 2.1 Patient Profile
One-to-One relationship with `User`. Stores the persistent clinical identity.
*   **Demographics**: `first_name`, `last_name`, `date_of_birth`, `gender`, `address`.
*   **Sensitive History (pgcrypto Encrypted)**: `allergies_enc`, `illness_enc`, `medications_enc`, `emergency_contact_number_enc`.

### 2.2 MedicalRecord
Visit-based log for general medical consultations.
*   **Vitals (JSON)**: Stores `temperature`, `blood_pressure`, `pulse_rate`, `respiratory_rate`.
*   **Clinical Data (pgcrypto Encrypted)**: `diagnosis_enc`, `treatment_enc`, `notes_enc`.
*   **Physical Exam (JSON)**: Structured findings for various body systems.

### 2.3 DentalRecord
Specialized model for oral health tracking, adhering to ISO/FDI standards.
*   **Procedure**: Type-safe selection (e.g., `EXTRACTION`, `PROPHYLAXIS`).
*   **Tooth Chart (JSON)**: Maps FDI tooth numbers (11-48) to conditions (e.g., `CARIES`, `MISSING`).
*   **Clinical Details**: `gum_condition`, `oral_hygiene_status`, `anesthesia_used`.
*   **Urgency**: `priority` level (URGENT, HIGH, MEDIUM, LOW).

### 2.4 Consultation
Lightweight model for outpatient interactions and preliminary screenings.
*   **Fields**: `chief_complaints` (Encrypted), `treatment_plan`, `remarks`.

---

## 3. Communication & Administration Models

### 3.1 Email Administration
*   **GlobalEmailSettings**: Singleton model controlling the system-wide email state.
    *   `is_emails_enabled`: Global toggle for all automated notifications.
*   **SystemEmailConfiguration**: Logic for event-based routing.
    *   `event_type`: (e.g., `ROLE_REQUEST`, `MEDICAL_CERTIFICATE_APPROVED`).
    *   `template`: ForeignKey to `NotificationTemplate`.
    *   `target_roles`: JSON list of default recipient roles.
    *   `included_users` / `excluded_users`: Many-to-Many links for granular recipient overrides.

### 3.2 Notifications & Campaigns
*   **Notification**: Tracks individual alerts (In-App/Email).
*   **NotificationTemplate**: Reusable HTML/Text templates with dynamic variables.
*   **NotificationCampaign**: Manages mass outreach with `total_recipients`, `read_count`, and `engagement_rate` tracking.

### 3.3 System Utilities
*   **BackupStatus**: Logs automated PostgreSQL database snapshots.
*   **HealthMetric**: Real-time snapshots of CPU, Memory, and DB Latency.

---

## 4. Data Security Implementation
*   **Encryption Type**: AES-256 via PostgreSQL `pgcrypto`.
*   **Key Management**: The encryption key is managed as an environment variable (`PGP_ENCRYPTION_KEY`), never stored in the database.
*   **Integrity**: Use of Django `transaction.atomic()` for all clinical writes ensures that patient records and their corresponding user profiles remain synchronized.
