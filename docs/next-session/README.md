# Next Session Checklist

## Environment
- Backend: `cd backend && source venv/Scripts/activate` (Windows) or `source venv/bin/activate` (Unix)
- Install deps: `pip install -r requirements.txt`
- DB: `python backend/manage.py migrate`
- Frontend: `cd backend/frontend/frontend && npm install && npm run dev`
- Production build: repo root `npm run build`

## Quick Smoke Tests
- Registration: invalid email/password shows inline errors on fields.
- Profile Setup: Year Level and School/Campus are dropdowns (Downtown, Talamban).
- Patients: `/patients` has a search bar; search (≥2 chars) filters results.
- Health Records: create/edit → list auto-refreshes from server; Record Type helper text visible.
- Campaigns: open a campaign → Content section renders with formatting.
- Patient Dashboard: BMI image matches user sex (id or string).

## Backend Verifications
- Reports
  - Generate report: `POST /api/reports/templates/{id}/generate/ { title, export_format }`
  - Poll: `GET /api/reports/generated/{id}/status/` until `COMPLETED`
  - Download: `GET /api/reports/generated/{id}/download/` → expects valid blob, headers `Content-Type`, `Content-Disposition`.
- Database/Backup Monitor
  - `GET /api/utils/database-health/` as Admin/Staff → JSON response.
  - `GET /api/utils/backup/health/` as Admin/Staff → JSON response (fallback legacy `/api/utils/backup-health/`).

## Open Items (Focus)
- Reports download: verify blob + headers; ensure WeasyPrint/xhtml2pdf present in runtime.
- Utils monitor: confirm endpoints return JSON (not HTML) under auth; check role gating.
- Student dashboard duplicate cards (if reproduced): capture URL/role/screenshot.

## Handy Paths
- Frontend app: `backend/frontend/frontend/src`
- Key components: `HealthRecords.jsx`, `CampaignsPage.jsx`, `Reports.jsx`, `Dashboard.jsx`
- Services: `backend/frontend/frontend/src/services/api.js`
- Backend endpoints: `backend/reports/`, `backend/utils/`

## Notes
- Session logs: run `bash scripts/new-session-log.sh "Summary"` after working.
- Change index: update `SESSION_CHANGES.md` at the end of each session.

