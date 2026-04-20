# System Architecture & Tech Stack: USC-PIS
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)
**Status:** Academic Ready / Production Verified

---

## 1. Three-Tier Architecture Implementation
The USC-PIS follows a rigorous Three-Tier Architecture model to ensure scalability, security, and separation of concerns, providing a clear boundary between presentation, business logic, and data persistence.

### 1.1 Presentation Tier (Frontend)
*   **Technology:** React.js (v18+) powered by Vite for rapid development and optimized build performance.
*   **State Management:** Redux Toolkit provides centralized state handling, particularly for:
    *   `authSlice.js`: Manages user sessions, JWT tokens, and role-based state.
    *   `patientSlice.js`: Handles transient clinical form data during multi-step onboarding.
*   **Routing:** React Router v6 implements programmatic redirection (e.g., forcing unverified users to `/verify-email`).
*   **UI/UX Framework:** Material-UI (MUI) v5 is used to enforce the **USC Branding Theme** (Maroon: `#800000`, Gold: `#FFCC00`). All components are responsive and adhere to clinical design standards.
*   **API Interaction:** Asynchronous REST communication via Axios (`frontend/src/services/api.js`), featuring unified error handling and request/response interceptors for token injection.

### 1.2 Logic Tier (Backend)
*   **Engine:** Python 3.12+ with Django Framework 5.1+.
*   **API Framework:** Django REST Framework (DRF) manages serialization and viewsets.
*   **Asynchronous Processing:** Celery with a Redis broker handles high-latency operations:
    *   **Automated Reporting**: Generation of multi-format exports (PDF, XLSX).
    *   **Outreach**: Delivery of Health Campaigns (PubMats).
    *   **Notifications**: Real-time processing of system alerts and feedback requests.
*   **Custom Middleware Chain:**
    *   `SecurityHeadersMiddleware`: Enforces HSTS (1 year), Content Security Policy (CSP), and X-SS-Protection.
    *   `EmailVerificationMiddleware`: A strict gateway that blocks clinical API access for users who haven't completed 6-digit MFA.
    *   `APIVersionMiddleware`: Injects `X-API-Version` headers for future-proofing.
    *   `RequestLoggingMiddleware`: Audit logging of all incoming requests for security compliance.

### 1.3 Data Tier (Persistence & Security)
*   **Database:** PostgreSQL 16+.
*   **Selective Encryption:** Implementation of the **pgcrypto** extension for column-level encryption. 
*   **Storage Strategy:** 
    *   **Structured Data**: PostgreSQL handles relational clinical and administrative data.
    *   **Unstructured Data (Blobs)**: Cloudinary (via `django-cloudinary-storage`) hosts medical images, PDFs, and PubMats with CDN delivery.

---

## 2. Advanced Technical Integration

### 2.1 PHI Protection (pgcrypto)
To comply with data privacy standards (DPA 2012 / HIPAA-equivalent), sensitive medical data is encrypted symmetrically.
*   **Encryption Logic:** Django `post_save` signals intercept plaintext data and utilize raw PostgreSQL SQL commands (`pgp_sym_encrypt`) to store data as `bytea`.
*   **Decryption Logic:** Custom Model Managers utilize `pgp_sym_decrypt` during retrieval to provide plaintext only to authorized logic layers.
*   **Protected Fields:** Includes patient vitals, diagnosis notes, tooth charts, and emergency contact details.

### 2.2 Identity & Role Management Workflow
*   **Heuristic Detection:** Regex-based username analysis (`/\d/`) during registration defaults numeric usernames to **STUDENT**.
*   **Administrative Gate (Role Request)**: Professional roles (Doctor, Staff, etc.) are gated. Users submit a request via `/role-selection`, triggering an administrative notification.
*   **Safe List Pre-Authorization**: Admins can pre-assign roles to specific emails in the `SafeEmail` table, allowing trusted staff to bypass the "STUDENT" default and "Role Request" flow.

### 2.3 Email Administration Engine
A sophisticated routing system that manages all system-generated communications.
*   **Global Kill-Switch**: `GlobalEmailSettings` allows for immediate suspension of all automated emails during maintenance.
*   **Event-Based Routing**: `SystemEmailConfiguration` maps system events (e.g., `ROLE_REQUEST`) to specific templates and recipients.
*   **Granular Recipient Logic**: Admins can explicitly include or exclude specific users from certain email categories, ensuring relevant communication (e.g., only specific staff receive technical alerts).

### 2.4 Reporting & Analytics
*   **Engine**: Combines `XLSXWriter` for tabular data and `xhtml2pdf` for document-style reports.
*   **Visualization**: Frontend integration with `Chart.js` provides real-time analytics on patient demographics, feedback sentiment, and campaign engagement.

---

## 3. Infrastructure & Deployment
*   **Host**: Heroku (Production) with Gunicorn as the WSGI server.
*   **Process Management**: `Procfile` manages `web` (Gunicorn), `worker` (Celery), and `beat` (Scheduled Tasks) processes.
*   **Optimization**: WhiteNoise handles static file serving with caching headers, and Cloudinary provides image transformations on the fly.
