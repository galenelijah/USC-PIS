# Session Changes (2025-09-05)

This document lists all changes made in this session, with file paths and brief notes.

## New Files
- `backend/frontend/frontend/src/components/utils/InfoTooltip.jsx`
  - Reusable info icon + tooltip for inline help.
- `docs/session-notes/2025-09-05-session-log.md`
  - Dated log for this session summarizing UX/tooltips + validation improvements.

## Modified Files
- Tooltips across app (selected examples):
  - `components/Dashboard.jsx` (via PageHeader `helpText`), `components/SystemHealthDashboard.jsx`, `components/Reports.jsx`, `components/Notifications.jsx`, `components/DatabaseMonitor.jsx`, `components/EmailAdministration.jsx`, `components/CampaignsPage.jsx`, `components/StudentCampaigns.jsx`, `components/HealthInfo/HealthInfo.jsx`, `components/HealthRecords.jsx`, `components/MedicalRecordsPage.jsx`, `components/MedicalHistoryPage.jsx`, `components/Medical.jsx`, `components/UserManagement.jsx`, `components/PatientMedicalDashboard.jsx`, `pages/FileUploadPage.jsx`, `pages/FileDownloadPage.jsx`, `pages/ForgotPasswordPage.jsx`, `pages/ResetPasswordPage.jsx`.
- Page header help: `components/utils/PageHeader.jsx` now supports `helpText` to render a tooltip next to titles.
- Form hint capability: `components/forms/MyTextField.jsx`, `MySelector.jsx`, `MyDatePicker.jsx`, `MyPassField.jsx` now accept `hint` and render it when no error is present.
- Standardized validation: `utils/validationSchemas.js` extended with `phone()` and `idNumber()`; `ProfileSetup.jsx` schemas refactored to use `commonValidation` with consistent messages; registration continues to use shared `registerSchema`.
- Registration and Profile Setup updated with helpful hints under fields and consistent error messages.
- Documentation updated: `README.md`, `USER_GUIDE.md`, `DOCUMENTATION_INDEX.md`.

## Verify Quickly
- Registration: trigger a backend validation error and see inline messages under inputs.
- Profile Setup: Year Level and School/Campus render as dropdowns.
- Patients: `/patients` shows search input; typing (≥2 chars) filters results.
- Patient Dashboard: BMI image matches user sex whether stored as id or string.
 - Tooltips: Hover the “i” icons next to headers across pages to see guidance.
 - Hints: Visit Register and Profile Setup to see hints under fields when no errors are present.

## Additional Updates (2025-08-23)
- `backend/frontend/frontend/src/components/HealthRecords.jsx`
  - Refresh records from server after create/update (`fetchHealthRecords()`), add tooltip clarifying when “Generate Certificate” appears, and helper text for Record Type.
- `backend/frontend/frontend/src/components/CampaignsPage.jsx`
  - Render campaign `content` via `ContentViewer` (View dialog and Public Preview) to preserve formatting.
- `backend/frontend/frontend/src/components/Reports.jsx`
  - Detect and surface HTML/JSON error payloads on download instead of forcing a file download.
- `backend/frontend/frontend/src/components/static/choices.jsx`
  - Remove “South Campus”; restrict `CampusChoices` to Downtown/Talamban.

## Verification (2025-08-23)
- Reports download endpoint
  - Backend path verified: `backend/reports/urls.py` registers `generated` viewset; `GeneratedReportViewSet.download` serves files with correct `Content-Type`, `Content-Disposition`, and `Access-Control-Expose-Headers` (see `backend/reports/views.py`).
  - Frontend uses `responseType: 'blob'`; UI now surfaces server-side errors if HTML/JSON is returned.
  - Manual check (when running): generate a report via `POST /api/reports/templates/{id}/generate/`, poll `/api/reports/generated/{id}/status/` until `COMPLETED`, then GET `/api/reports/generated/{id}/download/` and confirm headers and non-empty payload.
- Database/Backup monitor endpoints
  - Backend paths verified in `backend/utils/urls.py`: `/api/utils/database-health/` and `/api/utils/backup/health/` map to JSON-producing views with `IsAuthenticated` + role checks in `backend/utils/views.py`.
  - Frontend routes and service calls match these endpoints; legacy fallback `/api/utils/backup-health/` also exists.
- Student dashboard routing
  - Code shows distinct STUDENT quick actions in `src/components/Dashboard.jsx` (links to `/health-records`, `/health-info`, `/campaigns`). If duplicates appear, likely a stale build/environment mismatch.

---

# Session Changes (2025-09-06)

This document lists all changes made on Sept 6, 2025 related to making Health Records medical-only and clarifying navigation.

## New Files
- `docs/session-notes/2025-09-06-health-records-medical-only.md`
  - Session log covering rationale, changes, verification steps, user prompts, and implemented follow-ups.

