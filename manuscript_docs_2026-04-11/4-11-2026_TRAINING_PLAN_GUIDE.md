# System Training & Rollout Plan Guide: USC-PIS
**Date:** April 11, 2026
**Project:** Modernizing the USC-DC Clinic's Patient Information System (USC-PIS)
**Optimization:** Optimized for Gemini NotebookLM and Gemini Chat as a Source Document.

---

## 1. Training Objectives
The goal of this training plan is to ensure 100% competency among USC-DC Clinic staff and a seamless onboarding experience for the student body during the Pilot Test phase.

---

## 2. Target Audience Groups
1.  **Medical Personnel (Doctors/Dentists):** Clinical record management and certificate approval.
2.  **Administrative Staff (Nurses/Staff):** Patient registration, report generation, and campaign management.
3.  **End-Users (Students/Facultys):** Profile completion and personal health history access.
4.  **System Administrators (Technical Team):** System monitoring, backups, and security management.

---

## 3. Training Modules

### Module A: For Medical Personnel (The "Clinical" Track)
*   **A.1 Smart Patient Search:** Using the multi-field search (ID/Name/Email) to find patients instantly across `/patients` and `/medical-certificates`.
*   **A.2 Record Entry:** Adding detailed medical/dental visits, capturing vitals, and mapping dental procedures with visual priority indicators.
*   **A.3 Fitness Assessment:** The approval workflow for Medical Certificates (ACA-HSD-04F) and setting "Fit/Not Fit" status.
*   **A.4 Clinical Reports:** Generating individual patient summaries and treatment outcome analysis.

### Module B: For Clinic Staff (The "Operations" Track)
*   **B.1 Patient Management:** Handling registrations and using advanced filters (AY/Semester/Program) at `/patients`.
*   **B.2 Health Campaigns:** Creating and publishing PubMats/Banners at `/campaigns` and monitoring engagement stats.
*   **B.3 Reporting Engine:** Generating USC-branded PDF summaries and Excel exports; managing report schedules at `/reports`.
*   **B.4 Feedback Analysis:** Reviewing patient satisfaction metrics and charts at `/admin-feedback`.

### Module C: For Students (The "Self-Service" Track)
*   **C.1 Secure Onboarding:** Registering with @usc.edu.ph and completing the 6-digit email verification at `/verify-email`.
*   **C.2 Profile Completion:** Filling out the health checklist and emergency contacts at `/profile-setup`.
*   **C.3 Health Insights:** Accessing personal medical history (Medical/Dental/Consultations) at `/health-insights`.
*   **C.4 Interactive Feedback:** Responding to post-visit feedback requests via the Notifications center.

### Module D: For System Admins (The "Maintenance" Track)
*   **D.1 Monitoring:** Using the Email Administration dashboard (`/email-administration`) to check SMTP/API health.
*   **D.2 Security:** Managing the `Safe List` and monitoring `pgcrypto` encryption logs via the `/database-monitor`.
*   **D.3 User Administration:** Role management and account reactivation at `/user-management`.

---

## 4. Delivery Methods
*   **Interactive Workshops:** 1-hour "Hands-on" sessions for clinic staff using the staging environment.
*   **Video Tutorials:** 3-minute "Quick-Start" screencasts for students focusing on the `/profile-setup` and `/health-insights` journey.
*   **Digital Manuals:** Role-specific PDFs (derived from the USER_GUIDE.md).
*   **In-App Tooltips:** Utilizing the existing "i" icons and field hints for just-in-time learning across all forms.

---

## 5. Rollout Schedule (Pilot Phase)
| Phase | Activity | Duration |
| :--- | :--- | :--- |
| **Phase 1** | Staff Onboarding (Medical/Admin) | 3 Days |
| **Phase 2** | Tourism Management Student Pilot | 1 Week |
| **Phase 3** | Feedback Collection & UI Refinement | 3 Days |
| **Phase 4** | Full Campus Rollout | Ongoing |

---

## 6. Implementation Guidance for Gemini
When writing the Training Plan based on this file:
1.  **Role-Based Journeys:** Define the specific navigation paths for each role (e.g., "Nurse path: Dashboard -> Patients -> Add Record").
2.  **Scenario-Based Learning:** Create step-by-step scenarios (e.g., "Scenario: A student needs a certificate for a tourism field trip").
3.  **Visual Aids:** Reference specific UI components mentioned in the User Guide (e.g., "Collapsible filter bar", "Green confirmation panel", "Notification bell icon").
4.  **Success Metrics:** Include a section on "How to measure training success" (e.g., % of profiles completed without errors).
