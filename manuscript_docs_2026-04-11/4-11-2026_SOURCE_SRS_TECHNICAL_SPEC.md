# SOURCE DOCUMENT: Software Requirements Specification (SRS) - USC-PIS
**Date:** April 11, 2026
**Target AI Task:** Generate a formal IEEE 830-compliant SRS document.

---

## 1. System Overview
The USC-DC Patient Information System (USC-PIS) is a centralized, secure web application designed to digitize medical and dental records for the University of San Carlos Health Services Department.

## 2. Functional Requirements (High Priority)

### 2.1 Authentication & Domain Control (FR-AUTH)
*   **REQ-AUTH-01:** The system MUST strictly enforce registration using `@usc.edu.ph` email addresses.
*   **REQ-AUTH-02:** The system MUST implement a 6-digit email verification code for all new and existing users.
*   **REQ-AUTH-03:** A "Safe List" MUST exist to allow designated testing accounts (QA) to bypass domain restrictions.

### 2.2 Patient Management (FR-PAT)
*   **REQ-PAT-01:** Users MUST complete a multi-step profile including personal data, medical history (Health Checklist), and emergency contacts.
*   **REQ-PAT-02:** The system MUST auto-generate a clinical `Patient` profile upon completion of the user onboarding flow.
*   **REQ-PAT-03:** Clinic staff MUST be able to filter patients by academic program, year level, and semester.

### 2.3 Clinical Records & Certificates (FR-CLINIC)
*   **REQ-CLINIC-01:** The system MUST capture vital signs (BP, Temp, Pulse, RR) within each medical visit record.
*   **REQ-CLINIC-02:** Dental records MUST utilize the FDI World Dental Federation notation (Teeth 11-48).
*   **REQ-CLINIC-03:** The system MUST generate a print-ready PDF for Medical Certificates following the official USC landscape template (**ACA-HSD-04F**).
*   **REQ-CLINIC-04:** Only authorized Physicians (Doctor/Dentist roles) SHALL have the permission to approve or reject medical certificates.

### 2.4 Notifications & Campaigns (FR-NOTIF)
*   **REQ-NOTIF-01:** The system MUST send automated in-app and email notifications for certificate approvals and health campaigns.
*   **REQ-NOTIF-02:** Users MUST be able to configure "Quiet Hours" and toggle notification preferences.

---

## 3. Non-Functional Requirements

### 3.1 Security (NFR-SEC)
*   **REQ-SEC-01:** Sensitive Patient Health Information (PHI) MUST be encrypted at the column level using the PostgreSQL `pgcrypto` extension.
*   **REQ-SEC-02:** All API communication MUST be protected by Token-based authentication and CSRF/XSS security headers.

### 3.2 Performance (NFR-PERF)
*   **REQ-PERF-01:** Dashboard load times MUST be under 1.0 second for standard user profiles.
*   **REQ-PERF-02:** The system MUST support at least 50 concurrent users during the pilot phase.

---

## 4. System Architecture
*   **Frontend:** React.js (Vite, Redux Toolkit, Material-UI).
*   **Backend:** Django REST Framework (Python 3.12).
*   **Database:** PostgreSQL 16 with pgcrypto.
*   **Hosting:** Heroku Cloud Platform.
