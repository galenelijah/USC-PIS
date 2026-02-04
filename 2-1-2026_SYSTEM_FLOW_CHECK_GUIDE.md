# USC-PIS Comprehensive System Flow Check Guide

**Date**: February 4, 2026
**Phase**: Pre-Pilot Verification
**Objective**: To systematically validate every active feature of the USC-PIS prior to the "1st Year Tourism Management" Pilot Test.

---

## 🧭 Pre-Flight Checklist (Admin/Dev)
Before starting the role-based checks, verify the environment is ready:
1.  **Deployment**: Ensure the app is running on Heroku.
2.  **Worker**: Confirm the Celery worker is active (`heroku ps:scale worker=1`).
3.  **Data Seed**: Confirm `seed_pilot_data` command has been run (`heroku run python backend/manage.py seed_pilot_data`).

---

## 👤 Role-Based Flow Verification

### 1. Student Journey (The "Tourism Student")
**Log in as**: `tourism_student_1@usc.edu.ph` / `password123` (or one of the seeded users).

#### A. Onboarding & Error Handling (Negative Test)
*   [ ] **Registration Error Check**:
    *   Go to Register page.
    *   Enter an email that already exists (e.g., `tourism_student_1@usc.edu.ph`).
    *   **Verify**: The Email field highlights red with the message "This email address is already registered. Please log in instead." (Not a generic banner).
*   [ ] **Profile Setup Error Check**:
    *   (Requires a fresh account or incomplete profile).
    *   Try to submit the form with an empty "Phone Number".
    *   **Verify**: The Phone Number field shows "Phone number is required" directly below the input.

#### B. Dashboard & Profile
*   [ ] **Login**: Verify successful login redirects to `/dashboard`.
*   [ ] **Personal Greeting**: Check for "Welcome, [Name]".
*   [ ] **Profile Data Verification**:
    *   Navigate to **Profile** (or click user avatar).
    *   **Course**: Must be "Bachelor of Science in Tourism Management".
    *   **Year Level**: Must be "1st Year".
    *   **ID Number**: Should mimic `26100...`.
    *   **Encrypted Fields**: Verify `Illness`, `Allergies`, etc. are readable (decrypted) for the owner.

#### C. Health Information Access
*   [ ] **Health Records**:
    *   Navigate to **Health Records**.
    *   Verify the seeded "Medical Record" exists (e.g., "Upper Respiratory Tract Infection").
    *   Click to view details.
    *   **Verify**: Dental records (if applicable) are also visible.

#### D. Engagement & Feedback
*   [ ] **Campaigns**:
    *   Navigate to **Campaigns**.
    *   Click a campaign card to open the **Public Preview**.
    *   **UI Check**: Verify text wraps correctly (no horizontal scroll).
*   [ ] **Submit Feedback**:
    *   Navigate to **Feedback**.
    *   Submit a new feedback form (e.g., "Great service!").
    *   **Verify**: Success message appears.

#### E. Notifications
*   [ ] **Bell Icon**:
    *   Click the **Bell Icon** (Top Right).
    *   Verify you can see unread notifications.
    *   Click "Mark all as read".

---

### 2. Medical Staff Journey (Doctor/Nurse)
**Log in as**: A user with `MEDICAL_STAFF` role (e.g., `nurse@usc.edu.ph` / `password123`).

#### A. Patient Management
*   [ ] **Patient Search**:
    *   Navigate to **Patients**.
    *   Search for "Tourism".
    *   **Verify**: The 10 seeded students appear in the list.
*   [ ] **Patient Profile View**:
    *   Click on a student's name.
    *   **Verify**: Medical/Dental history is visible.
    *   **Verify**: Sensitive fields (e.g., Emergency Contact) are decrypted.

#### B. Clinical Workflows & Uploads
*   [ ] **Add Medical Record (Error Check)**:
    *   On the patient's profile, click **"Add Medical Record"**.
    *   Try to save without a Diagnosis.
    *   **Verify**: Diagnosis field shows a specific validation error.
*   [ ] **Add Medical Record (Success)**:
    *   Fill out: Diagnosis ("Migraine"), Treatment ("Rest").
    *   Save.
    *   **Verify**: The new record appears immediately.
*   [ ] **Document Upload**:
    *   Find the **"Files"** or **"Attachments"** section.
    *   Upload a dummy image (e.g., "xray_test.jpg").
    *   **Verify**: File appears in the list.

#### C. Communications & Certificates
*   [ ] **Generate Medical Certificate**:
    *   Navigate to **Medical Certificates**.
    *   Create a certificate for a Tourism student.
    *   **Verify**: PDF is generated and downloadable.
*   [ ] **Create Campaign & Async Check**:
    *   Navigate to **Campaigns** -> **New Campaign**.
    *   Title: "Pilot Test Health Drive".
    *   Audience: "All Patients".
    *   **Publish**.
    *   **Backend Check**: Check Heroku logs to see Celery sending emails.

---

### 3. Administrator Journey
**Log in as**: `admin@usc.edu.ph` / `adminpassword` (or your superuser credentials).

#### A. System Oversight & Backups
*   [ ] **System Health**: Verify the dashboard widget is active.
*   [ ] **Database Monitor**:
    *   Navigate to `/database-monitor`.
    *   **Verify**: Connection Status is "Connected".
*   [ ] **Backup Management**:
    *   Navigate to the **Backups** tab.
    *   Click **"Create Manual Backup"**.
    *   **Verify**: Success message appears (not `[object Object]`).

#### B. Reports & Analytics
*   [ ] **Feedback Analytics**:
    *   Navigate to **Feedback** (Admin view).
    *   **Verify**: You can see the feedback submitted by the student earlier.
*   [ ] **Patient Summary Report**:
    *   Navigate to **Reports**.
    *   Generate a "Patient Summary" PDF for a Tourism student.
    *   **Validation**: Open PDF and check for USC Header and correct student data.

#### C. User Management
*   [ ] **Role Assignment**:
    *   Navigate to **Users**.
    *   Edit a user and change their role.
    *   **Verify**: Permissions update immediately.

---

### 4. 🛡️ Security & Negative Testing
*   [ ] **Unauthorized Access**:
    *   Log in as a **Student**.
    *   Try to access `/patients` or `/admin`.
    *   **Verify**: Redirected to dashboard or shown "403 Forbidden".
*   [ ] **Cross-Patient Access**:
    *   As a Student, try to view another student's profile (if URL manipulation is possible).
    *   **Verify**: Access Denied.

---

## 🐞 Bug Reporting Protocol
If any step fails:
1.  **Check Console**: Open Browser DevTools (F12) -> Console. Look for Red errors.
2.  **Check Network**: Look at the Network tab for failed API calls (400/500 status).
3.  **Document**:
    *   **What**: "Feedback submission failed with 500 Error".
    *   **Who**: Student.
    *   **Where**: `/feedback`.
4.  **Log**: Add to `OPEN_ISSUES.md`.