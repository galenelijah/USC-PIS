# System Architecture & Tech Stack: USC-PIS
**Date:** April 20, 2026
**Version:** 2.3.0 (Post-Audit Refinement)
**Status:** Technical Finalization

---

## 1. Three-Tier Architecture Implementation
The USC-PIS follows a strict Three-Tier Architecture model to ensure scalability, security, and separation of concerns.

### 1.1 Presentation Tier (Frontend)
*   **Technology:** React.js (v18+) with Vite for build optimization.
*   **State Management:** Redux Toolkit (`frontend/src/features/authentication/authSlice.js`).
*   **Routing:** React Router v6 (`frontend/src/App.jsx`).
*   **UI Framework:** Material-UI (MUI) v5 for a professional, clinical aesthetic.
*   **Interaction:** Communicates with the Logic Tier via asynchronous REST API calls using Axios (`frontend/src/services/api.js`).

### 1.2 Logic Tier (Backend)
*   **Technology:** Python 3.12+ with Django Framework 5.1+.
*   **API Engine:** Django REST Framework (DRF) for robust endpoint management.
*   **Asynchronous Processing:** Celery with Redis for background tasks (Email delivery, Report generation, Feedback automation).
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
The system protects sensitive medical data using `pgcrypto` symmetric encryption.
*   **Trigger:** Implemented via Django signals in `backend/authentication/signals.py`.
*   **Mechanism:** On `post_save`, the system executes raw SQL to encrypt fields before they are persisted as `bytea` types.
*   **Fields Protected:** 
    *   User Table: `illness`, `allergies`, `medications`, `existing_medical_condition`.
    *   Patient Table: `emergency_contact_number`.
    *   Clinical Tables: `chief_complaints`, `clinical_notes`, `diagnosis`.

### 2.2 External API Integrations
*   **Email Services:** 
    *   **Primary:** Gmail API via OAuth 2.0 (Google Cloud Console).
    *   **Backend:** `django-gmailapi-backend` for high deliverability.
*   **File Storage:**
    *   **Production:** Cloudinary via `django-cloudinary-storage` for secure, off-site media hosting with automated CDN optimization.
    *   **Development:** Local filesystem fallback in `MEDIA_ROOT`.

### 2.3 Advanced Workflow Logic
*   **Heuristic Role Detection:** A regex-based detection (`/\d/`) in the email username differentiates between Students and Faculty/Staff during registration.
*   **Self-Service Role Selection:** Post-verification redirection to `/role-selection` allows faculty/staff to choose their specific professional role (TEACHER, DOCTOR, STAFF, etc.).
*   **Report Generation:** Uses `XLSXWriter` for Excel and `xhtml2pdf` for PDF generation, with a robust fallback mechanism for missing system dependencies.

---

## 3. Deployment Configuration (Heroku)
*   **Web Server:** Gunicorn with optimized worker configurations.
*   **Worker:** Celery worker handles long-running tasks to prevent request timeouts.
*   **Release Phase:** Automated migrations, static file collection, and environment health checks via `Procfile`.
