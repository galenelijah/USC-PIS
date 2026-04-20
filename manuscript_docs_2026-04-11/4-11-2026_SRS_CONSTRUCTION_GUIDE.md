# Software Requirements Specification (SRS) Construction Guide: USC-PIS
**Date:** April 11, 2026
**Project:** Modernizing the USC-DC Clinic's Patient Information System (USC-PIS)
**Optimization:** Optimized for Gemini NotebookLM and Gemini Chat as a Source Document.

---

## 1. Introduction
### 1.1 Purpose
This document provides the foundational data and structure required for Gemini/NotebookLM to draft a formal Software Requirements Specification (SRS). It follows the IEEE 830 standard adapted for a university clinic environment.

### 1.2 Scope
The USC-PIS is a web-based, three-tier application designed to digitize health records, automate notifications (Email/In-app), and streamline clinic operations (Medical/Dental) at the University of San Carlos (USC).

---

## 2. Overall Description
### 2.1 Product Perspective
*   **Architecture:** Three-Tier (React Frontend, Django Backend, PostgreSQL Database).
*   **Hosting:** Heroku Cloud Platform.
*   **External Interfaces:** 
    *   **Email:** Gmail API (OAuth 2.0) for automated notifications.
    *   **Storage:** Cloudinary (Production) / Local Filesystem (Development).
    *   **Security:** PostgreSQL `pgcrypto` for column-level encryption of sensitive medical data.

### 2.2 User Classes and Characteristics
| Role | Characteristics | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin** | System Maintainer | Manage users, backups, system health, and email logs. |
| **Doctor / Dentist** | Medical Professional | Create/edit records, diagnose, assess fitness, approve certificates. |
| **Nurse / Staff** | Clinic Admin | Register patients, record vitals, generate reports, manage campaigns. |
| **Student** | Patient (End-user) | Update profile, view own records, request certificates, give feedback. |
| **Teacher** | Patient (Staff-user) | Similar to Student but with Department-specific profile fields. |

### 2.3 Operating Environment
*   **Client:** Modern web browsers (Chrome, Firefox, Safari, Edge).
*   **Server:** Linux-based Heroku Dynos (Gunicorn/Django).
*   **Database:** PostgreSQL with `pgcrypto` extension.

---

## 3. System Features (Functional Requirements)

### 3.1 Authentication & Domain Enforcement
*   **REQ-1:** System MUST strictly accept only `@usc.edu.ph` email addresses for registration.
*   **REQ-2:** Retroactive Verification: New and existing unverified users MUST verify their account via a 6-digit email code before accessing the dashboard.
*   **REQ-3:** Safe List: Admin-managed list of emails that bypass domain/verification for testing purposes.

### 3.2 Patient & Profile Management
*   **REQ-4:** Multi-step Profile Setup: Users must complete personal, physical, and medical history (Health Checklist Fig. 3) before a patient record is generated.
*   **REQ-5:** Advanced Filtering: Staff MUST be able to segment patients by Academic Year, Semester, Program, and Year Level.

### 3.3 Medical & Dental Records
*   **REQ-6:** Medical Records: Must capture diagnosis, treatment, vital signs, and clinical notes.
*   **REQ-7:** Dental Records: Must support visual priority indicators (Urgent to Low) and FDI tooth notation (11-48).
*   **REQ-8:** RBAC Enforcement: Students/Teachers can ONLY view their own records; Medical staff can view/edit all.

### 3.4 Medical Certificates (ACA-HSD-04F)
*   **REQ-9:** Template-based Generation: Certificates MUST use the official USC landscape layout.
*   **REQ-10:** Approval Workflow: Staff can draft; ONLY Doctors can assess fitness status (Fit/Not Fit) and approve/reject.

### 3.5 Reporting & Analytics
*   **REQ-11:** Multi-Format Exports: System MUST support PDF, Excel, CSV, JSON, and HTML exports.
*   **REQ-12:** Report Types: Support for Patient Summary, Visit Trends, Treatment Outcomes, and Feedback Analysis.
*   **REQ-13:** Automated Scheduling: Admins can schedule daily/weekly/monthly report generation with automated email delivery to recipients.
*   **REQ-14:** Data Visualization: Integration of Chart.js for real-time dashboard stats and feedback analysis reports.

### 3.6 Notifications & Messaging
*   **REQ-15:** Multi-Channel Delivery: Notifications MUST be deliverable via Email, In-App, or both.
*   **REQ-16:** Notification Templates: Reusable templates for reminders (Medication, Appointment, Dental) and health campaigns.
*   **REQ-17:** User Preferences: Users MUST be able to toggle specific notification types and set "Quiet Hours" to suppress alerts.

### 3.7 Feedback & Patient Satisfaction
*   **REQ-18:** Post-Visit Feedback: Automated feedback requests sent 24 hours after a clinic visit.
*   **REQ-19:** Qualitative Metrics: Capture star ratings (1-5), staff courtesy (Yes/No), and improvement suggestions.

### 3.8 File Uploads & Security
*   **REQ-20:** Secure Storage: SHA-256 checksums MUST be used to detect and prevent duplicate file uploads.
*   **REQ-21:** Access Control: Files are only accessible to the uploader and authorized clinic staff.

---

## 4. Non-Functional Requirements

### 4.1 Security
*   **Data at Rest:** Sensitive columns (allergies, medications, etc.) MUST be encrypted using `pgcrypto`.
*   **Data in Transit:** TLS/SSL enforcement via Heroku.
*   **Session Security:** 24-hour token expiry with secure cookie handling.

### 4.2 Performance
*   **Response Time:** API requests should resolve in <500ms for standard CRUD operations.
*   **Concurrency:** Support at least 50 simultaneous users during pilot testing.

### 4.3 Availability
*   **Uptime:** 99.5% availability target on Heroku.

---

## 5. Implementation Guidance for Gemini
When writing the SRS based on this file:
1.  **Use Formal Tone:** Ensure requirements use "MUST", "SHALL", and "SHOULD".
2.  **Reference the Manuscript:** Mention compliance with "GroupL_WorkingManuscriptv2.2.2".
3.  **Elaborate on Appendix G:** Include all mandatory features listed in the thesis requirements, including the newly detailed Reports and Notifications systems.
