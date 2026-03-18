# Current Priorities & Roadmap

**Last Updated:** February 15, 2026

## Immediate Priorities (Next 24-48 Hours)

1.  **User Acceptance Testing (UAT)**
    *   [ ] Test Teacher registration flow with a real text-based email.
    *   [ ] Verify Teacher access to "My Health Records".
    *   [ ] Test "Generate Certificate" flow from a Teacher's health record.

2.  **Reporting & Analytics**
    *   [ ] Verify that the `role_counts` in Admin Dashboard correctly reflect the new Teacher users.
    *   [ ] Check if the "Clinic Reports" need a breakdown by User Type (Student vs. Teacher).

3.  **Documentation**
    *   [x] Create Teacher Role Implementation Guide.
    *   [ ] Update User Manual with screenshots of the new "Choose Your Role" registration screen.

## Completed Tasks (Recent)

*   ✅ **Teacher Role Implementation:** Added role, updated backend models/views, updated frontend routing.
*   ✅ **Medical Records Overhaul:** Unified UI, fixed date formatting, improved validation, added Read-Only view.
*   ✅ **Medical Certificates Fix:** Seeded template, fixed redirection, implemented pre-filling.
*   ✅ **Registration Flow:** Implemented conditional role selection.
*   ✅ **Build Fixes:** Resolved JSX syntax errors blocking deployment.

## Future / Backlog

*   **Advanced Dashboard:** Create specific widgets for Teachers (e.g., "Faculty Wellness" tips).
*   **Appointment System:** (If in scope) Integrate Teacher schedules.
*   **Notification Preferences:** Allow granular control over email/SMS notifications per role.
