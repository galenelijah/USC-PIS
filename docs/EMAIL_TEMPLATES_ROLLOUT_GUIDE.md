# Email and Reset Templates Rollout Guide

This guide explains how to switch the system to the new templates and stop seeing the legacy ones, plus how to validate the change in development and production.

## Scope
- Backend email templates under `backend/templates/emails/` (Password Reset, Welcome, Certificates, Feedback, Alerts).
- Frontend password reset pages (`/password-reset-request` and `/password-reset/:uidb64/:token`).

## Current State
- New templates exist under `backend/templates/emails/` and are wired via `utils.email_service.EmailService`.
- Password reset request view was updated to use `EmailService.send_password_reset_email(user, reset_url)`, which renders `emails/password_reset.html`.
- If you still see old email content, you may be calling old code paths, or your deployment didn’t pick up the change.

## Implementation Checklist

1) Ensure template directory is active
- Confirm `backend/backend/settings.py` includes:
  - `TEMPLATES[0]['DIRS']` contains `os.path.join(BASE_DIR, 'templates')`.
  - `APP_DIRS=True` is fine; our directory takes precedence when in `DIRS`.

2) Ensure email code paths use `EmailService`
- Password reset: `backend/authentication/views.py` → `PasswordResetRequestView` should call `EmailService.send_password_reset_email(user, reset_url)`.
- Other emails already go through `EmailService`.
- Verify with a quick search:
  - Look for `render_to_string('emails/` in view code; only `EmailService` should render email templates.

3) Confirm the correct template names
- Password reset template used: `backend/templates/emails/password_reset.html`.
- If you prefer `password_reset_email.html`, either:
  - Replace the contents of `password_reset.html` with your desired markup, or
  - Change `EmailService.send_password_reset_email(... template_name='password_reset')` to the preferred template name (keeping the `emails/<name>.html` convention).

4) Frontend reset pages
- Routes in `src/App.jsx`:
  - `/password-reset-request` → `components/PasswordResetRequest.jsx`.
  - `/password-reset/:uidb64/:token` → `components/PasswordReset.jsx`.
- To avoid confusion with old pages in `src/pages/`, remove `ForgotPasswordPage.jsx` and `ResetPasswordPage.jsx` or leave them unused.

5) Environment and URLs
- Set `FRONTEND_URL` to your production URL (used to build the reset link in emails).
- Optional: `PASSWORD_RESET_TIMEOUT=86400` (matches template copy: 24 hours).

## Deployment Steps

1) Commit and deploy the changes to production.
2) Restart the application processes (web dynos/containers).
3) If using a persistent template cache (not typical in this project), clear it.
4) Verify using the steps below.

## Verification

A. Management command (sends real emails):
- `python backend/manage.py test_all_emails --email you@example.com --test-type password-reset`
- Add `--dry-run` to preview actions without sending.

B. End-to-end via API + SPA:
- Trigger request:
  - `POST /api/auth/password-reset-request/` with `{ "email": "existing_user@usc.edu.ph" }`.
- Open the email link: `${FRONTEND_URL}/password-reset/<uidb64>/<token>/`.
- Set a new password on the SPA page and confirm success.

C. Quick service test in shell:
- `python backend/manage.py shell`
- Then:
  - `from utils.email_service import EmailService`
  - `EmailService.send_password_reset_email(type('U', (), {'email':'you@example.com','first_name':'Test','last_name':'User'})(), 'https://your-domain/password-reset/uid/token/')`

## If You Still See Old Templates
- Ensure you are on the updated code version (redeploy if unsure).
- Confirm `PasswordResetRequestView` uses `EmailService` (no direct `send_mail`/`render_to_string` calls in the view).
- Verify which template file name the code references (should be `emails/password_reset.html`).
- Check logs during a request to ensure the new path is hit.
- For email providers (SES/SMTP), there is no server-side caching of email content; if you see older content, the old code likely sent it.

## Optional Enhancements
- Make template selection configurable via env (e.g., `EMAIL_TEMPLATE_VARIANT=default`) and map variants inside `EmailService`.
- Add a small preview endpoint for admins to render template HTML with sample context (view-only, no send).
- Standardize frontend reset pages to match Login/Register components (Paper, Stack, spacing) for a consistent look.

## Rollback Plan
- If the new templates cause issues, temporarily switch `EmailService.send_password_reset_email` to reference the older filename or paste the previous content into `password_reset.html`.
- Revert the deployment if necessary.

---

This guide documents how to apply and verify the new templates so the old ones no longer appear.

