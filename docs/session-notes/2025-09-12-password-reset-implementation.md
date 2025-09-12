# Password Reset (Forgot Password) Feature — Implementation Notes (2025-09-12)

## Prompts Received

> can you implement a forget password feature
>
> make sure it works in production
>
> create a new md file, with your changes and the prompts i gave. make sure to make it detailed and include what needs to be done if there is any

---

## Summary

Implemented a complete, production-ready “Forgot Password” flow across the Django backend and React frontend:

- Backend exposes two endpoints: request reset and confirm reset.
- Frontend routes users from an email link containing `uidb64` and `token` to a reset page.
- Centralized email sending via `EmailService` using HTML templates and sensible headers.
- Production safety: environment-driven `FRONTEND_URL` with fallback, `PASSWORD_RESET_TIMEOUT` (24 hours by default), and explicit email backend configuration.

This note documents changes made, configuration required for production, and how to verify the flow end-to-end.

---

## Backend Implementation

### Endpoints

- `POST /api/auth/password-reset-request/`
  - Input: `{ "email": "user@usc.edu.ph" }`
  - Behavior: Generates a `uidb64` + `token`, composes the reset URL as `${FRONTEND_URL}/password-reset/<uidb64>/<token>/`, and sends a password reset email via `EmailService`.
  - Security: Returns a generic success response whether or not the email exists.

- `POST /api/auth/password-reset/confirm/`
  - Input: `{ "uidb64": "...", "token": "...", "password": "NewStrongPass123!" }`
  - Behavior: Validates the token and updates the user’s password. Returns 200 on success or 400 for invalid/expired token.

Paths and classes:
- `backend/authentication/urls.py`
  - Added route for body-based confirm: `path('password-reset/confirm/', PasswordResetConfirmView.as_view(), ...)`
  - Kept URL-based confirm path for completeness: `password-reset/confirm/<uidb64>/<token>/`
- `backend/authentication/views.py`
  - `PasswordResetRequestView`: switched to `EmailService.send_password_reset_email(user, reset_url)`
  - `PasswordResetConfirmView`: validates `uidb64`, `token`, and sets new password
- `backend/authentication/serializers.py`
  - `PasswordResetRequestSerializer` (lenient existing-email validator)
  - `PasswordResetConfirmSerializer` (validates password strength)

### Email Delivery

- Service: `backend/utils/email_service.py` (`EmailService.send_password_reset_email`)
  - Sends HTML + text alternative using templates under `backend/templates/emails/password_reset.html`.
  - Branded subject: `[USC-PIS] USC-PIS Password Reset Request`.

Templates present:
- `backend/templates/emails/password_reset.html`
- `backend/templates/emails/password_reset_email.html`
- `backend/templates/emails/password_reset.txt`

Note: We standardized sending through `EmailService` for consistent headers and deliverability. The request view no longer uses `send_mail` directly.

### Settings and Production Safety

- `backend/backend/settings.py`
  - `FRONTEND_URL`
    - If env `FRONTEND_URL` exists, uses it.
    - Else: `http://localhost:5173` when `DEBUG=True`, or `https://usc-pis-5f030223f7a8.herokuapp.com` when `DEBUG=False`.
  - `PASSWORD_RESET_TIMEOUT`
    - New setting with default 24 hours (`86400` seconds), configurable via env.
  - Email backend
    - Console backend for dev if creds are missing; SES or SMTP for production as configured earlier in the file.

Security notes:
- The reset token is time-bound via Django’s token generator and `PASSWORD_RESET_TIMEOUT`.
- Response to non-existent emails is intentionally generic.

---

## Frontend Implementation (React/Vite)

### Routes

- `src/App.jsx`
  - Reset page route updated to accept both `uidb64` and `token` from the URL: `/password-reset/:uidb64/:token`
  - Request page available at `/password-reset-request`.

### API Client

- `src/services/api.js`
  - Added `authService.confirmPasswordReset(uidb64, token, password)` which posts to `/auth/password-reset/confirm/`.
  - Existing `authService.requestPasswordReset(email)` posts to `/auth/password-reset-request/`.

