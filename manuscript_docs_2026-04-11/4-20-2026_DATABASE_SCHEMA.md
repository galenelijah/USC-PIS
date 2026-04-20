# Database Schema & Data Integrity: USC-PIS
**Date:** April 20, 2026
**Architecture:** Django-PostgreSQL ORM with `pgcrypto` Encryption

---

## 1. Core Models & Relationships

### 1.1 Authentication & User Profiles
*   **User (CustomUser):** The central identity model.
    *   **Fields:** `email` (unique), `role`, `id_number`, `is_verified`, `completeSetup`.
    *   **Role Choices:** ADMIN, DOCTOR, DENTIST, NURSE, STAFF, STUDENT, TEACHER.
    *   **Specific Fields:** `course`/`year_level` (for Students), `department` (for Teachers/Staff).
*   **SafeEmail:** Whitelist for bypass verification and admin testing.
*   **VerificationCode:** Temporary 6-digit codes for MFA/verification.

### 1.2 Clinical Records
*   **Patient:** One-to-One with `User`. Stores long-term clinical profile data.
*   **MedicalRecord:** visit-based entries.
    *   **Fields:** `visit_date`, `vitals` (BP, Temp, Pulse), `diagnosis`, `treatment`.
*   **DentalRecord:** Specialized dental entries.
    *   **FDI Notation:** Uses JSON-based `tooth_chart` mapping tooth numbers (11-48) to specific conditions.
    *   **Priority:** Categorizes treatment urgency (Emergency, High, Medium, Low).
*   **Consultation:** General clinic visits with `chief_complaints` and `treatment_plan`.

### 1.3 Supporting Systems
*   **Notification:** Central log for in-app and email alerts.
    *   **Delivery Method:** EMAIL, IN_APP, BOTH.
    *   **Status:** PENDING, SENT, FAILED, READ.
*   **ReportTemplate:** Defines the structure for automated reports.
*   **GeneratedReport:** Stores metadata and storage links for exported files (PDF, XLSX).
*   **HealthCampaign:** Manages educational outreach. Tracks `view_count` and `engagement_count`.
*   **Feedback:** Visit-specific surveys tracking staff courtesy and facility ratings.

---

## 2. Data Security & Integrity

### 2.1 pgcrypto Symmetrical Encryption
Sensitive medical fields are encrypted at the database level.
*   **Encrypted Columns (bytea):** `illness_enc`, `allergies_enc`, `medications_enc`, `diagnosis_enc`, `clinical_notes_enc`.
*   **Encryption Signal:** `post_save` signals in `authentication` and `patients` apps handle the raw SQL encryption to ensure no plaintext PHI is stored.

### 2.2 Relational Integrity
*   **Unique Constraints:** Enforced on `email`, `id_number`, and visit-specific feedback.
*   **Cascading Logic:**
    *   `on_delete=models.CASCADE` for dependent clinical records.
    *   `on_delete=models.SET_NULL` for tracking fields to preserve audit trails.

### 2.3 Validation Layer
*   **FDI Validator:** Ensures dental records only reference valid ISO/FDI tooth numbers.
*   **USC Domain Lock:** Strict validator in the serializer level to enforce `@usc.edu.ph` registration.
*   **Checksum Verification:** SHA-256 hashing for all uploaded files to prevent data redundancy and ensure file integrity.

---

## 3. Storage Architecture
*   **Metadata:** PostgreSQL stores all structured data and file references.
*   **Blobs:** Large files (images, PDFs) are offloaded to Cloudinary/S3.
*   **Backups:** Daily automated PostgreSQL dumps managed via `backend/utils/backup_views.py`.
