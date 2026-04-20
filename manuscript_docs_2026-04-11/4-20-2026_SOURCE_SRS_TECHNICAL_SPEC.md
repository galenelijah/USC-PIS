# Software Requirements Specification (SRS): USC-PIS
**Project:** University of San Carlos Patient Information System (USC-PIS)
**Date:** April 20, 2026
**Version:** 3.0.0 (Comprehensive Thesis Finalization)
**Compliance:** IEEE 830-1998 Standard

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to provide a complete and detailed specification of the requirements for the USC-PIS. It defines the functional, non-functional, and technical standards required for a secure, digitized patient information system.

### 1.2 System Overview
The USC-PIS is a centralized clinical management platform designed to replace legacy paper-based systems at the USC Health Services Department. It facilitates the digital management of medical/dental records, patient onboarding, medical certificates, and automated health outreach.

---

## 2. Functional Requirements (FR)

### 2.1 Identity & Access Management (FR-IAM)
*   **REQ-IAM-01: Domain Enforcement.** The system MUST only allow registration from official `@usc.edu.ph` email addresses.
*   **REQ-IAM-02: Multi-Factor Authentication (MFA).** All users MUST verify their identity via a 6-digit code sent to their USC email upon registration and sensitive login events.
*   **REQ-IAM-03: Heuristic Role Classification.** The system MUST parse email usernames (e.g., `21100727` vs `elfabian`) to automatically distinguish between Students and Faculty/Staff.
*   **REQ-IAM-04: Administrative Role Gate.** 
    *   Professional roles (DOCTOR, DENTIST, NURSE, STAFF) MUST be requested by the user and approved by an ADMIN.
    *   Admins MUST be able to assign specific clinical permissions during the approval process.
*   **REQ-IAM-05: Safe List Pre-Authorization.** Admins MUST be able to pre-authorize specific email addresses with pre-assigned roles to bypass the standard request flow.

### 2.2 Clinical Operations (FR-CLIN)
*   **REQ-CLIN-01: Multi-Step Patient Onboarding.** New users MUST complete a comprehensive health profile, including past medical history, allergies, and medications.
*   **REQ-CLIN-02: Encrypted Medical Records.** Physicians MUST be able to record visit vitals and clinical diagnoses. Sensitive fields MUST be stored using AES-256 encryption.
*   **REQ-CLIN-03: ISO/FDI Dental Charting.** Dentists MUST be able to manage tooth-specific conditions using the FDI World Dental Federation notation (11-48) with a visual JSON-based interactive chart.
*   **REQ-CLIN-04: Medical Certificate Issuance.** The system MUST generate official USC landscape certificates (**ACA-HSD-04F**) only after physician approval and fitness assessment.

### 2.3 System Communications (FR-COMM)
*   **REQ-COMM-01: Automated Health Campaigns.** Admins MUST be able to create and schedule "PubMats" (educational graphics) with engagement tracking.
*   **REQ-COMM-02: Global Email Control.** A master kill-switch MUST be available to disable all system-wide automated emails instantly.
*   **REQ-COMM-03: Event-Based Routing.** Admins MUST be able to define specific templates and recipient inclusion/exclusion lists for system events (e.g., Role Requests).

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security & Privacy (NFR-SEC)
*   **REQ-SEC-01: Data at Rest.** All Personal Health Information (PHI) MUST be encrypted at the database column level using PostgreSQL `pgcrypto`.
*   **REQ-SEC-02: Data in Transit.** All communication MUST be secured via TLS 1.3 (HTTPS).
*   **REQ-SEC-03: App Security.** The system MUST implement HSTS, CSP, and XSS protection middleware.

### 3.2 Reliability & Performance (NFR-REL)
*   **REQ-REL-01: Availability.** The system target is 99.9% uptime on Heroku production environment.
*   **REQ-REL-02: Latency.** API endpoints MUST respond in < 300ms for standard operations.
*   **REQ-REL-03: Background Processing.** Email and Report tasks MUST be offloaded to Celery to prevent UI blocking.

---

## 4. Technical Architecture Summary
*   **Frontend:** React 18, Redux Toolkit (State), MUI 5 (Design).
*   **Backend:** Django 5.1, Django REST Framework 3.15.
*   **Database:** PostgreSQL 16 (Primary), Redis 7 (Caching/Celery).
*   **Integrations:** Gmail API (SMTP), Cloudinary (Blobs), Heroku (PaaS).
