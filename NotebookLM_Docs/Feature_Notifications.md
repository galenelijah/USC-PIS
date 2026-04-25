# Notifications

Base path: `/api/notifications/`

Routers

- `notifications` → NotificationViewSet
- `templates` → NotificationTemplateViewSet
- `logs` → NotificationLogViewSet
- `preferences` → NotificationPreferenceViewSet
- `campaigns` → NotificationCampaignViewSet

Key endpoints (examples)

- Get notifications: `GET /api/notifications/notifications/`
- Update notification: `PATCH /api/notifications/notifications/{id}/`
- Templates: `GET|POST /api/notifications/templates/`
- Logs: `GET /api/notifications/logs/`
- Preferences: `GET|PATCH /api/notifications/preferences/`

Notes

- Integrates with email system; admin email tools live under `/api/utils/email/...`
- Preferences allow users to opt in/out by channel/type.

