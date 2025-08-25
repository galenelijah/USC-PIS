# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Django project (settings in `backend/backend/`), apps like `patients/`, `health_info/`, `notifications/`, `medical_certificates/`, templates in `backend/templates/`, static in `backend/staticfiles/`.
- `backend/manage.py`: Django entrypoint; run admin, migrations, and server.
- `backend/test_*.py`: Focused test scripts for core domains (callable directly).
- `backend/frontend/frontend/`: React (Vite) SPA used by the Django backend.
- `docs/`, `config/`, `scripts/`: Supporting documentation, config examples, and helper scripts.

## Build, Test, and Development Commands
- Backend setup: `pip install -r backend/requirements.txt` then `python backend/manage.py migrate`.
- Run backend: `python backend/manage.py runserver` (loads `backend/backend/settings.py`).
- Frontend dev: `cd backend/frontend/frontend && npm install && npm run dev`.
- Frontend build: from repo root `npm run build` (runs install/build in the frontend path).
- Quick tests: run targeted scripts, e.g. `python backend/test_security_improvements.py` or `python backend/test_health_campaigns_simple.py`.
- Coverage (per-script): `coverage run backend/test_health_campaigns_simple.py && coverage report`.

## Coding Style & Naming Conventions
- Python: PEP 8, 4‑space indentation; modules and functions `snake_case`; classes `PascalCase`; Django apps use `snake_case` directories.
- Django: URLs in `backend/backend/urls.py`; settings in `backend/backend/settings.py`; keep migrations atomic and reviewed.
- React: Components `PascalCase`, hooks `useSomething`, keep UI state colocated; prefer function components.
- Imports: group standard lib, third‑party, then local; avoid circular imports in Django apps.

## Testing Guidelines
- Location: lightweight scripts in `backend/test_*.py` validate key flows without full Django test runner.
- How to run: execute scripts directly with `python backend/test_<area>.py`.
- Coverage target: aim for 60%+ backend coverage (see README priorities). Use `coverage run ... && coverage report` to track.
- Conventions: name files `test_<domain>.py`; name functions `test_<behavior>()`; keep side effects isolated and database usage minimal.

## Commit & Pull Request Guidelines
- Commit messages: imperative mood with scope, e.g., `backend: fix report date formatting` or `frontend: build Vite assets for health-info`.
- Pull requests include: concise description, linked issues, setup/verification steps, and screenshots for UI changes.
- Check before submit: runs locally, migrations included (and reversible), `.env` documented if new vars are added, and docs updated where relevant.

## Security & Configuration Tips
- Environment: copy `backend/.env.example` to `backend/.env`; set `SECRET_KEY`, `DATABASE_URL`, Cloudinary (`CLOUDINARY_URL`), and AWS SES email settings as needed.
- Secrets: never commit credentials or tokens; prefer env vars referenced by `backend/backend/settings.py`.
- Media/Email: see `backend/settings_cloudinary_example.py`, `backend/settings_s3_example.py`, and `backend/AWS_SES_SETUP.md` for production-ready configs.

## Session Logs (Recommended)
- Location: `docs/session-notes/` stores dated notes for each working session.
- Create a log: `bash scripts/new-session-log.sh "Brief summary of what changed"`.
- Contents: summary, changes, issues, decisions, next actions, references.
- Change index: keep `SESSION_CHANGES.md` updated for a quick, file-by-file view.

## Next Session Prep
- Checklist: see `docs/next-session/README.md` for environment steps and verifications.
- Focus areas: report downloads, utils monitor endpoints, student dashboard routing (if reproduced).
