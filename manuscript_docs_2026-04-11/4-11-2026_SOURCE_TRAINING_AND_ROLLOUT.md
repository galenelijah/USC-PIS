# SOURCE DOCUMENT: Training and Rollout Plan - USC-PIS
**Date:** April 11, 2026
**Target AI Task:** Generate a Training Syllabus, User Manual, or Staff Onboarding Guide.

---

## 1. Training Strategy
The training program follows a **Role-Based Competency Model**, ensuring each user group (Students, Nurses, Doctors, Admins) masters the specific tools required for their daily operations.

---

## 2. User Role Workflows & Navigation

### 2.1 For Medical Staff (Doctors & Dentists)
*   **Key Path:** `/patients` $\rightarrow$ `[Patient Name]` $\rightarrow$ `Medical/Dental Record`.
*   **Core Tasks:** 
    *   Reviewing vital signs recorded by Nurses.
    *   Adding clinical diagnoses and treatment plans.
    *   **Certificate Approval:** Navigating to `/medical-certificates` to review, assess fitness (Fit/Not Fit), and approve student requests.

### 2.2 For Administrative Staff (Nurses & Clinic Staff)
*   **Key Path:** `/patients` $\rightarrow$ `Add New Record`.
*   **Core Tasks:** 
    *   Registering walk-in patients and recording vitals (BP, Temp, etc.).
    *   **Reporting:** Navigating to `/reports` to generate daily visit logs or program-specific summaries.
    *   **Campaigns:** Managing health posters and PubMats via the `/campaigns` module.

### 2.3 For End-Users (Students & Teachers)
*   **Key Path:** `/verify-email` $\rightarrow$ `/profile-setup` $\rightarrow$ `/home`.
*   **Core Tasks:** 
    *   Completing the mandatory Health Checklist (Medical History).
    *   **Health Insights:** Viewing their own clinical history and downloading approved certificates via `/health-insights`.
    *   **Feedback:** Submitting visit evaluations via the notification alerts.

---

## 3. The 4-Phase Rollout Schedule

| Phase | Title | Objective | Duration |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Infrastructure Finalization** | Verify Heroku hosting and pgcrypto encryption keys. | 2 Days |
| **Phase 2** | **Staff Onboarding** | Hands-on workshop for USC-DC medical and admin personnel. | 3 Days |
| **Phase 3** | **Pilot Deployment** | Controlled rollout for Tourism Management students (Pilot Group). | 1 Week |
| **Phase 4** | **Full Campus Launch** | Open registration for all USC colleges and departments. | Ongoing |

---

## 4. Success Metrics for Training
*   **Competency:** 100% of medical staff can generate a PDF certificate without technical assistance.
*   **Adoption:** 90% of pilot students complete their profile setup within 48 hours of registration.
*   **Security:** 0% shared password incidents; 100% use of individual @usc.edu.ph accounts.
