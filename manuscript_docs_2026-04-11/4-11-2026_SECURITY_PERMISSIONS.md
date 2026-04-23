# RBAC & Security Logic: USC-PIS
**Date:** April 11, 2026
**Confidentiality:** High (Security Documentation)

---

## 1. Role-Based Access Control (RBAC)
The system defines 7 distinct roles managed in `authentication/models.py` (`User.Role` class).

### 1.1 Permission Matrix
| Role | Access Level | UI Visibility |
| :--- | :--- | :--- |
| **ADMIN** | Full Access | All Menus + User Management + Database Monitor |
| **STAFF / DOCTOR / DENTIST** | Medical Management | Patients, Records, Certificates, Reports, Campaigns |
| **NURSE** | Clinical Support | Patients, Vital Signs, Record Entry, Inventory |
| **STUDENT / FACULTY** | Patient Access | Self-Records, Certificate Requests, Campaigns |

### 1.2 View-Level Enforcement
Permissions are enforced at the API level in `backend/patients/views.py` using role checks within `get_queryset` and `create/update` methods.
*   **Example:** `MedicalRecordPermission` ensures only creators or medical staff can edit clinical records.

---

## 2. Authentication & Domain Security

### 2.1 USC Domain Enforcement
*   **Validator:** `EnhancedEmailValidator` in `backend/authentication/validators.py`.
*   **Logic:** Rejects any registration where the email does not end in `@usc.edu.ph`.
*   **Safe List Bypass:** The `SafeEmail` model allows specific test accounts (e.g., `tester@gmail.com`) to bypass domain and verification checks for development/QA purposes.

### 2.2 Retroactive Verification Flow
1.  **Middleware:** `EmailVerificationMiddleware` in `backend/authentication/middleware.py` intercepts requests.
2.  **Blocker:** If `is_verified` is False, the user is redirected (via API 403) to the `/verify-email` page.
3.  **Bypass:** Superusers are automatically marked as verified and bypass this check.

---

## 3. Data Integrity & Privacy

### 3.1 Selective Encryption (PHI Protection)
*   **Key:** `PGP_ENCRYPTION_KEY` (stored in `.env`).
*   **Implementation:** `backend/authentication/signals.py` encrypts specific columns before they hit the database.
*   **Benefit:** Even with direct database access, sensitive health information remains unreadable without the encryption key.

### 3.2 Unique Constraints
*   **Feedback:** `unique_feedback_per_visit` constraint in `feedback/models.py` prevents duplicate entries for the same clinical visit.
*   **Certificates:** Prevents overlapping validity dates for the same patient.
