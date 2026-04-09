---

# Session Changes (2026-01-31)

This entry documents the unification of the Campaigns view for all user roles.

## Modified Files
- `frontend/src/App.jsx`
  - Refactored route `/campaigns`: Removed conditional rendering of `StudentCampaigns`. Now renders `Campaigns` (wrapping `CampaignsPage`) for *all* user roles.
  - Removed unused lazy import of `StudentCampaigns`.
- `docs/CAMPAIGNS.md`
  - Updated "Frontend Integration" section to reflect the unified view architecture.

## Rationale
- User requested that students see the same campaigns interface as admins.
- `CampaignsPage.jsx` already contains internal role-based logic to hide administrative actions (create/edit/delete) for non-staff users, ensuring a secure but consistent visual experience.

## Verify Quickly
- Log in as a Student:
  - Navigate to `/campaigns`.
  - Confirm the view matches the main campaigns interface (filters, layout).
  - Confirm "New Campaign" button and Edit/Delete options are hidden.
- Log in as Staff/Admin:
  - Navigate to `/campaigns`.
  - Confirm administrative actions are still present and functional.

---

# Session Changes (2026-02-11)

This entry documents enhancements to student onboarding, data integrity, and the reporting system.

## Modified Files
- `frontend/src/utils/errorUtils.js`
  - Enhanced error parsing to handle nested backend error structures and prioritize specific validation messages.
- `frontend/src/components/Register.jsx`
  - Integrated improved error utilities to show descriptive server-side validation messages (e.g., USC email requirement).
- `frontend/src/components/ProfileSetup.jsx`
  - Fixed `ReferenceError` for undefined `globalError` state, resolving the white-screen bug after registration.
- `frontend/src/components/Dashboard.jsx`
  - Implemented a new "Profile Status" card for students that lists specific missing fields using interactive Chips.
- `backend/authentication/views.py`
  - Improved patient data preparation with robust fallback to user profile fields.
- `backend/patients/models.py`
  - Updated `user` field to use `on_delete=models.CASCADE` for automatic patient cleanup.
- `backend/patients/migrations/0008_...`
  - Created migration to enforce cascading deletion and clean up existing orphaned patient records.
- `backend/authentication/user_management_views.py`
  - Added explicit patient profile deletion logic to the admin user removal workflow.
- `backend/reports/services.py`
  - Refactored reporting system to a standardized PDF generation engine with professional USC branding.
  - Implemented a robust fallback system for document generation.
- `backend/reports/views.py`
  - Updated report generation task to handle the refactored service methods and improve file extension accuracy.
- `README.md` & `USER_GUIDE.md`
  - Comprehensively updated documentation to reflect new features and the PDF-only export restriction.

## Rationale
- **Onboarding**: Previous errors were too vague (e.g., "Validation failed"), confusing new users.
- **Integrity**: Deleting users left "ghost" records on the Patients page; cascading deletion ensures a clean database.
- **Reporting**: The reporting system was fragmented; consolidation provides a consistent, professional output for all clinic documents.
- **UX**: The new Profile Status card provides immediate, actionable feedback to students to complete their records.

## Verify Quickly
- **Onboarding**: Register with a non-USC email and verify the specific error message appears.
- **Dashboard**: Log in as a student with an incomplete profile and verify the missing fields are listed on the dashboard.
- **Admin**: Delete a test student and verify they are also removed from the Patients record list.
- **Reports**: Generate any report and verify it exports as a professional PDF.

---

# Session Changes (2026-03-19)

This entry documents password validation synchronization and notification management enhancements.

## Modified Files
- `frontend/src/utils/validationSchemas.js` & `backend/authentication/validators.py`
  - Synchronized password regex to support `#` and `^` special characters.
- `backend/patients/views.py`
  - Refined role-based filtering to exclude staff/admin users from the active patient list.
- `backend/notifications/views.py` & `frontend/src/services/api.js`
  - Implemented backend and frontend logic for bulk notification deletion (`delete_read`, `delete_all`).
- `frontend/src/components/Notifications.jsx`
  - Added UI controls for bulk deletion and "Mark All Read" functionality.

## Rationale
- **Validation**: Fixed UX friction where suggested characters were rejected by the system.
- **Data Integrity**: Ensured patient counts and lists only reflect actual clinical patients, not administrative staff.
- **UX**: Provided users with tools to manage their notification history.

---

# Session Changes (2026-03-21)

This entry documents administrative notification fixes and the implementation of interactive patient profiles.

## Modified Files
...
- **UX**: Replaced a static table with an interactive, drill-down interface for patient management.

---

# Session Changes (2026-04-09)

This entry documents enhancements to the Medical Certificate system and Advanced Patient Filtering.

## Modified Files
- `backend/medical_certificates/templates/tours_off_campus.html` (Finalized)
  - Implemented a polished, single-page landscape layout for USC Form ACA-HSD-04F.
  - Added USC logo, robust signature line for the School Physician, and removed footer disclaimers.
- `backend/medical_certificates/views.py`
  - Added dynamic context for student **Course Name** and **Year Level** mapping.
  - Aligned PDF rendering with "Purpose/Requirement" terminology.
- `frontend/src/components/MedicalCertificates/` (Multiple Files)
  - Changed **"Diagnosis"** to **"Purpose/Requirement"** across Form, List, and Detail views.
- `backend/patients/views.py`
  - Implemented advanced filtering in `PatientViewSet.get_queryset` for role, course, academic year, and semester.
- `frontend/src/components/Patients/PatientsPage.jsx`
  - Added a collapsible **Filter Bar** with dropdowns for role, course, year level, and registration period.
- `frontend/src/services/api.js`
  - Updated `patientService` to support passing optional filter parameters to the backend.
- `backend/utils/usc_mappings.py` (New File)
  - Created a centralized mapping of USC course IDs to full names and year level labels.

## Rationale
- **Medical Certificates**: The clinic requested a more professional and administrative-focused medical certificate for students. Moving from "Diagnosis" to "Purpose/Requirement" and automating the course name retrieval reduces manual effort for medical staff.
- **Patient Filtering**: Staff needed a way to separate students from teachers and filter them by their academic registration window (AY and Semester), fulfilling a key requirement for student data management.

## Verify Quickly
- **Medical Certificates**: Generate a certificate using the "USC Clinic Template" and verify it renders as a single-page landscape PDF with the student's full course name.
- **Filtering**: On the Patients page, use the Filter button to select "AY 2025-2026" and "1st Semester" to see only students registered in that period.
---
