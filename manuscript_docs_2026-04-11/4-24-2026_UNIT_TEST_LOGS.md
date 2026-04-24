# Unit Test Execution Logs: Full-Spectrum Validation
**Date:** April 24, 2026
**Environment:** Local Development (PostgreSQL 16)
**Script:** `backend/authentication/tests_unit_complete.py`

---

## 1. Test Execution Summary

| Test ID | Module | Description | Result |
| :--- | :--- | :--- | :--- |
| **UT-01** | Auth | pgcrypto Encryption Audit | **PASS** |
| **UT-02** | Auth | Domain & Role Initialization | **PASS** |
| **UT-03** | Auth | Safe List MFA Bypass | **PASS** |
| **UT-04** | Patients | Dental Record Field Constraints | **PASS** |

---

## 2. Detailed Log Output

### 2.1 Encryption Audit (UT-01)
*   **Input**: `allergies="Penicillin"`
*   **Operation**: User save triggered `pgp_sym_encrypt` signal.
*   **Raw SQL Query**: `SELECT allergies_enc FROM authentication_user WHERE email='...'`
*   **Observation**: Field returned as `<memoryview at 0x...>` (Binary Hash). Plaintext check returned `False`.
*   **Result**: Data is stored securely as an encrypted hash.

### 2.2 Domain & Role Validation (UT-02)
*   **Input**: `21100727@usc.edu.ph`
*   **Validation**: `regex=@usc.edu.ph` -> Match Found.
*   **Heuristic**: `contains_digits=True` -> Role Assigned: `STUDENT`.
*   **Input**: `student@gmail.com`
*   **Validation**: `regex=@usc.edu.ph` -> No Match.
*   **Observation**: Threw `ValidationError: Must be a valid USC email address`.

### 2.3 Safe List Bypass (UT-03)
*   **Input**: `safe.doctor@usc.edu.ph` (Present in SafeEmail table)
*   **Observation**: `is_verified` attribute automatically set to `True` upon registration. Verification code email suppressed.

### 2.4 Dental Constraints (UT-04)
*   **Input**: `oral_hygiene_status='EXCELLENT'`, `priority='LOW'`
*   **Validation**: `full_clean()` pass.
*   **Input**: `oral_hygiene_status='INVALID'`
*   **Validation**: `ValidationError: Value 'INVALID' is not a valid choice`.
