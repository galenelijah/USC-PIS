# USC-PIS Project Mandates & Environment Guide

This file contains critical project-specific configurations, environment paths, and engineering standards for the USC-DC Patient Information System.

## 1. Environment Configuration
- **Virtual Environment:** `venv_custom/` (Root directory)
- **Python Version:** 3.12 (WSL/Linux)
- **Backend Directory:** `backend/`
- **Activation Command:** `source venv_custom/bin/activate`

## 2. Standard Operating Procedures (SOPs)

### Backend Execution
Always use the following sequence for backend tasks:
```bash
source venv_custom/bin/activate && cd backend && python3 manage.py <command>
```

### Running the SQA Audit
To verify system integrity and generate Chapter 4 results:
```bash
python3 manage.py test tests_unit_v2 tests_integration_v2 tests_performance_v2 --noinput
```

## 3. Engineering Architecture
- **Dual-Database Support:** The system uses **PostgreSQL** in production (Heroku) and **SQLite** for local development/testing.
- **Vendor-Aware Logic:** All migrations and signals must check `connection.vendor`. Do NOT execute PostgreSQL-specific SQL (like `DO $$` or `pgp_sym_encrypt`) on SQLite.
- **Security:** Sensitive patient data (Name, Diagnosis) is encrypted at rest using `pgcrypto` in production. Always ensure signal handlers in `backend/patients/signals.py` and `backend/authentication/signals.py` are preserved.

## 4. Key Testing Scripts
- `backend/tests_unit_v2.py`: Core logic, security audits, and retooling features.
- `backend/tests_integration_v2.py`: End-to-end clinical workflows (ACA-HSD-04F).
- `backend/tests_performance_v2.py`: Latency, concurrency, and overhead benchmarks.

## 5. Directory Structure Reference
- `/backend/authentication`: Auth, MFA, and SafeList.
- `/backend/patients`: Patient records and Encryption signals.
- `/backend/medical_certificates`: PDF generation and fitness assessment.
- `/backend/health_info`: Campaigns and health alerts.
- `/backend/feedback`: Patient surveys and analytics.
