# System Architecture & Tech Stack: USC-PIS
**Date:** April 11, 2026
**Version:** 2.2.2
**Status:** Technical Finalization

---

## 1. Three-Tier Architecture Implementation
The USC-PIS follows a strict Three-Tier Architecture model to ensure scalability, security, and separation of concerns.

### 1.1 Presentation Tier (Frontend)
*   **Technology:** React.js (v18+) with Vite for build optimization.
*   **State Management:** Redux Toolkit (`frontend/src/features/authentication/authSlice.js`).
*   **Routing:** React Router v6 (`frontend/src/App.jsx`).
*   **UI Framework:** Material-UI (MUI) for a professional, clinical aesthetic.
*   **Interaction:** Communicates with the Logic Tier via asynchronous REST API calls using Axios (`frontend/src/services/api.js`).

### 1.2 Logic Tier (Backend)
*   **Technology:** Python 3.12+ with Django Framework 5.1+.
*   **API Engine:** Django REST Framework (DRF) for robust endpoint management.
*   **Asynchronous Processing:** Celery with Redis for background tasks (Email delivery, Report generation).
*   **Middleware:** 
    *   `SecurityHeadersMiddleware`: Enforces HSTS, CSP, and XSS protection.
    *   `EmailVerificationMiddleware`: Blocks unverified users from accessing clinical logic.

### 1.3 Data Tier (Database)
*   **Technology:** PostgreSQL 16+.
*   **ORM:** Django Models for structured data management.
*   **Selective Encryption:** Integration of PostgreSQL `pgcrypto` extension for column-level encryption of sensitive health data (PII/PHI).

---

## 2. Technical Integration Details

### 2.1 Column-Level Encryption (pgcrypto)
The system protects sensitive medical data (e.g., allergies, medications, clinical notes) using the `pgcrypto` symmetric encryption.
*   **Trigger:** Implemented via Django signals in `backend/authentication/signals.py`.
*   **Mechanism:** On `post_save`, the `encrypt_sensitive_fields` function executes a raw SQL command:
    ```sql
    UPDATE {table} SET {column} = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s
    ```
*   **Fields Protected:** `illness`, `allergies`, `medications`, `physical_exam_notes`, `chief_complaints`.

### 2.2 External API Integrations
*   **Email Services:** 
    *   **Primary:** Gmail API via OAuth 2.0 (Google Cloud Console).
    *   **Backend:** `django-gmailapi-backend` configured in `settings.py`.
*   **File Storage:**
    *   **Production:** Cloudinary via `django-cloudinary-storage` for secure, off-site media hosting.
    *   **Development:** Local filesystem fallback in `MEDIA_ROOT`.

### 2.3 Real-Time Notification Logic
While a full WebSocket migration is planned, the system currently employs a high-frequency polling mechanism paired with Celery tasks (`backend/notifications/tasks.py`) to ensure timely delivery of in-app alerts and emails.

---

## 3. Deployment Configuration (Heroku)
*   **Web Server:** Gunicorn with `--log-file -` and `--timeout 120`.
*   **Worker:** Celery worker with `--concurrency=2`.
*   **Release Phase:** Automated migrations and static file collection via `Procfile`.
