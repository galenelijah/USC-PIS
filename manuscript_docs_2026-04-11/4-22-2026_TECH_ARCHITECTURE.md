# System Architecture & Tech Stack: USC-PIS
**Date:** April 22, 2026
**Version:** 3.2.0 (Enhanced Document Management)
**Status:** Academic Ready / Production Verified

---

## 1. Three-Tier Architecture Implementation

### 1.1 Presentation Tier (Frontend)
*   **Core Framework:** React.js (v18.2) via Vite (v5.1).
*   **UI/UX Design System**: Material-UI (MUI v5) with USC Branding.
*   **Clinical Views**:
    *   **Unified History Timeline**: Implements `composite_id` logic to display medical, dental, and document records seamlessly.
    *   **Date Range Filtering**: Custom hooks for unified temporal filtering across all list views.
    *   **Patient Document Dashboard**: Role-restricted interface for staff uploads and patient viewing.
*   **Layout Engine**: Responsive Flexbox architecture with sticky navigation components.

### 1.2 Logic Tier (Backend)
*   **Engine:** Python 3.12+ / Django 5.1+ / DRF 3.14.
*   **Document Management**: `PatientDocumentViewSet` handles role-based multi-part file uploads and Cloudinary integration.
*   **Asynchronous Processing**: `celery` / `redis` for heavy PDF/Excel reporting and mass communications.
*   **Standardized Security**: Global enforcement of uppercase role constants and `IsMedicalStaff` permission classes.

### 1.3 Data Tier (Persistence & Security)
*   **Database:** PostgreSQL 16+.
*   **Encryption**: **pgcrypto** for column-level encryption of clinical PHI.
*   **Uniqueness Guard**: Backend implementation of `TYPE-ID` prefixing to ensure primary key uniqueness across disparate clinical models in unified queries.
*   **Storage**: Cloudinary (Clinical Documents/PDFs).

---

## 2. Advanced Technical Integration

### 2.1 7-Point Infrastructure Diagnostic Engine
Real-time reliability auditing across seven pillars:
1.  **Database**: Connectivity and latency monitoring.
2.  **Email System**: Gmail API (OAuth 2.0) status.
3.  **Backup System**: 7-day snapshot verification.
4.  **Security Shield**: HSTS/SSL/CSP compliance.
5.  **Performance**: Rate-limiting and responsiveness.
6.  **Cloud Storage**: Cloudinary connectivity audit.
7.  **System Speed (Cache)**: Redis read/write verification.

### 2.2 Clinical Integrity Logic
*   **Composite ID Synchronization**: A middleware layer that maps internal database IDs to a `CATEGORY-ID` string (e.g., `MEDICAL-45`, `DOC-12`), preventing React key collisions and data cross-talk in the frontend.
*   **Temporal Query Engine**: Unified backend filtering logic that standardizes "From-To" date range queries across all clinical models.

---

## 3. Infrastructure & Deployment
*   **Host**: Heroku (Production).
*   **Process Management**: `web` (Gunicorn), `worker` (Celery), `beat` (Scheduler).
*   **CI/CD**: GitHub Actions.
*   **Media**: Cloudinary for high-availability clinical document storage.
