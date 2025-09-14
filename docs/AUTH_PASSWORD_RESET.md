# Password Reset (Forgot Password) — Implementation and Usage

## Summary
- Request endpoint: `POST /api/auth/password-reset-request/` — sends a reset email if the account exists.
- Confirm endpoint: `POST /api/auth/password-reset/confirm/` — accepts `{ uidb64, token, password }` to set a new password.
- SPA routes: `/password-reset-request` and `/password-reset/:uidb64/:token`.
- Email: Branded HTML via `emails/password_reset.html` using `EmailService`.
- Security: Token expiry is controlled via `PASSWORD_RESET_TIMEOUT` (default 86400 seconds).

## Backend
- URLs: defined in `backend/authentication/urls.py`.
- Views:
  - `PasswordResetRequestView` — validates email and sends email via `EmailService.send_password_reset_email(user, reset_url)`.
  - `PasswordResetConfirmView` — validates token and sets new password.
- Settings:
  - `FRONTEND_URL` (used to build the reset link in emails)
  - `PASSWORD_RESET_TIMEOUT` (default 24 hours)
  - Email backend via SES or SMTP env vars; `DEFAULT_FROM_EMAIL` sender address

## Frontend
- Route definitions in `src/App.jsx`:
  - `/password-reset-request` → `components/PasswordResetRequest.jsx`
  - `/password-reset/:uidb64/:token` → `components/PasswordReset.jsx`
- API client: `authService.requestPasswordReset(email)` and `authService.confirmPasswordReset(uidb64, token, password)` in `src/services/api.js`.

## Environment (Production)
- Required for password reset links: `FRONTEND_URL=https://your-domain`
- Email delivery: either SES (`USE_AWS_SES=True`, keys, region) or SMTP (`EMAIL_HOST`, `EMAIL_PORT=587`, `EMAIL_USE_TLS=True`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`)
- Sender: `DEFAULT_FROM_EMAIL` (e.g., `noreply@your-domain`)
- Optional: `PASSWORD_RESET_TIMEOUT=86400`

## Verification
1) Trigger reset:
```
curl -X POST https://<your-domain>/api/auth/password-reset-request/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"existing_user@usc.edu.ph"}'
```
2) Open the reset link from the email, set a new password in the SPA.
3) Confirm you can log in with the new password.
4) Optional script: `python backend/test_password_reset_simple.py` (local smoke test).

## Troubleshooting
- No email received: verify provider env vars and `DEFAULT_FROM_EMAIL`; check logs.
- Link 404: confirm route `/password-reset/:uidb64/:token` exists and Django catch‑all serves React.
- Token invalid/expired: request a fresh link; check `PASSWORD_RESET_TIMEOUT`.

