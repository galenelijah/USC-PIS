# Security Architecture & Permissions Control (RBAC): USC-PIS
**Date:** April 23, 2026
**Version:** 3.3.0 (Hardened Document Security)
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

---

## 2. Infrastructure & Communication Security

### 2.1 Staff Notification Privacy & Controls
*   **Channel Silos**: Individual toggles for **In-App**, **Email**, and **Desktop** alerts per professional user.
*   **Automated Inclusion**: The system ensures all non-student users are enrolled in the notification system.

### 2.2 Diagnostic Security
The **7-Point Health Audit** serves as a real-time security monitor:
*   **SSL/HSTS Validation**: Continuous verification of encryption-in-transit.
*   **Authentication Monitor**: Real-time checking of external provider credentials.

---

## 3. Data Privacy & PHI Protection

### 3.1 PostgreSQL pgcrypto Encryption
*   **Clinical Encryption**: All medical data (diagnoses, vitals, dental charts) is encrypted at rest using AES-256 via the `pgcrypto` extension.
*   **Permission-Based Decryption**: Data is only decrypted for users with `IsMedicalStaff` or `IsOwner` permissions.

### 3.2 Secure Document Retrieval (Hardened)
*   **URL Masking**: Patient document serializers now treat the storage `file` field as `write_only`. This ensures raw Cloudinary URLs are never leaked in API responses.
*   **Authenticated Download Proxy**: Documents are accessed via a secure endpoint (`/api/files/patient-documents/{id}/download/`). 
*   **Backend-to-Storage Auth**: The backend uses official Cloudinary API signatures and isolated sessions to fetch files, ensuring that even if a public link were discovered, it would be subject to expiration and signature validation.
*   **Privacy Isolation**: Patients (Students/Facultys) can only trigger the download proxy for documents where they are the verified owner.

---

## 4. Audit & Accountability
*   **System Activity Logs**: Every administrative action (email triggers, configuration changes, role approvals, file uploads) is recorded in a timestamped audit trail.
*   **Composite IDs**: Implementation of a `TYPE-ID` prefixing strategy ensures that record IDs are unique across different database tables, preventing data cross-talk in unified patient views.
*   **Download Enforcement**: The system forcefully injects `Content-Disposition: attachment` headers, ensuring sensitive PHI is downloaded to the local device rather than cached in browser preview states.
