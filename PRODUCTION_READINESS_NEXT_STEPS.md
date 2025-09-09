# Production Readiness — Next Steps (Action Plan)

This plan prioritizes concrete, low-risk steps to finalize production readiness. Each item lists scope, rationale, and a short implementation note.

## P0 — Critical (Do Now)
- Consolidate CSP & Security Headers
  - Rationale: Avoid conflicting policies; remove `'unsafe-inline'`/`'unsafe-eval'` where possible.
  - Action: Choose one approach:
    - Prefer `django-csp`: add package, enable CSP middleware, and keep CSP_* settings; remove CSP from `SecurityHeadersMiddleware`.
    - Or keep custom middleware: align with settings (remove inline/eval) and delete unused CSP_* variables.
- Single Source of Truth for CORS
  - Rationale: Prevent header conflicts/misconfig.
  - Action: Let `django-cors-headers` handle CORS (including OPTIONS). Remove CORS logic from `APIResponseMiddleware`.
- Enable Rate Limiting Middleware in Production
  - Rationale: Throttle abusive clients; flag exists but not active.
  - Action: Uncomment `backend.middleware.RateLimitMiddleware` in `MIDDLEWARE` for production. Keep `RATE_LIMIT_ENABLED` as kill‑switch via env.
- Pin Backend Dependencies
  - Rationale: Reproducible builds and fewer surprises.
  - Action: Replace `>=` with exact pins, add a constraints file, and update deployment docs to use it.

## P1 — High Priority (This Week)
- Add Sentry (Backend + Frontend)
  - Rationale: Capture exceptions, release health, performance traces.
  - Action: Add SDKs, DSN via env, and sample rate settings; scrub PII.
- Harden Axios & API Error Paths
  - Rationale: Ensure consistent handling of auth expiry and server errors without reload loops.
  - Action: Review interceptors for 401/403/5xx flows; ensure redirection only when necessary.
- CI Pipeline (GitHub Actions)
  - Rationale: Basic guardrails before deploy.
  - Action: Lint + type check + backend targeted tests (scripts in `backend/test_*.py`) + frontend build.
- Node/Tooling Versions
  - Rationale: Prevent environment drift across CI/dev/prod.
  - Action: Add `engines` to frontend `package.json` and a `.nvmrc` (or document Node version) to standardize.

## P2 — Important (Next 1–2 Weeks)
- Access Logging & Gunicorn Tuning
  - Rationale: Better request visibility, resilience under load.
  - Action: Set `--access-logfile -` and tune workers/threads (`WEB_CONCURRENCY`/`GUNICORN_CMD_ARGS`).
- Cache Strategy Review
  - Rationale: Move beyond in‑process cache if scaling pods.
  - Action: Document migration path to Redis cache and which views benefit.
- Security Tests
  - Rationale: Safety net for common misconfig.
  - Action: Add a minimal pytest suite to assert critical settings (HSTS, SSL redirect, cookies, CSP headers present).
- API Response Normalization
  - Rationale: Avoid forcing JSON `Content-Type` on all `/api/` responses when non‑JSON is intended.
  - Action: Let DRF negotiate content; keep HTML guard on the client.

## P3 — Enhancements (Nice to Have)
- PWA Polish
  - Rationale: Better install experience.
  - Action: Add 192/512 PNG icons; optional Workbox for offline shell (if required).
- A11y Pass (Frontend)
  - Rationale: Improve usability and compliance.
  - Action: Quick audit of alt text, aria labels, tab order, contrast; adjust MUI props.
- Developer Docs
  - Rationale: Faster onboarding, fewer mistakes.
  - Action: Add sections on rate limit toggles, CSP approach chosen, and how to rotate secrets.

## Concrete Diffs Suggested
- `backend/backend/settings.py`
  - Either add `django-csp` (middleware + settings) OR remove CSP_* and keep a single CSP in `SecurityHeadersMiddleware` (without inline/eval).
  - Remove/disable CORS logic from `APIResponseMiddleware`.
  - Uncomment `backend.middleware.RateLimitMiddleware` in `MIDDLEWARE` (prod only if desired).
- `backend/requirements.txt`
  - Replace `>=` specifiers with exact versions; add `-c constraints.txt` (optional) and document update cadence.
- `backend/frontend/frontend/package.json`
  - Add `"engines": { "node": ">=18 <20" }` (choose your baseline) and consider adding a `.nvmrc`.

## Acceptance Checklist (Quick)
- No duplicate security/CORS headers in responses.
- 429s observed under scripted load > thresholds.
- Sentry shows events from prod with PII scrubbing on.
- CI runs lint + build + targeted tests; main is protected.
- Build reproducibility confirmed after dependency pinning.

---

If you want, I can implement P0 items now (CSP/CORS consolidation, rate limiting toggle, pins), then open a follow‑up PR for Sentry + CI in P1.

