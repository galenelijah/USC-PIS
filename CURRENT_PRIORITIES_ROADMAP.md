# Current Priorities & Roadmap

**Last Updated:** February 15, 2026

## Immediate Priorities (Next 24-48 Hours)

1.  **User Acceptance Testing (UAT)**
    *   [ ] Test Faculty registration flow with a real text-based email.
    *   [ ] Verify Faculty access to "My Health Records".
    *   [ ] Test "Generate Certificate" flow from a Faculty's health record.

2.  **Reporting & Analytics**
    *   [ ] Verify that the `role_counts` in Admin Dashboard correctly reflect the new Faculty users.
    *   [ ] Check if the "Clinic Reports" need a breakdown by User Type (Student vs. Faculty).

3.  **Documentation**
    *   [x] Create Faculty Role Implementation Guide.
    *   [ ] Update User Manual with screenshots of the new "Choose Your Role" registration screen.

## Completed Tasks (Recent)

*   ✅ **Faculty Role Implementation:** Added role, updated backend models/views, updated frontend routing.
*   ✅ **Medical Records Overhaul:** Unified UI, fixed date formatting, improved validation, added Read-Only view.
*   ✅ **Medical Certificates Fix:** Seeded template, fixed redirection, implemented pre-filling.
*   ✅ **Registration Flow:** Implemented conditional role selection.
*   ✅ **Build Fixes:** Resolved JSX syntax errors blocking deployment.

## Future / Backlog

*   **Advanced Dashboard:** Create specific widgets for Facultys (e.g., "Faculty Wellness" tips).
*   **Appointment System:** (If in scope) Integrate Faculty schedules.
*   **Notification Preferences:** Allow granular control over email/SMS notifications per role.
