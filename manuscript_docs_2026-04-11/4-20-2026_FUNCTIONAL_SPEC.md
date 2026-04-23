# Functional Specification: USC-PIS
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)

---

## 1. Module: Secure Identity & Access (IAM)

### 1.1 User Registration & Verification
*   **Workflow**: Users enter their USC email. The system validates the domain and generates a 6-digit MFA code via the Gmail API.
*   **Heuristic Logic**: The system identifies numeric usernames (e.g., `21...`) as `STUDENT` and alpha usernames (e.g., `elfabian`) as potential faculty/staff.
*   **Bypass Logic**: If the email exists in the `SafeEmail` list, the MFA is skipped (optional) and the pre-authorized role is assigned immediately.

### 1.2 Role-Based Selection & Gating
*   **Patient Roles**: Students and Facultys can self-complete their profiles and access clinical services immediately.
*   **Administrative Gate**: Users requesting `STAFF`, `DOCTOR`, or `DENTIST` roles are placed in a `PENDING` state. Admins are notified and must manually activate the account and assign the correct clinical level.

---

## 2. Module: Clinical Management (CLIN)

### 2.1 Patient Onboarding
*   A 4-step wizard captures:
    1. Personal Information (Course/Year/Department).
    2. Medical History (Encrypted Illnesses/Allergies).
    3. Social History (Lifestyle/Habits).
    4. Emergency Contacts (Encrypted).

### 2.2 Medical & Dental Charting
*   **Vitals Tracking**: Interactive forms for BP, Pulse, and Temp with historical trend analysis.
*   **Dental FDI Chart**: A visual 2D tooth map where dentists can click specific teeth (11-48) to log treatments (e.g., Caries, Missing, Root Canal).
*   **Encrypted Storage**: Clinical notes and diagnoses are encrypted at the moment of `save()` and are only readable by authorized medical staff.

---

## 3. Module: Administrative Utilities (SYS)

### 3.1 Email Administration Dashboard
*   **Master Control**: A global toggle to pause all automated system communications.
*   **Routing Rules**: Admins can map events (e.g., `FEEDBACK_REQUEST`) to specific HTML templates.
*   **Granular Exclusions**: Ability to silence specific admins from receiving high-frequency alerts (e.g., "Role Request" notifications).

### 3.2 Reporting & Automation
*   **Scheduled Reports**: Daily system performance and patient count summaries.
*   **Manual Exports**: One-click generation of patient health summaries in PDF format for physical filing.

---

## 4. Module: Health Outreach (NOTIF)

### 3.1 Educational Campaigns
*   Admins upload "PubMats" (Publicity Materials) targeted at specific groups (e.g., "Dental Hygiene" for Students).
*   The system tracks "Engagement Rate" (Percentage of users who opened the notification vs. total recipients).
