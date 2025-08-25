# Open Issues (User-Reported)

Date: 2025-08-23
Owner: Maintainers
Status: Tracking; updated with current progress (2025-08-23)

## Error Messages for Registration — Resolved
- Status: Addressed (field-level server errors now map to inputs)
- Note: `Register.jsx` uses `setError` to display backend errors inline.

## Dropdown for Year Level and School/Campus — Resolved
- Status: Addressed (dropdowns added). Campuses: Downtown, Talamban (South removed).
- Note: Controlled via `CampusChoices`, `YearLevelChoices`.

## Student Dashboard: Both Cards Link to Health Info — Pending Repro
- Status: Not reproducible in code; needs prod repro (URL/role/screenshot).
- Note: STUDENT quick actions route to `/health-records`, `/health-info`, `/campaigns`.

## Create Clinical Record: Record Type Dropdown (Medical/Dental) — Clarified
- Status: Present; helper text added. Further form branching optional.
- Note: Medical vs Dental fields can be split if required.

## Auto-Refresh on `/health-records` After Creating Record — Resolved
- Status: Addressed (list refetches from server after save).

## Generate Certificate Button: Visibility Clarification — Resolved
- Status: Addressed (tooltip explains conditions: diagnosis includes “sick” or treatment includes “rest”).

## Add Search on `/patients` Page — Resolved
- Status: Addressed (debounced search UI + API integration).

## Campaign View Content — Resolved
- Status: Addressed (content rendered with ContentViewer; formatting preserved).

## Reports: Errors, Cannot Download — Pending Backend Verification
- Status: Frontend surfaces errors; backend must return valid file + headers when COMPLETED.
- Note: Verify render deps (WeasyPrint/xhtml2pdf), headers, and status.

## Database and Backup Monitor: Report Issues — Pending Backend Verification
- Status: Endpoints present with role checks; verify JSON responses under auth.

## Medical Dashboard Image: Gender — Resolved
- Status: Addressed (normalized via `getSexLabel` before selecting BMI image).

