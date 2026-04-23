# Functional Requirements Mapping: USC-PIS
**Date:** April 11, 2026
**Subject:** Code-to-Requirement Traceability

---

## 1. Medical & Dental Records Management
### 1.1 Implementation Logic
*   **Module:** `backend/patients/`
*   **Models:** `Patient`, `MedicalRecord`, `DentalRecord`, `Consultation`.
*   **Data Retrieval:** `PatientViewSet.get_queryset` in `views.py` implements role-based filtering. 
    *   *Student/Faculty:* Filters by `user=self.request.user`.
    *   *Medical Staff:* Returns all patients categorized by `Student` or `Faculty` roles.
*   **Vitals Tracking:** `MedicalRecord` model explicitly captures `temperature`, `blood_pressure`, `pulse_rate`, and `respiratory_rate`.

## 2. Notification System
### 2.1 Implementation Logic
*   **Module:** `backend/notifications/`
*   **Trigger Mechanism:** `Notification.objects.create()` is triggered via signals (e.g., `health_campaign_notification` in `health_info/models.py`).
*   **Delivery Logic:** `backend/notifications/tasks.py` handles the asynchronous dispatch of emails using the `EmailService` utility.
*   **In-App Alerts:** The frontend bell icon polls the `/api/notifications/unread/` endpoint.

## 3. Campaign Management & Engagement
### 3.1 Implementation Logic
*   **Module:** `backend/health_info/`
*   **Tracking Mechanism:**
    *   **View Count:** `HealthCampaign.increment_view_count()` (triggered on detail view retrieval).
    *   **Engagement:** `HealthCampaignViewSet.engage()` (triggered when a user clicks a CTA button).
*   **Visual Assets:** `banner_image` and `pubmat_image` handle high-resolution visual materials (PubMats support PDF/JPG/PNG).
*   **Tagging:** Comma-separated tags stored in the `tags` field for categorization and filtering.

## 4. Medical Certificate Issuance (ACA-HSD-04F)
### 4.1 Implementation Logic
*   **Module:** `backend/medical_certificates/`
*   **Flow:**
    1.  **Staff Draft:** Staff creates a record via `MedicalCertificateViewSet.perform_create`.
    2.  **Doctor Assessment:** Doctor uses the `assess_fitness` action to set `fitness_status` (Fit/Not Fit).
    3.  **PDF Generation:** `MedicalCertificateViewSet.render_pdf` uses `xhtml2pdf` to map data into the official USC landscape template.
*   **Compliance:** The template includes mandatory fields like License Number, Fitness Reason, and Validity Dates.

## 5. Reporting Engine
### 5.1 Implementation Logic
*   **Module:** `backend/reports/`
*   **Service:** `ReportDispatcher` in `dispatcher.py` handles the logic for different report types (e.g., `FEEDBACK_ANALYSIS`).
*   **Formatters:** Support for Excel (`xlsxwriter`) and PDF (`xhtml2pdf`).
*   **Scheduling:** `ReportSchedule` model allows admins to automate reports (Daily/Weekly).
