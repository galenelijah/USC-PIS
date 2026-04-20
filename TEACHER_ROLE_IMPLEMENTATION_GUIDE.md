# Teacher Role Implementation Guide

## Overview
This document details the implementation of the `TEACHER` role in the USC-PIS system. The goal was to allow faculty members to use the clinic's services as patients (similar to Students) while distinguishing them from administrative `STAFF`.

## Architecture

### 1. Role Definition
The `TEACHER` role is defined in `backend/authentication/models.py` within the `User.Role` choices.
*   **Database Value:** `TEACHER`
*   **Label:** "Teacher"
*   **Permissions:** `is_staff=False`, `is_superuser=False` (Same as Student)

### 2. The "Patient Role" Concept
To simplify frontend logic, we introduced the concept of a "Patient Role". This includes any user who accesses the system primarily to view their own health data.
*   **Patient Roles:** `STUDENT`, `TEACHER`
*   **Staff Roles:** `ADMIN`, `DOCTOR`, `NURSE`, `STAFF`, `DENTIST`

### 3. Registration Logic
The challenge was differentiating Teachers from Staff, as both often use text-only emails (e.g., `name@usc.edu.ph`), whereas Students typically use number-based emails.

**Solution: Hybrid Role Selection (April 2026 Update)**
1.  **Backend (`serializers.py`):**
    *   `_determine_role_from_email` logic:
        *   If email has digits -> Force `STUDENT`.
        *   If email has no digits -> Default to `STUDENT` (Allows self-selection of `TEACHER` only).
    *   Professional roles (Staff, Doctor, etc.) are **blocked** from self-assignment during registration to prevent unauthorized access.
2.  **Frontend (`Login.jsx`, `Register.jsx`, `VerifyEmail.jsx`):**
    *   Users with text-only emails who are still `STUDENT` role are redirected to `/role-selection`.
3.  **Role Selection (`RoleSelection.jsx`):**
    *   **Self-Service:** Users can self-identify as `TEACHER` (Faculty) or continue as `STUDENT`.
    *   **Administrative Assignment:** If a user is Clinic Staff, Doctor, or Nurse, the UI informs them that an **Administrator must assign their role**. They cannot proceed with professional permissions until an admin updates their account.
4.  **Backend Permissions (`user_management_views.py`):**
    *   The `update_user_role` endpoint enforces:
        *   **Self-Update:** Only allowed for `STUDENT` $\rightarrow$ `TEACHER`.
        *   **Admin-Update:** All other transitions (especially to `STAFF`, `DOCTOR`, `ADMIN`) require full administrative privileges.

### 4. Profile Setup & Patient Profile
Teachers need a `Patient` profile in the database to store medical records.
*   **Backend:** `CompleteProfileSetupView` in `views.py` was updated to check `if user.role in [User.Role.STUDENT, User.Role.TEACHER]:`.
    *   **Field Forking:** For `TEACHER` roles, the setup requires `department` information instead of `course/year`.
*   **Frontend:** `ProfileSetup.jsx` treats `isStudent` as true if the role is `STUDENT` or `TEACHER`, but forks the UI labels to show "Department" for teachers.

### 5. Access Control & Management (Refined March 2026)
Global changes were made to ensure Teachers have the same view access as Students while maintaining administrative clarity.
*   **Variable:** `userRoles.isPatientRole` (replaces direct `isStudent` checks in routing).
*   **Routes Accessible:**
    *   `/health-records` (View own)
    *   `/medical-certificates` (Request/View own)
    *   `/medical-history` (View own)
    *   `/dental-records` (View own)
*   **Patient List Filtering:** The `/patients` management list automatically filters for `STUDENT` and `TEACHER` roles. If a user's role is changed to an administrative one, they are automatically removed from the active patient list.
*   **Data Mapping:** The `PatientSerializer` correctly maps a Teacher's `department` to the "Course/Department" column in the patients list for consistent reporting.

## Recent Enhancements (March 2026)
*   **Role Transition Logic:** Fixed a bug where users who were promoted from Student to Admin/Staff still appeared in the Patients list. The list now dynamically filters based on the user's *current* role.
*   **Synchronized Statistics:** Dashboard patient counts, Patient list totals, and User Management role counts are now perfectly synchronized.
*   **Unified Provider Support:** Ensured `DENTIST` and `DOCTOR` roles have identical access to both medical and dental records for comprehensive patient care.

## Key Files Modified
*   `backend/authentication/models.py`: Added Role choice.
*   `backend/authentication/serializers.py`: Updated role determination logic.
*   `frontend/src/components/Register.jsx`: Added UI for role selection.
*   `frontend/src/App.jsx`: Defined `isPatientRole`.
*   `frontend/src/components/MedicalRecord.jsx`: Updated permissions checks.
*   `backend/patients/validators.py`: Data consistency checks.

## Future Considerations
*   If Teachers require specific data fields different from Students (e.g., Department instead of Course), the `ProfileSetup` form will need to fork logic based on the specific role rather than the shared "Patient Role".
