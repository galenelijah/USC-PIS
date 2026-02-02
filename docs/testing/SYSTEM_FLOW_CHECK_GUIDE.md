# USC-PIS System Flow Check Guide

**Date**: February 1, 2026
**Phase**: Alpha Testing / Bug Checking

This guide outlines the systematic approach to verifying the flow and functionality of the USC Patient Information System (USC-PIS). It is designed for developers and testers during the alpha phase to ensure all user journeys are logical, functional, and bug-free.

## 🧭 Testing Philosophy
- **User-Centric**: Test as if you are the specific user role (Student, Doctor, Admin).
- **End-to-End**: Follow complete workflows (e.g., from registration to booking an appointment, from creating a campaign to viewing it).
- **Negative Testing**: Intentionally try to break things (invalid inputs, unauthorized access).

---

## 👤 Role-Based Flow Checks

### 1. Student Journey
**Goal**: Verify a student can access their data and engage with clinic services.

1.  **Registration & Login**:
    *   Register with a valid `@usc.edu.ph` email.
    *   Verify email typo detection (e.g., enter `@usc.edu`).
    *   Login and complete the profile setup (Medical History, etc.).
    *   **Check**: Are redirects correct? Is the profile data saved?

2.  **Dashboard Navigation**:
    *   Verify the dashboard loads with personalized greeting.
    *   Click through "Quick Actions" cards.
    *   **Check**: Do cards link to the correct pages (`/health-records`, `/campaigns`, etc.)?

3.  **Campaigns**:
    *   Navigate to `/campaigns`.
    *   Click on a campaign card.
    *   **Check**: Does the **Public Preview** dialog open? Is it readable?
    *   **Check**: Are "Edit" buttons hidden?

4.  **Health Records**:
    *   Navigate to `/health-records` (or `/health-insights`).
    *   View Medical and Dental history.
    *   **Check**: Is the data accurate? Are sensitive fields visible?

### 2. Medical Staff (Doctor/Nurse) Journey
**Goal**: Verify clinical workflows and patient management.

1.  **Patient Management**:
    *   Navigate to `/patients`.
    *   Search for a patient (by name or ID).
    *   Click "View Profile".
    *   **Check**: Is the search responsive? Does the profile load?

2.  **Record Creation**:
    *   From a patient profile, create a new **Medical Record**.
    *   From a patient profile, create a new **Dental Record**.
    *   **Check**: Do dropdowns (Record Type, Diagnosis) populate?
    *   **Check**: Does the list auto-refresh after saving?

3.  **Medical Certificates**:
    *   Navigate to `/medical-certificates`.
    *   Create a certificate for a patient.
    *   **Check**: Does the "Generate" button appear only when appropriate conditions are met?

### 3. Administrator Journey
**Goal**: Verify system oversight and configuration.

1.  **Campaign Management**:
    *   Navigate to `/campaigns`.
    *   Click "New Campaign".
    *   Upload images (Banner, Thumbnail).
    *   **Check**: Do error messages appear if validation fails?
    *   **Check**: Can you publish/unpublish?

2.  **System Monitoring**:
    *   Navigate to `/database-monitor`.
    *   **Check**: Are real-time stats loading?
    *   Navigate to `/reports`.
    *   **Check**: Can you generate and download reports? (Note: currently checking for template bugs).

---

## 🐞 Bug Reporting Protocol

When you find a bug (like the ones currently in `OPEN_ISSUES.md`), document it with:

1.  **Location**: URL or Component name.
2.  **Role**: Which user type experienced it?
3.  **Description**: What happened vs. what should have happened.
4.  **Steps to Reproduce**: 1... 2... 3...
5.  **Severity**: Critical (blocker), Major (broken feature), Minor (UI/typo).

**Example**:
*   **Location**: `/campaigns` (Public Preview)
*   **Description**: Paragraph text extends horizontally off-screen instead of wrapping.
*   **Severity**: Minor (UI).

---

## 🛠️ Technical Verification (Devs Only)

1.  **Frontend Build**:
    *   Run `npm run build` to ensure no compilation errors.
    *   Check browser console for React warnings (key props, unmounted state updates).

2.  **Backend Integrity**:
    *   Run `python manage.py check`.
    *   Check server logs for 500 errors during API calls.

3.  **Security**:
    *   Try to access `/admin` or `/database-monitor` as a Student.
    *   **Check**: Are you redirected or shown a 403 Forbidden?
