# SOURCE DOCUMENT: Software Requirements Specification (SRS) - USC-PIS
**Date:** April 20, 2026
**Target AI Task:** Generate a formal IEEE 830-compliant SRS document.
**Revision:** 2.3.0 (Post-Audit Comprehensive Update)

---

## 1. System Overview
The USC Patient Information System (USC-PIS) is a centralized, secure web application designed to digitize medical and dental records for the University of San Carlos Health Services Department. It serves as a comprehensive clinical management tool for students, faculty, and medical staff.

## 2. Functional Requirements (FR)

### 2.1 Authentication & Role Management (FR-AUTH)
*   **REQ-AUTH-01:** Strictly enforce registration using `@usc.edu.ph` email addresses.
*   **REQ-AUTH-02:** Implement a 6-digit email verification code (MFA) for all users.
*   **REQ-AUTH-03:** **Heuristic Role Assignment:** Automatically identify Students vs. Faculty/Staff based on email username patterns (digits vs. text-only).
*   **REQ-AUTH-04:** **Role Selection Workflow:** Users with text-based emails MUST be redirected to `/role-selection` to specify their USC status.
*   **REQ-AUTH-05:** **Self-Service Restrictions:** Users can self-select the `TEACHER` (Faculty) role. Any administrative or medical roles (STAFF, DOCTOR, etc.) MUST be assigned by a system administrator.

### 2.2 Patient & Clinical Management (FR-CLINIC)
*   **REQ-CLINIC-01:** **Patient Onboarding:** Mandatory multi-step profile including encrypted health history (Allergies, Medications, Illnesses).
*   **REQ-CLINIC-02:** **Medical Records:** Capture vitals (BP, Temp, Pulse, RR) and encrypted clinical diagnosis.
*   **REQ-CLINIC-03:** **Dental Records:** Implement FDI World Dental Federation notation (11-48) with visual priority indicators and JSON-based tooth charts.
*   **REQ-CLINIC-04:** **Medical Certificates:** Digital issuance of official USC landscape certificates (**ACA-HSD-04F**) with Physician-only approval workflow and Fitness Status assessment.

### 2.3 Notifications & Educational Campaigns (FR-NOTIF)
*   **REQ-NOTIF-01:** **Multi-Channel Delivery:** Automated alerts via Email (Gmail API) and In-App notifications.
*   **REQ-NOTIF-02:** **Health Campaigns:** Support for visual "PubMats" (PDF/Image) with engagement tracking (Views, CTA clicks).
*   **REQ-NOTIF-03:** **Preference Management:** Users can toggle notification channels and set quiet hours.

### 2.4 Reporting, Analytics & Feedback (FR-DATA)
*   **REQ-DATA-01:** **Reporting Engine:** Generate clinical reports in PDF, XLSX, CSV, and HTML formats.
*   **REQ-DATA-02:** **Automated Scheduling:** Admins can schedule daily/weekly reports with automated email delivery.
*   **REQ-DATA-03:** **Patient Feedback:** Automated survey requests 24 hours post-visit, capturing facility ratings and staff courtesy metrics.
*   **REQ-DATA-04:** **Visual Analytics:** Real-time dashboard charts (Chart.js) for patient trends and feedback sentiment.

### 2.5 System Administration & Utilities (FR-SYS)
*   **REQ-SYS-01:** **Database Backups:** Automated daily PostgreSQL dumps with manual trigger capability.
*   **REQ-SYS-02:** **Health Monitoring:** Real-time system and database health checks with administrator alerts.
*   **REQ-SYS-03:** **File Security:** SHA-256 deduplication and secure hashed storage for all clinical uploads.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security & Privacy (NFR-SEC)
*   **REQ-SEC-01:** **PHI Protection:** Sensitive medical data MUST be encrypted at the database level using `pgcrypto`.
*   **REQ-SEC-02:** **RBAC:** Strict Role-Based Access Control enforcing data silos between patients and medical staff.

### 3.2 Reliability & Performance (NFR-PERF)
*   **REQ-PERF-01:** API response times < 500ms.
*   **REQ-PERF-02:** 99.5% availability target on Heroku infrastructure.

---

## 4. Technical Stack Summary
*   **Frontend:** React (Vite, Redux Toolkit, MUI).
*   **Backend:** Django REST Framework (Python 3.12).
*   **Database:** PostgreSQL 16 with pgcrypto.
*   **Tasks:** Celery + Redis for background jobs.
*   **Services:** Gmail API (Notifications), Cloudinary (Storage).