## Modified Files
- `backend/frontend/frontend/src/components/HealthRecords.jsx`
  - Made page medical-only: removed Record Type field entirely, removed dental templates, removed Type column, cleaned quick stats/actions, simplified exports and print to medical-only.
- `backend/frontend/frontend/src/components/StudentHealthRecords.jsx`
  - Export CSV now medical-only: removed Record Type and dental-specific columns; kept medical fields.
- `backend/frontend/frontend/src/components/Layout/Sidebar.jsx`
  - Clarified labels/descriptions: “Patient History (Medical & Dental)”, refined Medical and Dental Records descriptions.
- `DOCUMENTATION_INDEX.md`
  - Added latest updates summary for Sept 6, 2025.

## Verify Quickly
- Health Records (`/health-records`):
  - Create/edit forms show no Record Type; new saves succeed; templates are medical-only.
  - Table has no Type column; View/Edit/Delete work as expected.
  - Exports (CSV/Excel) contain only medical fields; Print title reads “Medical Records Report”.
- Student Health Records:
  - Export CSV excludes Record Type and dental-only fields.
- Sidebar:
  - Items show updated labels/descriptions for medical vs dental routes.

---

# Session Changes (2025-09-09)

This entry documents the student campaign preview, UI polish, and favicon/manifest adjustments.

## New Files
- `backend/frontend/frontend/src/components/PublicCampaignPreview.jsx`
  - Full-page campaign preview for students and staff; hero banner, formatted content, and image gallery.
- `backend/frontend/frontend/public/favicon.svg`
  - Neutral, generic app icon used for browser tab and PWA.
 - `docs/THESIS_ALIGNMENT_COMPARISON.md`
   - Comparison of project vs thesis summary (pis.md), gaps, and recommended adjustments.

## Modified Files
- `backend/frontend/frontend/src/App.jsx`
  - Route `/campaigns` now renders `StudentCampaigns` for students and `CampaignsPage` for staff/admin.
  - Added new route `/campaigns/:id` protected preview page using `PublicCampaignPreview`.
- `backend/frontend/frontend/src/components/StudentCampaigns.jsx`
  - Added “Open Full Preview” action to navigate to `/campaigns/:id`.
  - Improved content rendering: HTML vs. formatted text fallback via `InlineContentRenderer`.
  - Implemented `computeQualityScore()` for the create dialog score chip.
- `backend/frontend/frontend/index.html`
  - Updated favicon and manifest paths to `/static/...`; favicon now `favicon.svg`.
- `backend/frontend/frontend/public/manifest.json`
  - Icon now `favicon.svg`; paths aligned with Vite `base: '/static/'`.

### RBAC & Security Enhancements
- Roles
  - Added `DENTIST` role across backend and frontend where medical staff access applies (Patients, Reports, Email Admin, certificates).
- Selective Column Encryption (pgcrypto)
  - Added encrypted columns: `illness_enc`, `existing_medical_condition_enc`, `medications_enc`, `allergies_enc`, `emergency_contact_number_enc`.
  - Migration enables `pgcrypto` on Postgres and backfills ciphertext if `PGP_ENCRYPTION_KEY` is set.
  - Post-save signal mirrors plaintext fields into encrypted columns via `pgp_sym_encrypt`.
  - Settings/env: Add `PGP_ENCRYPTION_KEY`.

## Verify Quickly — RBAC & Encryption
- DENTIST role can access Patients, Reports, Email Administration, and medical/dental records.
  - On Postgres: run `SELECT octet_length(allergies_enc) FROM authentication_user WHERE allergies_enc IS NOT NULL LIMIT 1;` and try `pgp_sym_decrypt` with your key.

### Email Template Improvements
- Fixed university name to “University of San Carlos” in base/alerts
- Removed appointments mention in welcome email; added campaigns link
- Replaced hardcoded links with `{{ site_url }}` in feedback emails
- Added plain text fallbacks: welcome.txt, certificate_created.txt, certificate_approved.txt, feedback_request.txt, password_reset.txt
- Added missing `emails/password_reset_email.html` to match view usage

### Report Templates (HTML) — Shared Styles
- Added shared stylesheet injection in `create_default_report_templates` to unify header/footer/branding across HTML exports
- To refresh existing templates, run:
  - `python backend/manage.py create_default_report_templates --force`

## Verify Quickly
- Campaigns (Student role):
  - Visit `/campaigns`, click a card to open details, then “Open Full Preview” to view `/campaigns/:id`.
  - Content displays with formatting; images render in a simple gallery.
- Favicon/Manifest:
  - Browser tab shows generic icon; PWA install shows the same icon.
  - No console error for missing `/vite.svg`. If cached, hard refresh.
