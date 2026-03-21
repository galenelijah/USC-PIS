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
- `backend/notifications/views.py`
  - Refined `get_queryset` to default to user-only notifications for admins (added `?all=true` override).
  - Updated `mark_as_read` to allow administrative overrides, fixing 403 errors.
- `frontend/src/components/Notifications.jsx`
  - Implemented ownership checks and UI safeguards for marking notifications as read.
- `backend/patients/serializers.py`
  - Expanded `PatientSerializer` to include full profile data from the `User` model.
- `frontend/src/components/Patients/PatientList.jsx`
  - Made the patient list clickable with hover effects.
- `frontend/src/components/Patients/PatientsPage.jsx`
  - Added state management for selected patients and conditional profile rendering.
- `frontend/src/components/Patients/PatientProfile.jsx` (New File)
  - Created a comprehensive unified profile view with medical history and vital signs.

## Rationale
- **Notifications**: Fixed a critical permission bug that prevented admins from clearing system alerts.
- **Clinical Visibility**: Provided medical staff with a "360-degree view" of patient data, fulfilling the core thesis requirement for comprehensive medical profiles.
- **UX**: Replaced a static table with an interactive, drill-down interface for patient management.

---
