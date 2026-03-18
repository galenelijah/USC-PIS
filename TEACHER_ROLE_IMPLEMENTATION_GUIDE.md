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

**Solution: Conditional Role Selection**
1.  **Frontend (`Register.jsx`):**
    *   Detects if the entered email contains digits.
    *   **Has Digits:** Assumes Student. Hidden role field remains empty (backend defaults to Student).
    *   **No Digits:** Displays a "Choose Your Role" radio group.
        *   Option A: Teacher / Faculty (`TEACHER`)
        *   Option B: Clinic Staff / Medical Personnel (`STAFF`)
2.  **Backend (`serializers.py`):**
    *   `UserRegistrationSerializer` accepts an optional `role` field.
    *   `_determine_role_from_email` logic updated:
        *   If email has digits -> Force `STUDENT`.
        *   If email has no digits AND `role_preference == 'TEACHER'` -> Assign `TEACHER`.
        *   Otherwise (no digits, no/other preference) -> Default to `STAFF`.

### 4. Profile Setup & Patient Profile
Teachers need a `Patient` profile in the database to store medical records.
*   **Backend:** `CompleteProfileSetupView` in `views.py` was updated to check `if user.role in [User.Role.STUDENT, User.Role.TEACHER]:`.
*   **Frontend:** `ProfileSetup.jsx` treats `isStudent` as true if the role is `STUDENT` or `TEACHER`.

### 5. Access Control (Frontend)
Global changes were made to `App.jsx` and various components to grant Teachers the same view access as Students.
*   **Variable:** `userRoles.isPatientRole` (replaces direct `isStudent` checks in routing).
*   **Routes Accessible:**
    *   `/health-records` (View own)
    *   `/medical-certificates` (Request/View own)
    *   `/medical-history` (View own)
    *   `/dental-records` (View own)

## Key Files Modified
*   `backend/authentication/models.py`: Added Role choice.
*   `backend/authentication/serializers.py`: Updated role determination logic.
*   `frontend/src/components/Register.jsx`: Added UI for role selection.
*   `frontend/src/App.jsx`: Defined `isPatientRole`.
*   `frontend/src/components/MedicalRecord.jsx`: Updated permissions checks.
*   `backend/patients/validators.py`: Data consistency checks.

## Future Considerations
*   If Teachers require specific data fields different from Students (e.g., Department instead of Course), the `ProfileSetup` form will need to fork logic based on the specific role rather than the shared "Patient Role".
