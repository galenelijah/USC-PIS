# USC-PIS Feature Workflows & Technical Implementation
**Source:** Audit Session April 26, 2026

This document provides the definitive mapping of the USC-DC Patient Information System features to their technical workflows, backend logic, and verified audit status.

---

## 1. Clinical Management Features

### 1.1 Comprehensive Health Records
- **Implementation:** `backend/patients/models.py` -> `MedicalRecord`
- **Workflow:** Nurse captures Vitals -> Doctor enters Diagnosis -> System generates binary encrypted hash.
- **Verification:** IT-01 (End-to-End Clinical Pipeline) verified the workflow from registration to diagnosis.

### 1.2 Comprehensive Dental Records
- **Implementation:** `backend/patients/models.py` -> `DentalRecord`
- **Workflow:** Supports FDI notation (11-48) for specific tooth conditions and streamlined "Consultation Only" mode for rapid data entry.
- **Logic:** `DentalRecordViewSet` validates tooth numbers via regex and FDI range checks.

### 1.3 Medical Certificate Optimization
- **Implementation:** `backend/medical_certificates/views.py`
- **Workflow:** Nurse verifies student fitness -> Doctor electronically signs -> PDF rendered via `pisa` or fallback.
- **Audit Result (PT-01):** Generation Latency = **122.93ms**.

---

## 2. Communication & Awareness

### 2.1 Health Information Dissemination (Campaigns)
- **Implementation:** `backend/health_info/models.py` -> `HealthCampaign`
- **Workflow:** Admin creates PubMat -> System categorizes as Student/Faculty/Universal -> Alert appears on target dashboard.
- **Verification:** IT-05 (Campaign Dissemination) verified visibility in Student feed.

### 2.2 Automated Notifications
- **Implementation:** `backend/notifications/models.py` -> `Notification`
- **Logic:** Triggered by `post_save` signals in `patients/signals.py`.
- **Workflow:** Medical/Dental visit -> Immediate Email -> 24-hour follow-up reminder for feedback.

### 2.3 Patient Feedback Collection
- **Implementation:** `backend/feedback/models.py` -> `Feedback`
- **Workflow:** Visit completed -> User receives notification -> Submits Likert-scale survey -> Admin views real-time analytics.

---

## 3. Core Infrastructure & Security

### 3.1 User Authentication & RBAC
- **Implementation:** `backend/authentication/models.py` -> `CustomUser`
- **Logic:** Role-Based Access Control (RBAC) enforced via DRF `PermissionClasses` (IsDoctor, IsNurse, IsStaff).
- **Workflow:** Login -> JWT Token issued -> Requests gated by role-level permissions.

### 3.2 SafeList Registration (Fast Pass)
- **Implementation:** `SafeEmail` table logic in `authentication/views.py`.
- **Workflow:** Pre-authorized email registration -> Bypasses default MFA -> Automatic assignment of professional roles (DOCTOR/NURSE).

### 3.3 Secure Data Storage (pgcrypto)
- **Implementation:** PostgreSQL `pgp_sym_encrypt` triggered by Django signals.
- **Verification:** UT-01 confirmed PII/PHI is stored as ciphertext, unreachable via standard SQL without the symmetric key.

### 3.4 Upload Files (Security Hardened)
- **Implementation:** `patients/validators.py` and IT-06.
- **Logic:** Strict extension allow-list (PDF, JPG, PNG). Rejects High-Risk types (EXE, JS, PY).
- **Audit Result (UT-06):** 100% rejection of malicious scripts.

---

## 4. Performance & Scalability

### 4.1 Data-Driven Reporting (Academic Year Filter)
- **Implementation:** `PatientViewSet` query params (`year_level`, `academic_year`).
- **Workflow:** Nurse filters by "4th Year" -> API returns targeted student group for registration clearing.

### 4.2 Scalability (Concurrency Benchmarking)
- **Audit Result (PT-02):** Successfully handled **20 concurrent requests in 0.66s** with 0% data loss.
- **Search Latency (PT-04):** Search results returned in **127.81ms** for a database of 100+ patients.
