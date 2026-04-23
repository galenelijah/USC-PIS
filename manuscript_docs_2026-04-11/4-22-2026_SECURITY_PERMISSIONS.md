# Security Architecture & Permissions Control (RBAC): USC-PIS
**Date:** April 22, 2026
**Version:** 3.2.0 (Enhanced Document Management)
**Compliance**: Data Privacy Act of 2012 (RA 10173)

---

## 1. Multi-Layered Access Control

### 1.1 Standardized Role Matrix
The system enforces strict access control through a standardized role hierarchy. All backend logic is synchronized using uppercase constants (e.g., `User.Role.ADMIN`) to eliminate authorization bypasses.

| Role | Classification | Permissions Scope |
| :--- | :--- | :--- |
| **ADMIN** | Administrative | Global configuration, security monitoring, and backup authority. |
| **DOCTOR / DENTIST** | Senior Medical | Full clinical management and certificate approval authority. |
| **NURSE** | Clinical Support | Patient vitals, triage records, and clinical support actions. |
| **STAFF** | Administrative | Patient onboarding, general reporting, and document uploads. |
| **FACULTY / STUDENT** | Patient (End-user) | Read-only access to personal history and uploaded documents. |

### 1.2 Administrative Gating
*   **Default Deny**: New registrations default to `STUDENT` status.
*   **Professional Onboarding**: Professional roles require administrative approval.
*   **Safe List Pre-Authorization**: Trusted emails can be pre-authorized for immediate clinical access.

---

## 2. Infrastructure & Communication Security

### 2.1 Staff Notification Privacy & Controls
*   **Channel Silos**: Individual toggles for **In-App**, **Email**, and **Desktop** alerts per professional user.
*   **Automated Inclusion**: The system ensures all non-student users are enrolled in the notification system.

### 2.2 Diagnostic Security
The **7-Point Health Audit** serves as a real-time security monitor:
*   **SSL/HSTS Validation**: Continuous verification of encryption-in-transit.
*   **Authentication Monitor**: Real-time checking of external provider (AWS SES/Cloudinary) credentials.
*   **Performance Guardians**: Monitoring of rate-limiting middleware.

---

## 3. Data Privacy & PHI Protection

### 3.1 PostgreSQL pgcrypto Encryption
*   **Clinical Encryption**: All medical data (diagnoses, vitals, dental charts) is encrypted at rest using AES-256 via the `pgcrypto` extension.
*   **Permission-Based Decryption**: Data is only decrypted for users with `IsMedicalStaff` or `IsOwner` permissions.

### 3.2 Patient Document Security (New)
*   **Upload Restriction**: Only users with roles `ADMIN`, `STAFF`, `DOCTOR`, `DENTIST`, or `NURSE` can upload files to a patient profile.
*   **Read Isolation**: Patients (Students/Facultys) can only see documents where the `patient` field matches their own profile.
*   **Integrity Enforcement**: Documents are linked to both the `patient` and the `uploaded_by` (Staff) for full accountability.

---

## 4. Audit & Accountability
*   **System Activity Logs**: Every administrative action (email triggers, configuration changes, role approvals, file uploads) is recorded in a timestamped audit trail.
*   **Log Integrity**: Logs are immutable and visible only to `ADMIN` and authorized `STAFF`.
*   **Composite IDs**: Implementation of a `TYPE-ID` prefixing strategy ensures that record IDs are unique across different database tables, preventing data cross-talk in unified patient views.
