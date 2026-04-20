# Database Schema & Data Integrity: USC-PIS
**Date:** April 11, 2026
**Architecture:** Django-PostgreSQL ORM

---

## 1. Core Models & Relationships

### 1.1 Authentication & User Profiles
*   **User (CustomUser):** Extends `AbstractUser`. Stores `role`, `id_number`, `course`, `year_level`, and `is_verified`.
*   **Patient:** One-to-One relationship with `User`. Stores static clinical data (Sex, Birthday, Blood Type).
    *   *Self-Healing:* If a user completes setup but lacks a `Patient` profile, the system auto-generates it (`backend/patients/views.py:dashboard_stats`).

### 1.2 Clinical Records
*   **MedicalRecord:** ForeignKey to `Patient`. Stores vitals and encrypted clinical data.
*   **DentalRecord:** ForeignKey to `Patient`. Uses `tooth_numbers` (FDI) and `priority` choices.
*   **Consultation:** Captures `chief_complaints` and `treatment_plan`.

### 1.3 Supporting Modules
*   **HealthCampaign:** Tracks `view_count` and `engagement_count`.
*   **Feedback:** Linked to `Patient` and optionally `MedicalRecord` (visit-specific).
*   **Notification:** Polymorphic-style model with `NotificationTemplate` for standardization.

---

## 2. Data Integrity Mechanisms

### 2.1 Unique Constraints & Validators
*   **Duplicate Detection:** `duplicate_detector.py` in the patients app uses fuzzy matching (Name + DOB) to prevent duplicate patient profiles.
*   **Feedback Logic:** `UniqueConstraint` in `feedback/models.py` ensures a patient can only provide one feedback entry per clinical visit.
*   **File Security:** SHA-256 checksums in `UploadedFile` prevent redundant storage of identical files.

### 2.2 Relational Integrity
*   **Cascading Deletes:** `on_delete=models.CASCADE` is used for child records (e.g., MedicalRecord), while `on_delete=models.SET_NULL` is used for audit fields (e.g., `created_by`) to preserve historical data.
*   **Atomic Transactions:** Critical operations (Patient creation, Certificate approval) are wrapped in `transaction.atomic()` to prevent partial data corruption.

### 2.3 Automated Data Mapping
The system includes utility mappings (`utils/usc_mappings.py`) to convert internal codes (e.g., `BSCE`) into full descriptive program names (e.g., `Bachelor of Science in Civil Engineering`) for all official document exports.
