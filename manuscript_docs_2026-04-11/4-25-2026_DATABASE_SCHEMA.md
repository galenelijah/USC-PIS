# Database Schema & Data Integrity: USC-PIS (Final Audit)
**Date:** April 25, 2026
**Architecture:** Django-PostgreSQL ORM with pgcrypto extension

---

## 1. Security Architecture (pgcrypto)
The system implements military-grade column-level encryption for highly sensitive medical and personal data using the PostgreSQL `pgcrypto` extension. This ensures that even in the event of a database leak, patient confidentiality is maintained.

### 1.1 Encrypted Sensitive Fields
| Model | Logical Field | Storage Type | Database Column |
|-------|---------------|--------------|-----------------|
| User | Illness History | BinaryField | `illness_enc` |
| User | Medical Condition| BinaryField | `existing_medical_condition_enc` |
| User | Medications | BinaryField | `medications_enc` |
| User | Allergies | BinaryField | `allergies_enc` |
| User | Contact Number | BinaryField | `emergency_contact_number_enc` |
| User | Blood Type | BinaryField | `blood_type_enc` |
| Patient | First Name | BinaryField | `first_name_enc` |
| Patient | Last Name | BinaryField | `last_name_enc` |
| MedicalRecord| Diagnosis | BinaryField | `diagnosis_enc` |

### 1.2 Encryption Workflow
1.  **plaintext input:** User provides data via React frontend.
2.  **Signal Capture:** Django `post_save` signals (`backend/authentication/signals.py` and `backend/patients/signals.py`) capture the record.
3.  **pgcrypto Encryption:** The system executes a raw SQL `pgp_sym_encrypt()` call using a 256-bit symmetric key (`PGP_ENCRYPTION_KEY`).
4.  **Binary Storage:** The encrypted ciphertext is stored in the corresponding `_enc` column.

---

## 2. Updated Patient Model (patients/models.py)
*   **blood_type:** Added to the core User model to ensure centralized medical indexing.
*   **year_level:** Integrated with filtering logic to support 1st, 2nd, 3rd, and 4th-year student sorting.
*   **Constraints:**
    *   `unique_feedback_per_visit`: Ensures data integrity in student surveys.
    *   `Dental FDI Notation`: Regex enforcement for FDI World Dental Federation notation (e.g., "11,12,21").

---

## 3. Data Integrity Constraints
The system implements strict validation via `backend/patients/validators.py`:
*   **Blood Type Regex:** `^(A|B|AB|O)[\+\-]$`
*   **USC Domain Enforcement:** Mandatory `@usc.edu.ph` email validation for all student/faculty accounts.
*   **MFA Expiration:** Verification codes are hard-coded to expire after 10 minutes to prevent brute-force or delayed reuse.
