# RBAC & Security Logic: USC-PIS
**Date:** April 20, 2026
**Revision:** 2.3.0 (Security & Permissions Audit)

---

## 1. Role-Based Access Control (RBAC)
The system defines 7 distinct roles managed in `authentication/models.py`.

### 1.1 Permission Matrix (Revised)
| Role | Access Level | Key Permissions |
| :--- | :--- | :--- |
| **ADMIN** | System-Wide | User Management, Backups, System Health, DB Monitor |
| **DOCTOR / DENTIST** | Senior Medical | Full Record CRUD, **Certificate Fitness & Approval**, Analytics |
| **STAFF / NURSE** | Clinical Support | Patient Onboarding, Vitals, Certificates (Draft only), Reports |
| **TEACHER / STUDENT** | Patient Role | View Self-Records, Request Certificates, View Campaigns |

### 1.2 View-Level Enforcement (API Tier)
Permissions are enforced using custom DRF Permission classes:
*   **IsMedicalStaff:** Limits clinical CRUD to ADMIN, DOCTOR, DENTIST, NURSE, and STAFF roles.
*   **CanApproveCertificate:** Strictly limited to DOCTOR and DENTIST roles.
*   **IsOwnerOrMedicalStaff:** Allows patients to view their own records while giving medical staff full access.

---

## 2. Authentication & Identity Hardening

### 2.1 Domain & Role Heuristics
*   **Domain Lock:** Strict `@usc.edu.ph` requirement in `strict_email_validator`.
*   **Heuristic Role Detection:** Regex `/\d/` in email username separates Student IDs from Faculty/Staff names.
*   **Role Selection Workflow:** Post-verification, `STUDENT` users with text-based emails are redirected to `/role-selection`.
    *   **Self-Service:** Allowed ONLY for the `TEACHER` (Patient) role.
    *   **Administrative Gate:** Professional roles (STAFF, DOCTOR, NURSE, DENTIST) require an administrator to manually update the account via the `User Management` panel.

### 2.2 6-Digit Verification (MFA-Light)
*   **Mechanism:** `VerificationCode` model generates time-limited codes.
*   **Middleware:** `EmailVerificationMiddleware` enforces a strict 403 block on all unverified accounts, directing them to the verification UI.

---

## 3. Data Privacy (PHI Protection)

### 3.1 PostgreSQL pgcrypto
The system utilizes symmetric encryption for sensitive columns:
*   **Encrypted Fields:** `illness`, `allergies`, `medications`, `diagnosis`, `clinical_notes`.
*   **Decryption:** Handled at the application level via raw SQL queries in specific service methods, ensuring plaintext PHI is only ever present in memory during request processing.

### 3.2 File Security & Deduplication
*   **Hashing:** All clinical and campaign uploads are hashed (SHA-256).
*   **Storage:** Stored in secure, non-public Cloudinary buckets or local hashed directories.

---

## 4. Audit & Integrity
*   **Notification Logs:** Every system-generated email is logged in `EmailLog` for administrative auditing.
*   **Backup Integrity:** Automated daily snapshots of the encrypted PostgreSQL database ensure disaster recovery readiness without exposing plaintext PHI in backups.
