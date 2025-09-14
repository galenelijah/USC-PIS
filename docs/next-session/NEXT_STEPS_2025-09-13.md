# Next Steps — Password Reset, Templates, and Automation (2025‑09‑13)

This document captures concrete next steps following the password reset implementation, report/email templates rollout, and email automation review.

## Immediate (Production)
- Email provider & sender
  - [ ] Set `DEFAULT_FROM_EMAIL` (e.g., `noreply@your-domain`)
  - [ ] Configure SES or SMTP env vars (see EMAIL_SETUP_GUIDE.md)
  - [ ] Set `FRONTEND_URL` to public site URL
  - [ ] Optional: `PASSWORD_RESET_TIMEOUT=86400`
- Scheduler jobs (Heroku or cron)
  - [ ] `python backend/manage.py send_scheduled_notifications` — every 10 minutes
  - [ ] `python backend/manage.py health_check_alerts` — every 6 hours
  - [ ] Optional: `python backend/manage.py auto_send_feedback_emails` — daily
- Replace report templates (done once per environment)
  - [ ] Backup + replace: `python backend/manage.py replace_report_templates --backup backups/report_templates_backup.json`
- Verify flows
  - [ ] Welcome email on registration
  - [ ] Password reset request → email → reset in SPA → login
  - [ ] Medical/Dental visit → feedback email (signals)
  - [ ] Certificate lifecycle emails (created/approved/rejected)
  - [ ] Generate report with `export_format=HTML` → HTML matches template

## Short‑Term (This Week)
- Email settings cleanup
  - [ ] Consolidate email config in `backend/backend/settings.py` to a single, non‑overriding block (SES or SMTP + console fallback)
- Password reset UI polish
  - [ ] Standardize reset screens to match Login/Register (Paper, spacing, button styles)
  - [ ] Optional password strength hints; ensure submit disabled until valid
- Report templates coverage
  - [ ] Decide on additional report types to seed by default (USER_ACTIVITY, HEALTH_METRICS, INVENTORY_REPORT, FINANCIAL_REPORT, COMPLIANCE_REPORT, CUSTOM)
  - [ ] Add default templates (if needed) and re‑run `replace_report_templates` with `--force` defaults
- Template hygiene
  - [ ] Remove or sync `backend/templates/emails/password_reset_email.html` (duplicate, not used)

## Enhancements (Optional)
- Admin preview
  - [ ] Add an admin-only preview endpoint to render `ReportTemplate.template_content` with sample data
- HTML → PDF alignment
  - [ ] Integrate WeasyPrint or wkhtmltopdf so PDFs follow the HTML templates (adds system dep)
- Observability
  - [ ] Add lightweight “Email Status” admin card (backend, last send status per category)
  - [ ] Add management command to restore report templates from JSON backup

## Commands Reference
- Test emails
  - `python backend/manage.py test_all_emails --email you@example.com`
- Force alert (health)
  - `python backend/manage.py health_check_alerts --force-alert`
- Replace report templates (with backup)
  - `python backend/manage.py replace_report_templates --backup backups/report_templates_backup.json`
- Generate report (HTML)
  - `POST /api/reports/templates/{id}/generate/ { title, export_format: "HTML" }`

## Links
- Automated emails & notifications: `docs/AUTOMATED_EMAILS_AND_NOTIFICATIONS.md`
- Scheduler jobs setup: `docs/SCHEDULER_JOBS.md`
- Password reset flow: `docs/AUTH_PASSWORD_RESET.md`
- Email templates rollout: `docs/EMAIL_TEMPLATES_ROLLOUT_GUIDE.md`
- Report templates rollout: `docs/REPORT_TEMPLATES_ROLLOUT_GUIDE.md`
- Replace report templates: `docs/REPLACE_REPORT_TEMPLATES.md`

