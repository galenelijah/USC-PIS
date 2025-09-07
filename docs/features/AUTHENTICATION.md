# Authentication

Base path: `/api/auth/`

Key endpoints

- Register: `POST /api/auth/register/`
- Login: `POST /api/auth/login/`
- Logout: `POST /api/auth/logout/`
- Check email availability: `GET /api/auth/check-email/?email=...`
- Password reset request: `POST /api/auth/password-reset-request/`
- Password reset confirm: `POST /api/auth/password-reset/confirm/<uidb64>/<token>/`
- Database health check: `GET /api/auth/database-health/` (basic DB connectivity)
- Complete profile setup: `POST /api/auth/complete-profile/`
- Profile (ViewSet):
  - `GET /api/auth/profile/` (current user)
  - `PUT/PATCH /api/auth/profile/`

Admin endpoints (user management)

- List users: `GET /api/auth/admin/users/`
- User details: `GET /api/auth/admin/users/{id}/`
- Update role: `POST /api/auth/admin/users/{id}/role/`
- Toggle active: `POST /api/auth/admin/users/{id}/status/`
- Delete user: `DELETE /api/auth/admin/users/{id}/delete/`

Notes

- Authentication: Token or session. Default permission is `IsAuthenticated` globally.
- Roles: ADMIN, STAFF, DOCTOR, NURSE, STUDENT drive access control in app logic.
- Profile completion flow ensures required fields before full app access.

