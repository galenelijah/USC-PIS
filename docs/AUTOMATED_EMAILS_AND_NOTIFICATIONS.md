# Automated Emails and Notifications

This document describes every automatic email/notification in USC‑PIS, what triggers it, which template is used, and how to verify in production.

## Overview
- Email sending centralizes through `utils/email_service.EmailService` for branded HTML + text.
- In‑app notifications flow through `notifications.services.NotificationService`.
- Some emails are immediate (inline) and some are scheduled via a management command/scheduler.

## Triggers and Templates
- Registration Welcome
  - Trigger: successful `POST /api/auth/register/`
  - Code: `authentication/views.register_user`
  - Template: `emails/welcome.html`
  - Recipient: the new user
- Password Reset
  - Trigger: `POST /api/auth/password-reset-request/`
  - Code: `authentication/views.PasswordResetRequestView`
  - Template: `emails/password_reset.html`
  - Recipient: requesting user
- Medical Certificates
  - Trigger: create/approve/reject in certificate views
  - Code: `medical_certificates/views` → `EmailService.send_medical_certificate_notification`
  - Templates: `emails/certificate_created.html`, `emails/certificate_approved.html`, `emails/certificate_rejected.html`
  - Recipient: student (and doctors for “pending approval”)
- Feedback Requests (Medical)
  - Trigger: MedicalRecord created (Django signal)
  - Code: `patients/signals.schedule_feedback_email_medical`
  - Template: `emails/feedback_request.html`
  - Recipient: patient with a linked user account
- Feedback Requests (Dental)
  - Trigger: DentalRecord created (Django signal)
  - Code: `patients/signals.schedule_feedback_email_dental`
  - Template: `emails/feedback_request.html` (generic)
  - Recipient: patient with a linked user account
- System Notifications (General)
  - Trigger: created via `NotificationService.create_notification` or using a template via `create_from_template`
  - Email body: generated HTML (service‑rendered), not the email templates directory
  - Recipient: specified user; respects notification preferences
- Backup Alerts
  - Trigger: backup error/issue detected in `utils.services.BackupService`
  - Template: `emails/backup_alert.html` + `.txt`
  - Recipient: `BACKUP_ALERT_EMAIL` or first admin in `ADMINS`

## Scheduler Jobs (Recommended)
Add these to Heroku Scheduler (or cron) so background emails run automatically:
- Send due scheduled notifications
  - Command: `python backend/manage.py send_scheduled_notifications`
  - When: every 5–15 minutes
- Health check alerts
  - Command: `python backend/manage.py health_check_alerts`
  - When: daily or every 6 hours
- Optional feedback backfill/reminders
  - Command: `python backend/manage.py auto_send_feedback_emails`
  - When: daily (only if you also want automated reminders beyond signals)

See `docs/SCHEDULER_JOBS.md` for exact steps.

## Production Configuration
- Email backend: SES or SMTP
  - SES: `USE_AWS_SES=True`, AWS keys/region
  - SMTP: `EMAIL_HOST`, `EMAIL_PORT=587`, `EMAIL_USE_TLS=True`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- Sender: `DEFAULT_FROM_EMAIL`
- Links: `FRONTEND_URL`
- Reset expiry: `PASSWORD_RESET_TIMEOUT` (default 86400)
- Alerts: `BACKUP_ALERT_EMAIL` or `ADMINS`

## Verification Checklist
- Welcome email: register a test user → inbox
- Password reset: request reset → open link → reset
- Feedback emails: create a MedicalRecord/DentalRecord (or via UI) → inbox
- Certificates: create/approve/reject → inbox(es)
- Notifications: call `NotificationService.create_notification` in shell → immediate email (unless scheduled)
- Scheduled: run `send_scheduled_notifications` + `health_check_alerts` manually once to confirm

## Troubleshooting
- No email in prod → verify provider env vars + `DEFAULT_FROM_EMAIL`
- No feedback emails → ensure `patients` app is installed and signals loaded (`apps.py.ready` imports `patients.signals`)
- Scheduled notifications not going out → add the scheduler job; check logs
- Backup alerts not going out → set `BACKUP_ALERT_EMAIL` or `ADMINS`

