# Production Readiness Audit — USC‑PIS (Sept 2025)

This audit summarizes key findings from a focused review of the backend (Django) and frontend (React/Vite) with an emphasis on security, reliability, observability, performance, build/deploy, and UX. Each finding includes concise rationale to guide the readiness plan.

## Security & Compliance
- Strong Baseline: `SECRET_KEY` enforced via env; `DEBUG` default off; `ALLOWED_HOSTS` set; HSTS, referrer policy, X-Frame, XSS, nosniff enforced; cookies are `Secure`, `HttpOnly`, `SameSite=Lax`; SSL redirect enabled.
- CSP Duplication/Inconsistency: Django settings define CSP_* values, but django-csp isn’t installed. A custom `SecurityHeadersMiddleware` also sets a separate CSP (includes `'unsafe-inline'` and `'unsafe-eval'`).
  - Risk: Two sources of truth + permissive inline/eval in middleware.
- CORS Overlap: `django-cors-headers` configured correctly; `APIResponseMiddleware` also injects CORS headers and handles OPTIONS.
  - Risk: Conflicting headers, harder debugging, potential misconfig.
- Rate Limiting: Feature flag exists (`RATE_LIMIT_ENABLED`) but `RateLimitMiddleware` is commented out in `MIDDLEWARE`.
- File Upload Security: Comprehensive validators (extensions, MIME, signatures, decompression limits, image checks) present; good logging. Empty file logic intentionally relaxed for optional fields.
- Password Policies: Django validators present. `PASSWORD_BREACH_CHECK` feature flag exists but not enforced.
- Session/CSRF: Uses session + token auth; CSRF over sessions enabled. Settings appear secure for production.

## Observability & Monitoring
- Logging: Structured console logging configured by named loggers (api.requests, performance, security). Gunicorn logs piped to stdout.
- Error Capture: No Sentry (or similar) integration for backend/frontend. ErrorBoundary on frontend logs to console only.
- Health Endpoints: `/health` and `/api/health` middleware exists; good for uptime checks.

## Performance & Reliability
- DB: `ATOMIC_REQUESTS=True`, timeouts and connection health checks applied for Postgres. LocMem cache configured; suitable for single dyno, but consider a network cache in scale-up scenarios.
- Static: WhiteNoise with manifest compression enabled. Vite built assets served under `/static` (base set).
- Build/Release: Heroku release phase runs `migrate` and `collectstatic`. Good.
- Frontend: Suspense/lazy used; reasonable code splitting. Icons/manifest paths corrected to `/static/`.

## Configuration & Secrets
- Env Management: `.env.example` present; backend `.env` use documented. Critical envs noted across docs.
- Requirements: Backend pins via `>=` on many packages; cloudinary pinned exactly. Production benefits from exact pins + constraints for reproducibility.
- Node/Tooling: No explicit Node version/engines field for frontend; CI environment may drift.

## API & HTTP Surface
- REST: DRF default permission IsAuthenticated; browsable API enabled; version header middleware present. Pagination + filtering enabled. Good.
- Error Shaping: APIResponseMiddleware forces `Content-Type: application/json` even for non-JSON paths under `/api/`, which can mask certain DRF renderer behaviors. Frontend guards against HTML responses in Axios interceptors.

## Frontend UX, Accessibility, PWA
- UX: Student campaigns page improved (cards + preview). Full preview page added. Inline content renderer added for non-HTML content.
- A11y: MUI components give decent baseline; no explicit audit (labels/contrast/keyboard traps).
- PWA: Manifest exists; generic favicon in place. No service worker/Workbox; installability OK but offline not supported.

## Testing
- Backend: Lightweight scripts `backend/test_*.py` target core flows. Coverage not automated in CI; local guidance present.
- Frontend: Jest configured with 50% thresholds; limited tests present.

## Red Flags & Footguns
- CSP/Headers duplication (settings vs middleware) with permissive inline/eval in middleware.
- Dual CORS handling (corsheaders + APIResponseMiddleware) can create header mismatch.
- Rate limiting disabled in middleware even though feature flag exists.
- Package pinning via `>=` can lead to drift; lockfiles/constraints recommended.
- No centralized error reporting (Sentry) for backend or frontend.

---

## Summary
Overall posture is strong: security headers, auth defaults, static pipeline, and DB safety are sound. Main risks center on duplicated security/CORS logic (harder to validate), lack of runtime error reporting, and dependency reproducibility. Addressing those, plus CI checks and a short test pass, will close the final gaps for production readiness.

