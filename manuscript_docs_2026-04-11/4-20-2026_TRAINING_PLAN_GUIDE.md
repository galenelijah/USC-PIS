# System Training & Rollout Plan Guide: USC-PIS
**Date:** April 20, 2026
**Project:** Modernizing the USC-DC Clinic's Patient Information System (USC-PIS)
**Revision:** 2.3.0 (Post-Audit Comprehensive Update)

---

## 1. Training Objectives
The goal of this training plan is to ensure 100% competency among USC-DC Clinic staff and a seamless onboarding experience for students and faculty during the Pilot Test phase.

---

## 2. Target Audience Groups
1.  **Medical Personnel (Doctors/Dentists):** Clinical record management and certificate approval.
2.  **Administrative Staff (Nurses/Staff):** Patient registration, report generation, and campaign management.
3.  **End-Users (Students/Teachers):** Profile completion and personal health history access.
4.  **System Administrators (Technical Team):** System monitoring, backups, and security management.

---

## 3. Training Modules

### Module A: For Medical Personnel (The "Clinical" Track)
*   **A.1 Smart Patient Search:** Using the multi-field search (ID/Name/Email) to find patients across `/patients` and `/medical-certificates`.
*   **A.2 Record Entry:** Adding medical/dental visits, capturing vitals, and mapping dental procedures using FDI notation (Teeth 11-48).
*   **A.3 Fitness Assessment:** The approval workflow for Medical Certificates (ACA-HSD-04F) and setting "Fit/Not Fit" status.
*   **A.4 Clinical Reports:** Generating patient summaries and treatment outcome analysis.

### Module B: For Clinic Staff (The "Operations" Track)
*   **B.1 Patient Management:** Handling registrations and using advanced filters (AY/Semester/Program/Year Level).
*   **B.2 Health Campaigns:** Creating and publishing "PubMats" (Images/PDFs) and monitoring engagement stats.
*   **B.3 Reporting Engine:** Generating USC-branded PDF summaries and Excel exports; managing report schedules at `/reports`.
*   **B.4 Feedback Analysis:** Reviewing real-time patient satisfaction charts at `/admin-feedback`.

### Module C: For Patients (The "Self-Service" Track)
*   **C.1 Secure Onboarding:** Registering with @usc.edu.ph and completing the 6-digit email verification.
*   **C.2 Role Selection:** For faculty/staff, choosing the correct professional role (TEACHER, STAFF, etc.) at `/role-selection`.
*   **C.3 Profile Completion:** Filling out the health checklist and emergency contacts at `/profile-setup`.
*   **C.4 Health Insights:** Accessing personal medical history (Medical/Dental/Consultations) at `/health-records`.

### Module D: For System Admins (The "Maintenance" Track)
*   **D.1 Monitoring:** Using the Email Administration dashboard (`/email-administration`) to check system health.
*   **D.2 Security:** Managing the `Safe List` and monitoring encryption logs via the `/database-monitor`.
*   **D.3 Data Protection:** Manual and automated database backups at `/database-monitor`.

---

## 4. Delivery Methods
*   **Interactive Workshops:** 1-hour "Hands-on" sessions for clinic staff using the staging environment.
*   **Video Tutorials:** 3-minute "Quick-Start" screencasts for students and faculty.
*   **In-App Tooltips:** Utilizing existing "i" icons and field hints for just-in-time learning.

---

## 5. Rollout Schedule (Pilot Phase)
| Phase | Activity | Duration |
| :--- | :--- | :--- |
| **Phase 1** | Staff Onboarding (Medical/Admin) | 3 Days |
| **Phase 2** | Role-Specific Pilot (Tourism Students + Faculty) | 1 Week |
| **Phase 3** | Feedback Collection & UI Refinement | 3 Days |
| **Phase 4** | Full Campus Rollout | Ongoing |

---

## 6. Implementation Guidance for Gemini
When writing the Training Plan based on this file:
1.  **Role-Based Journeys:** Define specific navigation paths for each role.
2.  **Scenario-Based Learning:** Create step-by-step scenarios (e.g., "A teacher needs to update their department profile").
3.  **Visual Aids:** Reference specific UI components (e.g., "Green confirmation panel", "Notification bell icon").
4.  **Success Metrics:** Include a section on "How to measure training success" (e.g., % of profiles completed without errors).
