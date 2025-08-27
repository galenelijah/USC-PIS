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


## Database & Backup Monitor — Proposed Enhancements
- Status: Proposed (add to roadmap and implement iteratively)
- Notes:
  - Health Metrics: include DB latency p50/p95/p99, active/idle connections, lock waits, slow query count, last migration timestamp, and cache hit rate in `/api/utils/database-health/`.
  - Backup KPIs: add last 24h/7d/30d success rate, average duration, average size, oldest/newest timestamps per type, last verification time, and retention compliance status in `/api/utils/backup/health/`.
  - Verification Workflow: expose endpoints to verify checksum and run a “dry-run restore” (schema-only) with a progress status; add a Verify button in the UI per backup row.
  - Schedules Management: list/create/edit schedules in UI; show next run time and last run outcome; add endpoint to pause/resume schedules and to run-now with safety checks.
  - Alerts & Thresholds: configurable thresholds (e.g., no successful backup > 24h, success rate < 90%, verification overdue > 7d); send email via AWS SES and optional webhook/Slack integration.
  - Storage Visibility: display cumulative backup storage usage, per-type breakdown, and 30‑day trend; include Cloudinary/S3/local disk usage where applicable.
  - Robust Downloads: include SHA256 checksum + size in metadata; show integrity status before download; keep current FileResponse streaming path.
  - Concurrency & Retry: enforce single active backup per type; add exponential backoff retry with capped attempts and surface failure reason taxonomy (auth, I/O, quota, integrity).
  - API Consistency: paginate recent backup lists, add filters (type, status, started_at range), and ensure all endpoints return JSON (never HTML) on error with clear codes.
  - Audit & RBAC: log who triggered backups/verifications/downloads; restrict create/restore to Admin; allow Staff read‑only; surface audit events in UI.
  - Observability: add a Prometheus‑compatible metrics endpoint (e.g., `/api/utils/metrics/prometheus`) and basic Grafana dashboard json; include correlation IDs in logs.
  - Frontend UX: add real‑time progress polling with cancel action, status badges, recommendations panel, history charts, and skeleton loaders; add export (CSV/JSON) for health/backup tables.
