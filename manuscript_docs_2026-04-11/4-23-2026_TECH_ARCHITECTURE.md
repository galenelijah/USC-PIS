# System Architecture & Tech Stack: USC-PIS
**Date:** April 23, 2026
**Version:** 3.3.0 (Hardened Document Security)
**Status:** Academic Ready / Production Verified

---

## 1. Three-Tier Architecture Implementation

### 1.1 Presentation Tier (Frontend)
*   **Core Framework:** React.js (v18.2) via Vite (v5.1).
*   **Secure Document Workflow**: Shifted from `<a>` tag redirection to an `onClick` blob retrieval system. Uses `window.URL.createObjectURL` to handle secure data streams from the backend.
*   **Clinical Views**:
    *   **Unified History Timeline**: Implements `composite_id` logic to display medical, dental, and document records.
    *   **Secure Dashboard**: Replaces "View" links with state-managed "Download" triggers for all clinical attachments.

### 1.2 Logic Tier (Backend)
*   **Engine:** Python 3.12+ / Django 5.1+ / DRF 3.14.
*   **Document Download Proxy**: A custom action using the official Cloudinary SDK (`private_download_url`).
    *   **Signature Engine**: Automatically detects `resource_type` (image vs. raw) and handles PDF extension matching for authorized retrieval.
    *   **Session Isolation**: Uses isolated `requests.Session()` with forced header clearing to prevent internal Auth token leakage to external CDNs.
*   **Asynchronous Processing**: `celery` / `redis` for mass communications.

### 1.3 Data Tier (Persistence & Security)
*   **Database:** PostgreSQL 16+.
*   **Encryption**: **pgcrypto** for column-level encryption of clinical PHI.
*   **Storage**: Cloudinary (Persistent storage for all clinical attachments).
    *   **Config Logic**: Enhanced `CLOUDINARY_STORAGE` settings with explicit `RAW_ASSETS` categorization to ensure PDFs and Excel files are handled correctly by the retrieval engine.

---

## 2. Advanced Technical Integration

### 2.1 7-Point Infrastructure Diagnostic Engine
Real-time reliability auditing across seven pillars:
1.  **Database**: Connectivity and latency monitoring.
2.  **Email System**: Gmail API (OAuth 2.0) status.
3.  **Backup System**: 7-day snapshot verification.
4.  **Security Shield**: HSTS/SSL/CSP compliance.
5.  **Performance**: Rate-limiting and responsiveness.
6.  **Cloud Storage**: Cloudinary connectivity and retrieval audit.
7.  **System Speed (Cache)**: Redis read/write verification.

### 2.2 Secure Retrieval Logic
*   **Two-Step Fetch**: The system implements a "Public-First with Signed Fallback" logic. It attempts a clean public fetch to minimize overhead, falling back to a pre-signed "Master Key" retrieval if the asset is restricted.
*   **Transformation Bypass**: Specifically designed to bypass Cloudinary's "unsigned transformation" restrictions for PDFs, ensuring 100% download reliability.

---

## 3. Infrastructure & Deployment
*   **Host**: Heroku (Production).
*   **Process Management**: `web` (Gunicorn), `worker` (Celery), `beat` (Scheduler).
*   **Media**: Cloudinary (authorized retrieval layer).
