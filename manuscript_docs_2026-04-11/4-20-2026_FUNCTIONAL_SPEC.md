# Functional Requirements Mapping: USC-PIS
**Date:** April 20, 2026
**Subject:** Code-to-Requirement Traceability (Revision 2.3.0)

---

## 1. Authentication & Identity Management
*   **Module:** `backend/authentication/`
*   **Heuristic Detection:** `UserRegistrationSerializer._determine_role_from_email` uses regex `/\d/` to separate students from faculty/staff.
*   **Role Selection:** `update_user_role` in `user_management_views.py` allows `STUDENT` users to self-identify their professional role post-verification.
*   **Domain Lockdown:** `strict_email_validator` in `validators.py` enforces the `@usc.edu.ph` requirement.

## 2. Clinical Data & Security
*   **Module:** `backend/patients/`
*   **Medical Records:** Captures vitals and encrypted clinical notes. Logic found in `MedicalRecordViewSet`.
*   **Dental Records:** Implements FDI notation (11-48) with visual priority charts. Logic in `DentalRecordViewSet` and `validators.py`.
*   **Encryption (pgcrypto):** Django signals in `authentication/signals.py` and `patients/models.py` trigger raw SQL encryption on `post_save`.

## 3. Medical Certificates (ACA-HSD-04F)
*   **Module:** `backend/medical_certificates/`
*   **Workflow:** Staff-initiated drafts $\rightarrow$ Doctor-only fitness assessment $\rightarrow$ PDF export.
*   **Fitness Status:** `MedicalCertificate.fitness_status` (Fit / Not Fit) is a mandatory field for approval.
*   **Template Rendering:** `xhtml2pdf` maps database objects to a landscape HTML/CSS template located in `templates/medical_certificates/`.

## 4. Notifications & Engagement
*   **Module:** `backend/notifications/`
*   **Multi-Channel:** `tasks.py` handles asynchronous delivery for Email (Gmail API) and In-App alerts.
*   **Engagement Tracking:** `HealthCampaign.increment_view_count()` and `engage()` methods track user interaction with educational materials.

## 5. Advanced Reporting & Analytics
*   **Module:** `backend/reports/`
*   **Dispatcher:** `ReportDispatcher` handles varied export logic for visit trends, patient summaries, and feedback analytics.
*   **Formatters:** Supports `.xlsx` (XLSXWriter) and `.pdf` (xhtml2pdf).
*   **Automation:** `ReportSchedule` model manages automated background generation via Celery beat.

## 6. Feedback & Satisfaction
*   **Module:** `backend/feedback/`
*   **Survey Automation:** Logic in `services.py` triggers feedback requests 24 hours after a visit is recorded.
*   **Analytics:** `FeedbackAnalyticsViewSet` provides aggregated star ratings and courtesy metrics for the admin dashboard.

## 7. System Utilities
*   **Module:** `backend/utils/`
*   **Health Checks:** `HealthChecker` class in `health_checks.py` monitors DB connectivity and external API status.
*   **Backups:** `backup_views.py` manages PostgreSQL dumps and automated schedules.
