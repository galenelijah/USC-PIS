# Reports

Base path: `/api/reports/`

Routers

- `templates` → ReportTemplateViewSet
- `generated` → GeneratedReportViewSet
- `schedules` → ReportScheduleViewSet
- `bookmarks` → ReportBookmarkViewSet
- `analytics` → ReportAnalyticsViewSet

Key endpoints

- List templates: `GET /api/reports/templates/`
- Generate from template: `POST /api/reports/templates/{id}/generate/`
- My reports: `GET /api/reports/generated/`
- Report detail: `GET /api/reports/generated/{id}/`
- Download: `GET /api/reports/generated/{id}/download/`
- Status: `GET /api/reports/generated/{id}/status/`

Notes

- Background generation with threading; storage auto‑detect (local vs cloud).
- Export formats include PDF; other formats depend on libs and template support.
- Expiration and analytics fields track usage and lifecycle.

