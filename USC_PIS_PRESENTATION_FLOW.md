# USC-PIS Final Presentation: Demo Walkthrough & System Check

This document outlines the **End-to-End Presentation Flow** designed to showcase 100% of the system's core capabilities, technical innovations, and recently fixed critical issues. 

**Follow this script strictly to maintain the "Happy Path" and demonstrate a stable, enterprise-ready system.**

---

## 🟢 Phase 1: Onboarding & Security (The Entry)
*Goal: Demonstrate a secure, enterprise-ready entry point.*

1. **Landing & Registration** (`/register`):
   - **Action**: Create a new test Student account.
   - **Verify**: Real-time validation (password matching and strength).
   - **Verify**: Redirection to **Email Verification** (`/verify-email`).
   - **Technical Note (for Panel)**: Mention that AWS SES handles professional, automated email delivery for verification.

2. **Profile Setup & MFA** (`/profile-setup`):
   - **Verify**: The `RequireProfileSetup` middleware prevents dashboard access until the health profile is complete.
   - **Action**: Fill in allergies, blood type, and emergency contacts.

---

## 🔵 Phase 2: Healthcare Workflow (The Clinical Core)
*Goal: Show the "Patient Information System" in action.*

1. **Provider Dashboard** (`/home`):
   - **Action**: Log in as **Doctor/Staff**.
   - **Verify**: "Visit Trends" chart displays correctly. *(Technical note: This proves the vendor-aware SQL fix for SQLite/PostgreSQL date truncation).*

2. **Patient Management** (`/patients`):
   - **Action**: Search for a student. Create a **Medical Record** (`/medical/:id`).
   - **Action**: Create a **Dental Record** (`/dental/:id`).
   - **Feature Highlight**: Point out the "Dental Cost" tracking (the billing component).

3. **Health Insights Timeline** (`/health-insights`):
   - **Verify**: All records (Medical, Dental, Consultation) appear in a unified, chronological timeline.
   - **Technical Note (for Panel)**: State that sensitive data (Diagnosis/Name) is **encrypted at rest** via `pgcrypto`.

---

## 🟠 Phase 3: Engagement & Communication (The "Live" System)
*Goal: Show how the system communicates proactively with users.*

1. **Campaign Management** (`/campaigns`):
   - **Action**: Create a new Health Campaign.
   - **Verify**: Upload an image to test the **Cloudinary** CDN integration.
   - **Verify**: Click the "Action Menu" (three dots) to edit. *(Confirms the frontend `ReferenceError` state fix is active).*

2. **Notification Center** (`/notifications`):
   - **Action**: Check the "Bell" icon.
   - **Verify**: The student should have a real-time notification for the new campaign or a record update.

3. **Feedback Loop** (`/feedback`):
   - **Action**: As a Student, submit feedback for a specific visit.
   - **Verify**: As an Admin, view the entry in **Admin Feedback** (`/admin-feedback`).

---

## 🟣 Phase 4: Document & Data Management (The Output)
*Goal: Prove the system is a legitimate "paperless" solution.*

1. **Medical Certificates** (`/medical-certificates`):
   - **Action**: Select a recent visit and click **Render PDF**.
   - **Verify**: On Heroku, the PDF should generate flawlessly with the University header and clinical details.

2. **The Document Vault** (`/uploads` & `/downloads`):
   - **Action**: Upload a test lab result (PNG/PDF).
   - **Verify**: Retrieve it from the download section to demonstrate persistent cloud storage.

3. **Enterprise Reporting** (`/reports`):
   - **Action**: Export the "Patient List" or "Visit Summary" to **Excel**.
   - **Verify**: Open the `.xlsx` file to confirm the 4-tier download fallback and `openpyxl` dependencies are working in production.

---

## 🔴 Phase 5: Technical Integrity (The Technical "Wow" Factor)
*Goal: Win over the technical panelists/examiners.*

1. **Database Monitor** (`/database-monitor`):
   - **Verify**: "Backup Health" tab shows the status of automated backups.
   - **Action**: Click "Trigger Backup." 
   - **Verify**: Status updates from "Started" to "Completed."

2. **System Health Metrics** (`/database-monitor` > Database Health):
   - **Verify**: Real-time charts showing Database CPU/Memory/Connections load correctly. *(Confirms the backend 500-error fix for metrics).*

3. **User Management** (`/user-management`):
   - **Action**: Show the RBAC (Role-Based Access Control) list.
   - **Verify**: Demonstrate the ability to promote/demote users between roles (Student, Doctor, Nurse, Admin).

---

## 🚀 Pre-Flight Checklist (Run these 2 hours before presentation)

| Check Item | Action Required | Pass Condition |
| :--- | :--- | :--- |
| **Email API** | Send a "Forgot Password" link to yourself. | Email arrives in < 2 mins. |
| **Cloudinary** | Upload any small image to a test Campaign. | Image displays immediately. |
| **Production Logs** | Run `heroku logs --tail` (if CLI available). | No "500 Internal Server Error" or "H12 Timeout". |
| **MFA/Auth State** | Log out completely and Log back in. | Session persists, no "401 Unauthorized" loops. |
| **PDF Rendering** | Render one Medical Certificate on Heroku. | PDF opens in a new tab successfully. |

> **Final Presentation Tip**: If you encounter an unexpected lag on Heroku, attribute it to a "Cold Start" of the dyno. Stay confident, and stick strictly to this verified flow. Good luck!