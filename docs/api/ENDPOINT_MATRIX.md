# Endpoint Matrix (v1)

This matrix summarizes API endpoints grouped by app with typical operations and role notes. See each feature doc for details.

## Authentication (`/api/auth/`)

- Register: `POST /api/auth/register/` — Open; creates user with role
- Login: `POST /api/auth/login/` — Open
- Logout: `POST /api/auth/logout/` — Authenticated
- Check email: `GET /api/auth/check-email/?email=...` — Open
- Profile: `GET|PUT|PATCH /api/auth/profile/` — Authenticated (self)
- Password reset request: `POST /api/auth/password-reset-request/` — Open
- Password reset confirm: `POST /api/auth/password-reset/confirm/<uidb64>/<token>/` — Open
- Complete profile: `POST /api/auth/complete-profile/` — Authenticated
- Database health: `GET /api/auth/database-health/` — Authenticated
- Admin user mgmt: `GET/POST/PATCH/DELETE /api/auth/admin/users/...` — Admin

## Patients (`/api/patients/`)

- Patients: `GET|POST /api/patients/patients/`, `GET|PUT|PATCH|DELETE /api/patients/patients/{id}/` — Staff; students see own via linked Patient
- Medical records: `GET|POST /api/patients/medical-records/`, item CRUD at `{id}` — Staff; students see own
- Dental records: `GET|POST /api/patients/dental-records/`, item CRUD at `{id}` — Staff; students see own
- Consultations: `GET|POST /api/patients/consultations/`, item CRUD at `{id}` — Staff
- Dashboard stats: `GET /api/patients/dashboard-stats/` — Authenticated

## Health Info (`/api/health-info/`)

- Health information: `GET|POST /api/health-info/health-information/` — Staff create; all read
- Campaigns: `GET|POST /api/health-info/campaigns/`, item at `{id}` — Staff create/update; all read
- Campaign resources: `GET|POST /api/health-info/campaign-resources/` — Staff
- Campaign feedback: `GET|POST /api/health-info/campaign-feedback/` — Authenticated

## Feedback (`/api/feedback/`)

- Feedback list/create: `GET|POST /api/feedback/` — Authenticated
- Feedback item: `GET|PUT|PATCH|DELETE /api/feedback/{id}/` — Owner/Staff

## File Uploads (`/api/files/`)

- Uploads: `GET|POST /api/files/uploads/` — Authenticated
- Upload item: `GET|DELETE /api/files/uploads/{id}/` — Authenticated

## Medical Certificates (`/api/medical-certificates/`)

- Templates: `GET /api/medical-certificates/templates/` — Staff
- Certificates: `GET|POST /api/medical-certificates/certificates/`, item at `{id}` — Staff (approval workflow)

## Notifications (`/api/notifications/`)

- Notifications: `GET|PATCH /api/notifications/notifications/` — Authenticated
- Templates: `GET|POST /api/notifications/templates/` — Admin/Staff
- Logs: `GET /api/notifications/logs/` — Admin/Staff
- Preferences: `GET|PATCH /api/notifications/preferences/` — Authenticated
- Campaigns: `GET|POST /api/notifications/campaigns/` — Admin/Staff

## Reports (`/api/reports/`)

- Templates: `GET /api/reports/templates/` — Staff
- Generate: `POST /api/reports/templates/{id}/generate/` — Staff
- My generated: `GET /api/reports/generated/` — Authenticated
- Item: `GET /api/reports/generated/{id}/` — Owner/Admin
- Download: `GET /api/reports/generated/{id}/download/` — Owner/Admin
- Status: `GET /api/reports/generated/{id}/status/` — Owner/Admin

## Utilities & Backups (`/api/utils/`, alias `/api/system/`)

- Health: `GET /api/utils/health/quick/`, `GET /api/utils/health/comprehensive/` — Authenticated
- DB health: `GET /api/utils/database-health/` — Authenticated
- Performance/resources: `GET /api/utils/performance/`, `GET /api/utils/resources/` — Authenticated
- Metrics: `GET /api/utils/metrics/`, `GET /api/utils/metrics/prometheus/` — Authenticated
- Backup v2: `POST /api/utils/backup/create/`, `GET /api/utils/backup/status/{id}/`, `GET /api/utils/backup/download-v2/{id}/`, `POST /api/utils/backup/verify/{id}/`, `GET /api/utils/backup/verify-dry-run/{id}/`, `GET /api/utils/backup/list/`, `DELETE /api/utils/backup/delete/{id}/` — Admin/Staff
- Backup schedules: `GET|POST /api/utils/backup/schedules/`, `PATCH /api/utils/backup/schedules/{id}/`, `POST /api/utils/backup/schedules/{id}/toggle/`, `POST /api/utils/backup/schedules/{id}/run_now/` — Admin/Staff
- Backup uploads/restores: `POST /api/utils/backup/upload/`, `POST /api/utils/backup/restore-uploaded/`, `GET /api/utils/backup/uploaded/`, `DELETE /api/utils/backup/uploaded/{id}/`, `GET /api/utils/backup/upload-info/` — Admin/Staff
- Email admin: `GET /api/utils/email/status/`, `POST /api/utils/email/test/`, `POST /api/utils/email/feedback/send/`, `POST /api/utils/email/health-alert/send/`, `GET /api/utils/email/stats/` — Admin/Staff

Notes

- All endpoints are versioned via headers (Accept: application/json; version=v1) by default middleware.
- Default DRF permission is `IsAuthenticated`; app-level views may enforce stricter role checks.
- For full request/response examples, see the per-feature docs and `docs/api/README.md`.
