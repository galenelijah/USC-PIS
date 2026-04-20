# Security Architecture & Permissions Control (RBAC): USC-PIS
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)
**Compliance**: Data Privacy Act of 2012 (RA 10173)

---

## 1. Multi-Layered Access Control

### 1.1 Role-Based Access Control (RBAC) Matrix
The system utilizes 7 distinct roles to enforce strict data silos.

| Role | Classification | Permissions Scope |
| :--- | :--- | :--- |
| **ADMIN** | Administrative | Global configuration, user role approval, system-wide health monitoring, and data backups. |
| **DOCTOR** | Senior Medical | Full patient record management, clinical diagnosis, and **exclusive authority** for Medical Certificate approval. |
| **DENTIST** | Senior Medical | Specialized ISO/FDI dental charting, dental treatment logs, and dental-specific certificate issuance. |
| **NURSE** | Clinical Support | Patient vitals (BP, Temp, Pulse) capture, medication history updates, and draft record creation. |
| **STAFF** | Clinical Support | Administrative assistance, patient onboarding, and generating non-sensitive reports. |
| **TEACHER** | Patient / User | Viewing personal medical history, requesting medical certificates, and receiving health alerts. |
| **STUDENT** | Patient / User | Viewing personal medical history, accessing educational campaigns, and receiving clinic updates. |

### 1.2 Administrative Gating & Privilege Escalation
To prevent unauthorized privilege escalation, the system implements a "Two-Step Identity Verification":
1.  **Registration**: All users default to a base role (**STUDENT**) upon registration.
2.  **Role Request**: Users with text-only emails (Faculty/Staff) MUST request professional access.
3.  **Admin Verification**: An ADMIN must review the request and manually assign the final professional role (e.g., DENTIST).
4.  **Safe List Exception**: Admins can pre-authorize specific email addresses in the `SafeEmail` table, allowing trusted personnel to bypass the gate and receive their professional role instantly.

---

## 2. Infrastructure & Application Security

### 2.1 Middleware-Level Protection
*   **HSTS (HTTP Strict Transport Security)**: Forces all browser communication over HTTPS for a duration of 1 year.
*   **CSP (Content Security Policy)**: Restricts resource loading (scripts, styles) to trusted USC and Cloudinary domains, mitigating Cross-Site Scripting (XSS).
*   **Email Verification Gateway**: A custom Django middleware (`EmailVerificationMiddleware`) intercepting all requests to clinical endpoints, returning a `403 Forbidden` if the user has not completed the 6-digit MFA process.

### 2.2 Domain Lockdown
*   **strict_email_validator**: Ensures that registration is impossible without a `@usc.edu.ph` domain, protecting the system from external bot registration or unauthorized access.

---

## 3. Data Privacy & PHI Protection

### 3.1 Advanced Column-Level Encryption
Following the principle of "Privacy by Design," all Personal Health Information (PHI) is encrypted at the database layer using **PostgreSQL pgcrypto**.
*   **Mechanism**: AES-256 symmetric encryption.
*   **Key Isolation**: The encryption key is stored in the server environment, isolated from the database and the source code.
*   **Encrypted Fields**: Vitals, Diagnoses, Clinical Notes, Allergies, and Dental Charts.

### 3.2 Secure Blob Storage (Media)
*   **SHA-256 Hashing**: All files uploaded to the system (X-rays, IDs) are renamed with a unique SHA-256 hash based on content.
*   **Access Control**: Production files are hosted on Cloudinary with restricted access headers, ensuring images cannot be scraped or accessed via public URL guessing.

---

## 4. Communication Privacy
*   **Email Administration Control**: A global kill-switch provides the ability to stop all automated outgoing communications during security incidents or maintenance.
*   **Granular Routing**: Admins can exclude specific users from receiving sensitive notifications (e.g., silencing an admin who is not involved in role approvals), reducing the exposure of internal system alerts.
