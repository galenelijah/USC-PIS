# Functional Specification: USC-PIS
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)

---

## 1. Module: Secure Identity & Access (IAM)

### 1.1 User Registration & Verification
*   **Workflow**: Users enter their USC email. The system validates the domain and generates a 6-digit MFA code via the Gmail API.
*   **Heuristic Logic**: The system identifies numeric usernames (e.g., `21...`) as `STUDENT` and alpha usernames (e.g., `elfabian`) as potential faculty/staff.
*   **Safe List Integration**: Pre-authorized emails in the `SafeEmail` list receive automatic role assignment upon first login.

### 1.2 Role-Based Selection & Gating
*   **Patient Roles**: Students and Teachers can self-complete their profiles and access clinical services immediately.
*   **Administrative Gate**: Professional roles (`STAFF`, `DOCTOR`, `DENTIST`, `NURSE`, `TEACHER`) require administrative approval. 
*   **Permissions Standardization**: Backend logic uses uppercase role constants (e.g., `User.Role.ADMIN`) for all queryset filtering and view access to ensure rigorous security.

---

## 2. Module: Clinical Management (CLIN)

### 2.1 Patient Onboarding
*   A 4-step wizard captures personal information, medical history, social history, and emergency contacts.
*   **Program Mapping**: Automatic conversion of Program IDs (e.g., "BSCE") to full academic titles for official documentation.

### 2.2 Medical & Dental Charting
*   **Vitals Tracking**: Interactive forms for BP, Pulse, and Temp with historical trend analysis.
*   **Dental FDI Chart**: Visual 2D tooth map for precise procedure logging.
*   **Encrypted Storage**: Clinical fields are encrypted using `pgcrypto` at the database level.

---

## 3. Module: Administrative Utilities (SYS)

### 3.1 Email & Notification Administration
*   **Master Control**: A global master switch to enable/disable all automated communications.
*   **Template Lifecycle**: Full CRUD (Create, Read, Update, Delete) for notification templates directly via the administrative interface.
*   **Static Reference**: Viewing capability for system-static templates (e.g., password resets) to ensure consistency.

### 3.2 Staff Access Management
*   **Channel Control**: Granular toggles for **In-App**, **Email**, and **Desktop** notifications for all professional staff members.
*   **Automated Inclusion**: The system identifies all non-student users and forces initialization of notification profiles to ensure no staff member is missed in communications.

---

## 4. Module: Infrastructure Diagnostics (DIAG)

### 4.1 7-Point Health Audit
The system performs real-time diagnostics across seven critical infrastructure pillars:
1.  **Database**: Connectivity and record retrieval latency.
2.  **Email System**: SMTP authentication and provider readiness.
3.  **Backup Engine**: Verification of successful snapshots in the last 7 days.
4.  **Security Shield**: Validation of SSL, HSTS, and production headers.
5.  **Performance**: Monitoring of rate-limiting and system responsiveness.
6.  **Cloud Storage**: Connectivity to persistent media storage (Cloudinary).
7.  **System Speed**: Health of the Redis/Cache layer.

### 4.2 Automated Alerts
*   **Thresholds**: Configurable alert levels (All, Warning, Critical).
*   **Trigger**: Automated management commands run via Heroku Scheduler every 6 hours.
