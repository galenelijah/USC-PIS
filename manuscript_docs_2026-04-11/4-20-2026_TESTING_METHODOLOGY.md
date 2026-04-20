# Testing Methodology & Quality Assurance: USC-PIS
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)

---

## 1. Testing Framework Overview
The USC-PIS underwent a rigorous, multi-tiered testing strategy to ensure clinical accuracy and data security.

### 1.1 Tiers of Verification
*   **Tier 1: Unit Testing (Backend).** Validation of individual Django models and utility functions (e.g., FDI tooth number validators).
*   **Tier 2: API Integration Testing.** Testing of REST endpoints using `Postman` and `pytest-django`, ensuring role-based permissions (RBAC) are correctly enforced.
*   **Tier 3: UI/UX User Acceptance Testing (UAT).** End-to-end testing of patient onboarding and medical record entry using various roles (Student, Doctor, Admin).

---

## 2. Security & Privacy Validation

### 2.1 Encryption Verification (pgcrypto)
*   **Method**: Direct Database Inspection.
*   **Test Case**: Inspect the `patients_patient` table after a save operation.
*   **Success Condition**: Fields such as `allergies` must show as binary blobs (`bytea`), and plaintext values MUST NOT be visible in any SQL log or dump.

### 2.2 privilege Escalation Gating
*   **Test Case**: Attempting to register as a "Doctor" via the frontend API without an entry in the Safe List.
*   **Success Condition**: The system MUST default the role to "STUDENT" and return a `403 Forbidden` if professional features are accessed before Admin approval.

---

## 3. Functional Testing Modules

### 3.1 Identity Management (IAM)
*   **Domain Lockdown**: Verified that registration fails for `@gmail.com` and `@yahoo.com`.
*   **MFA Reliability**: Verified that 6-digit codes expire after 15 minutes and fail if the token is reused.

### 3.2 Clinical Modules (CLIN)
*   **FDI Notation**: Verified that tooth #49 (invalid) is rejected by the serializer.
*   **Certificate Landscape Logic**: Verified that the generated PDF strictly adheres to the **ACA-HSD-04F** layout regardless of browser resolution.

### 3.3 System Communications (COMM)
*   **Global Kill-Switch**: Verified that with `GlobalEmailSettings.is_emails_enabled = False`, no emails are sent even if a high-priority health alert is triggered.
*   **Recipient Exclusions**: Verified that an admin added to the "Excluded Users" list for the `ROLE_REQUEST` event does not receive the notification email.

---

## 4. Reporting & Error Simulation
*   **Dependency Failure**: Simulated a missing `xhtml2pdf` dependency to ensure the system provides a clean, user-friendly error message rather than a 500 server crash.
*   **Concurrent Access**: Validated that multiple dentists can update the same tooth chart simultaneously without data corruption using PostgreSQL row-level locking.
