# Scheduler Jobs Setup

Configure periodic jobs so automated emails and notifications run without manual steps.

## Heroku Scheduler

1) Add the add-on
```
heroku addons:create scheduler:standard --app <your-app>
```

2) Open the scheduler dashboard
```
heroku addons:open scheduler --app <your-app>
```

3) Create jobs
- Send due notifications
  - Command: `python backend/manage.py send_scheduled_notifications`
  - Frequency: Every 10 minutes
- Health check alerts
  - Command: `python backend/manage.py health_check_alerts`
  - Frequency: Every 6 hours
- Optional: Feedback backfill/reminders
  - Command: `python backend/manage.py auto_send_feedback_emails`
  - Frequency: Daily at 09:00

## Cron (Linux/Other)
Add entries to `crontab -e`:
```
# Send scheduled notifications every 10 minutes
*/10 * * * * /usr/bin/env bash -lc 'cd /app && python backend/manage.py send_scheduled_notifications >> /var/log/usc-pis-cron.log 2>&1'

# Health check alerts twice daily
0 */12 * * * /usr/bin/env bash -lc 'cd /app && python backend/manage.py health_check_alerts >> /var/log/usc-pis-cron.log 2>&1'

# Optional feedback job daily
0 9 * * * /usr/bin/env bash -lc 'cd /app && python backend/manage.py auto_send_feedback_emails >> /var/log/usc-pis-cron.log 2>&1'
```

## Verifying Jobs
- Run each command once manually (expect no errors).
- Check provider logs for job executions.
- Ensure emails land in inboxes or appear in provider logs.

## Environment Requirements
- Email backend configured (SES or SMTP) and `DEFAULT_FROM_EMAIL`.
- `FRONTEND_URL` set for proper links.
- Optional: `BACKUP_ALERT_EMAIL` or `ADMINS` for health alerts.

