# System Architecture & Tech Stack: USC-PIS
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)
**Status:** Academic Ready / Production Verified

---

## 1. Three-Tier Architecture Implementation

### 1.1 Presentation Tier (Frontend)
*   **Core Framework:** React.js (v18.2) initialized via Vite (v5.1) for HMR and optimized esbuild bundling.
*   **UI/UX Design System**: Material-UI (MUI v5) enforcing the official USC branding (Maroon `#800000`, Gold `#FFCC00`).
*   **State & Data Management**: 
    *   `@reduxjs/toolkit` for global states (Authentication, Modals).
    *   `axios` for REST API communication with configured request/response interceptors for JWT token injection.
*   **Form Handling & Validation**: `react-hook-form` paired with `yup` for synchronous client-side validation of clinical data (e.g., phone formatting, secure passwords).
*   **Visualizations**: `chart.js` & `react-chartjs-2` for real-time rendering of the 7-Point Health Audit and patient demographic trends.
*   **Modern Flexbox Layout**: Transitioned from hardcoded offsets to a responsive Flexbox architecture.
    *   **Sidebar**: Persistent `md` and above, temporary drawer for mobile.
    *   **Main Container**: Utilizes `flex-grow: 1` and `min-width: 0` for automatic layout calculation without manual margin hacks.
    *   **Header**: Implemented as a `sticky` component within the flex-main container to maintain document flow consistency.

### 1.2 Logic Tier (Backend)
*   **Engine:** Python 3.12+ with Django Framework 5.1+ and Django REST Framework (DRF) 3.14.
*   **Asynchronous Task Queue**: `celery` backed by `redis` (Broker & Result Backend). Manages heavy operations like PDF generation, Excel exports, and mass email broadcasting without blocking the UI thread.
*   **Reporting Engine**: Utilizes `xhtml2pdf` and `reportlab` for dynamic PDF generation, and `xlsxwriter` / `pandas` for advanced Excel data aggregation.
*   **Communication Gateways**: Exclusive implementation of the `django-gmailapi-backend` (Google OAuth 2.0) for high-deliverability clinical alerts, ensuring all communications are routed through the authenticated USC institutional account.
*   **Diagnostic Engine**: Implementation of a comprehensive **HealthChecker** utility (`backend/utils/health_checks.py`) that performs 7-point infrastructure audits.
*   **Standardized Permissions**: Role checks utilize uppercase constants and `in` operators against role lists (e.g., `User.Role.ADMIN`, `User.Role.STAFF`) to prevent role-string mismatch errors.

### 1.3 Data Tier (Persistence & Security)
*   **Database:** PostgreSQL 16+.
*   **Encryption**: **pgcrypto** for column-level encryption of clinical notes, dental procedures, and patient vitals.
*   **Storage**: Cloudinary (Media/PDFs) and WhiteNoise (Static Assets).

---

## 2. Advanced Technical Integration

### 2.1 7-Point Infrastructure Diagnostic Engine
A proprietary monitoring system that ensures production reliability across seven pillars:
1.  **Database**: Active connection pooling and query latency monitoring.
2.  **Email System**: Gmail API (OAuth 2.0) handshake verification and authentication status.
3.  **Backup System**: Integrity checks and 7-day success window validation.
4.  **Security Shield**: Enforces HSTS (31536000s), SSL Redirects, and CSP headers.
5.  **Performance**: Monitors rate-limiting middleware and system responsiveness.
6.  **Cloud Storage**: Connectivity audit for persistent media (Cloudinary).
7.  **System Speed (Cache)**: Read/write latency verification for the Redis/Cache layer.

### 2.2 Notification & Staff Access Logic
*   **Automatic Profile Initialization**: Backend logic automatically creates notification profiles for all staff/doctor users to ensure 100% reach.
*   **Channel Multiplexing**: Users can independently toggle **In-App**, **Email**, and **Desktop** alerts via the `NotificationPreference` model.
*   **Template Engine**: Database-driven template rendering allows admins to update email content without code deployments.

---

## 3. Infrastructure & Deployment
*   **Host**: Heroku (Production).
*   **Process Management**: 
    *   `web`: Gunicorn WSGI server.
    *   `worker`: Celery for background reporting and email delivery.
    *   `beat`: Scheduler for periodic 6-hour health audits and daily feedback loops.
*   **CI/CD**: Automatic builds via GitHub Actions with esbuild-based minification.
*   **Outreach**: Gmail API for high-reliability institutional communications.
