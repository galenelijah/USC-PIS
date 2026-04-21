# Security Architecture & Permissions Control (RBAC): USC-PIS
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)
**Compliance**: Data Privacy Act of 2012 (RA 10173)

---

## 1. Multi-Layered Access Control

### 1.1 Standardized Role Matrix
The system enforces strict access control through a standardized role hierarchy. All backend logic is synchronized using uppercase constants (e.g., `User.Role.ADMIN`) to eliminate authorization bypasses caused by string case mismatches.

| Role | Classification | Permissions Scope |
| :--- | :--- | :--- |
| **ADMIN** | Administrative | Global configuration, security monitoring, and backup authority. |
| **DOCTOR / DENTIST** | Senior Medical | Full clinical management and certificate approval authority. |
| **NURSE** | Clinical Support | Patient vitals, triage records, and clinical support actions. |
| **STAFF** | Administrative | Patient onboarding, general reporting, and email administration. |
| **TEACHER / STUDENT** | Patient (End-user) | Read-only access to personal history and campaign engagement. |

### 1.2 Administrative Gating
*   **Default Deny**: New registrations default to `STUDENT` status.
*   **Professional Onboarding**: Professional roles require submission of a Role Upgrade Request, which must be manually verified and approved by an `ADMIN`.
*   **Safe List Pre-Authorization**: Trusted emails can be pre-authorized to bypass the gating process for immediate clinical access.

---

## 2. Infrastructure & Communication Security

### 2.1 Staff Notification Privacy & Controls
A new granular control layer for staff communications ensures that clinical personnel only receive relevant notifications.
*   **Channel Silos**: Individual toggles for **In-App**, **Email**, and **Desktop** alerts per professional user.
*   **Automated Inclusion**: The system ensures all non-student users are enrolled in the notification system, preventing communication gaps in critical clinical workflows.
*   **Recipient Masking**: Sensitive system logs mask user PII while maintaining auditability for administrators.

### 2.2 Diagnostic Security
The **7-Point Health Audit** serves as a real-time security monitor:
*   **SSL/HSTS Validation**: Continuous verification of encryption-in-transit.
*   **Authentication Monitor**: Real-time checking of external provider (AWS SES/Cloudinary) credentials.
*   **Performance Guardians**: Monitoring of rate-limiting middleware to prevent Brute-Force and DoS attacks.

---

## 3. Data Privacy & PHI Protection

### 3.1 PostgreSQL pgcrypto Encryption
*   **Clinical Encryption**: All medical data (diagnoses, vitals, dental charts) is encrypted at rest using AES-256 via the `pgcrypto` extension.
*   **Permission-Based Decryption**: Data is only decrypted within the logic layer for users with `IsMedicalStaff` or `IsOwner` permissions.

### 3.2 Secure Blob Handling
*   **Content-Based Hashing**: Files are hashed to prevent ID guessing and collisions.
*   **Cloud Isolation**: Media assets are isolated in a restricted Cloudinary environment with secure delivery configurations.

---

## 4. Audit & Accountability
*   **System Activity Logs**: Every administrative action (email triggers, configuration changes, role approvals) is recorded in a timestamped audit trail.
*   **Log Integrity**: Logs are immutable and visible only to `ADMIN` and authorized `STAFF`.
