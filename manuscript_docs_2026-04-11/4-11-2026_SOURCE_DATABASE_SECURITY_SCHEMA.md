# SOURCE DOCUMENT: Database and Security Architecture Deep-Dive - USC-PIS
**Date:** April 11, 2026
**Target AI Task:** Generate Technical Appendices, Security Audits, or Database Schema diagrams.

---

## 1. Data Encryption (pgcrypto)
The system implements Enterprise-Grade Security via the PostgreSQL `pgcrypto` extension.

### 1.1 Encryption Trigger
Encryption is handled via a Django `post_save` signal located in `backend/authentication/signals.py`. 
*   **Method:** Symmetric encryption (AES-256).
*   **Key Source:** `PGP_ENCRYPTION_KEY` environment variable.
*   **Encrypted Fields:** 
    *   `illness`
    *   `allergies`
    *   `medications`
    *   `existing_medical_condition`
    *   `emergency_contact_number`

---

## 2. Core Database Relationships (ERD Concepts)

*   **User $\rightarrow$ Patient (1:1):** Every verified USC user is linked to a unique clinical patient profile.
*   **Patient $\rightarrow$ MedicalRecord (1:N):** A student maintains a lifetime history of clinical visits.
*   **MedicalRecord $\rightarrow$ Feedback (1:1):** Ensures visit-specific evaluation for clinic quality control.
*   **Patient $\rightarrow$ MedicalCertificate (1:N):** Tracks all issued health clearances and their validity periods.

---

## 3. Security Middleware Stack
The application employs a custom middleware stack (`backend/backend/settings.py`) to prevent common web vulnerabilities:

1.  **SecurityHeadersMiddleware:** Enforces HSTS (HTTP Strict Transport Security) and Content Security Policy (CSP).
2.  **EmailVerificationMiddleware:** Hard-blocks any user with `is_verified=False` from accessing clinical endpoints, even if they have a valid login token.
3.  **RateLimitMiddleware:** Prevents brute-force attacks by limiting login attempts to 5 per 15-minute window.

---

## 4. Data Integrity Constraints
*   **SHA-256 Checksums:** Applied to all medical file uploads (X-rays, certificates) to prevent storage of redundant or duplicate files.
*   **UniqueConstraints:** Implemented in the Feedback model to ensure a student cannot submit multiple evaluations for the same clinic visit.
*   **Fuzzy Matching:** Used in the Patient validator to detect potential duplicate profiles during registration using Name + DOB similarity.
