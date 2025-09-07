# Utilities, Health Checks, and Backups

Base paths: `/api/utils/` and legacy alias `/api/system/`

Health & metrics

- Quick health: `GET /api/utils/health/quick/`
- Comprehensive health: `GET /api/utils/health/comprehensive/`
- Database health: `GET /api/utils/database-health/`
- Performance stats: `GET /api/utils/performance/`
- Resources: `GET /api/utils/resources/`
- System metrics: `GET /api/utils/metrics/` (JSON) and `GET /api/utils/metrics/prometheus/`

Backup system (v2 endpoints)

- Create backup: `POST /api/utils/backup/create/`
- Status: `GET /api/utils/backup/status/{id}/`
- Download: `GET /api/utils/backup/download-v2/{id}/`
- Verify: `POST /api/utils/backup/verify/{id}/`
- Verify (dry run): `GET /api/utils/backup/verify-dry-run/{id}/`
- List: `GET /api/utils/backup/list/`
- Delete: `DELETE /api/utils/backup/delete/{id}/`
- Health summary: `GET /api/utils/backup/health/`
- Schedules CRUD: `GET|POST /api/utils/backup/schedules/`, `PATCH /api/utils/backup/schedules/{id}/`, toggle/run endpoints

Backup upload/restore

- Upload: `POST /api/utils/backup/upload/`
- Restore uploaded: `POST /api/utils/backup/restore-uploaded/`
- Uploaded list: `GET /api/utils/backup/uploaded/`
- Delete uploaded: `DELETE /api/utils/backup/uploaded/{id}/`
- Upload info: `GET /api/utils/backup/upload-info/`
- Auth test: `GET /api/utils/backup/test-auth/`

Email administration

- System status: `GET /api/utils/email/status/`
- Send test: `POST /api/utils/email/test/`
- Send feedback batch: `POST /api/utils/email/feedback/send/`
- Send health alert: `POST /api/utils/email/health-alert/send/`
- Automation stats: `GET /api/utils/email/stats/`

Notes

- JSON serialization fixes ensure health endpoints return JSON (avoid HTML 500).
- Production should unset `USE_CLOUDINARY` if Cloudinary isn’t configured; otherwise ensure creds present.
- Backups produce JSON artifacts; verification recommended post‑create.