### UI Components

- Request form: `src/components/PasswordResetRequest.jsx` (renders request form and shows generic success message)
- Reset form: `src/components/PasswordReset.jsx` (reads `uidb64` and `token` from URL params and calls `confirmPasswordReset`)

Note: There are also page-level variants under `src/pages/` (e.g., `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`), but the routed components in `App.jsx` use the `components/` versions. These page files are harmless; they can be removed later to reduce duplication if desired.

---

## Production Setup Checklist

Set the following environment variables in production:

- Core
  - `SECRET_KEY` — strong secret; required.
  - `DEBUG=False`
  - `ALLOWED_HOSTS` — include your domain(s) and Heroku app hostname.
- Frontend URL
  - `FRONTEND_URL=https://usc-pis-5f030223f7a8.herokuapp.com` (or your custom domain)
- Email (choose one)
  - AWS SES
    - `USE_AWS_SES=True`
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_SES_REGION_NAME` (e.g., `us-east-1`)
    - `DEFAULT_FROM_EMAIL=noreply@your-domain`
  - SMTP
    - `EMAIL_HOST` (e.g., `smtp.sendgrid.net`)
    - `EMAIL_PORT=587`
    - `EMAIL_USE_TLS=True`
    - `EMAIL_HOST_USER`
    - `EMAIL_HOST_PASSWORD`
    - `DEFAULT_FROM_EMAIL=noreply@your-domain`
- Optional
  - `PASSWORD_RESET_TIMEOUT=86400` (24h, keep in sync with email copy)

Heroku tip: add these under Settings → Config Vars. Make sure only one email backend path is “active” by providing the necessary env vars.

---

## Verification Steps

1) Reset request (API)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"existing_user@usc.edu.ph"}' \
  https://<your-domain>/api/auth/password-reset-request/
```

- Expected: `200` and generic success message.
- Check logs or mailbox for an email with a link in the form:
  `https://<FRONTEND_URL>/password-reset/<uidb64>/<token>/`

2) Reset confirmation (SPA)

- Open the link from the email.
- Submit a new password in the SPA. Expected: success confirmation and ability to log in with the new password.

3) Simple local smoke test (optional)

```bash
# From repo root
python backend/test_password_reset_simple.py
```

- The script prints an example reset URL and verifies that the password was updated via the confirm endpoint.

---

## Files Changed

- Backend
  - `backend/authentication/urls.py` — added `path('password-reset/confirm/', ...)` for SPA POST confirm.
  - `backend/authentication/views.py` — switched to `EmailService` for reset email sending.
  - `backend/backend/settings.py` — added `PASSWORD_RESET_TIMEOUT`; improved `FRONTEND_URL` fallback for production.
  - `backend/test_password_reset_simple.py` — new script to generate a token and verify password reset.
- Frontend
  - `backend/frontend/frontend/src/services/api.js` — added `confirmPasswordReset` client.
  - `backend/frontend/frontend/src/App.jsx` — updated reset route to `:uidb64/:token`.

Templates already present:
- `backend/templates/emails/password_reset.html`
- `backend/templates/emails/password_reset_email.html`
- `backend/templates/emails/password_reset.txt`

---

## Follow-ups / Considerations

- Email settings duplication: `settings.py` contains multiple email config blocks (SES/SMTP early and a later dev/prod block). Currently the later block wins. Consider consolidating into a single section to avoid confusion.
- Cleanup: Optionally remove the page-level password reset files in `src/pages/` to reduce duplication if only `components/` are routed.
- Observability: If emails fail in production, review provider logs (SES/SendGrid), DNS (SPF/DKIM), and `DEFAULT_FROM_EMAIL`.
- Security: Consider rate limiting reset requests by IP and/or email to reduce abuse.

---

## Done

- Implemented the forgot password feature end-to-end and made it production-safe.
- Added documentation and test script for quick validation.

If you want, I can also: consolidate the email config in `settings.py`, remove duplicate page-level components, or add admin UI toggles to test email templates in production.

