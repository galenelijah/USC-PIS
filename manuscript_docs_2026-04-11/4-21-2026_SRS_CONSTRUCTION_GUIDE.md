# Software Requirements Specification (SRS) Construction Guide: USC-PIS
**Date:** April 21, 2026
**Project:** Modernizing the USC-DC Clinic's Patient Information System (USC-PIS)
**Optimization:** Optimized for Gemini NotebookLM and Gemini Chat as a Source Document.

---

## 1. Introduction
### 1.1 Purpose
This document provides the foundational data and structure required for drafting a formal Software Requirements Specification (SRS) following the IEEE 830 standard. It incorporates the final production-ready features implemented during the April 2026 stabilization phase.

### 1.2 Scope
The USC-PIS is a secure, three-tier healthcare application designed to digitize medical records, automate notifications, and provide real-time infrastructure monitoring for the University of San Carlos (USC).

---

## 2. Overall Description
### 2.1 Product Perspective
*   **Architecture:** Three-Tier (React, Django, PostgreSQL).
*   **Hosting:** Heroku Cloud.
*   **External Interfaces:** 
    *   **Email**: Gmail API (OAuth 2.0) for high-reliability automated notifications.
    *   **Storage:** Cloudinary CDN for persistent media storage.
    *   **Security:** PostgreSQL `pgcrypto` for column-level encryption.

### 2.2 User Classes and Characteristics
| Role | Characteristics | Key Permissions |
| :--- | :--- | :--- |
| **Admin** | System Maintainer | Manage backups, users, and global infrastructure health. |
| **Doctor / Dentist** | Senior Medical | Clinical diagnosis, procedure logging, and certificate approval. |
| **Nurse / Staff** | Clinical Support | Patient registration, vitals tracking, and email administration. |
| **Teacher / Student** | Patient (End-user) | Profile management, record viewing, and campaign engagement. |

---

## 3. System Features (Functional Requirements)

### 3.1 Authentication & Security (IAM)
*   **REQ-1:** System MUST strictly enforce `@usc.edu.ph` domain validation for all registrations.
*   **REQ-2:** All professional roles MUST require administrative approval via a Role Upgrade workflow.
*   **REQ-3:** Permissions MUST be enforced using case-insensitive standardized role constants (e.g., `User.Role.ADMIN`).

### 3.2 Clinical Management (CLIN)
*   **REQ-4:** Medical records MUST capture vital signs, diagnoses, and encrypted treatment notes.
*   **REQ-5:** Dental records MUST implement visual priority mapping and FDI tooth notation (11-48).
*   **REQ-6:** Program IDs MUST be automatically mapped to full USC academic titles for all official exports.

### 3.3 Infrastructure Monitoring (DIAG)
*   **REQ-7:** System MUST perform real-time diagnostics across 7 pillars: Database, Email, Backups, Security, Performance, Storage, and Cache.
*   **REQ-8:** Health diagnostics MUST run automatically every 6 hours via a scheduled audit engine.
*   **REQ-9:** Admins MUST have access to a real-time health dashboard with plain-language diagnostic explanations.

### 3.4 Notification & Staff Control (NOTIF)
*   **REQ-10:** Admins MUST have full CRUD control over notification templates via the browser.
*   **REQ-11:** Staff MUST be able to independently toggle **In-App**, **Email**, and **Desktop** notification channels.
*   **REQ-12:** The system MUST proactively initialize notification profiles for all professional users to ensure 100% alert reach.

### 3.5 UI & Responsiveness (UX)
*   **REQ-13:** The layout MUST utilize a responsive Flexbox architecture to accommodate all screen sizes without hardcoded offsets.
*   **REQ-14:** The application header MUST be `sticky` within the content flow to ensure navigation persistent availability.

---

## 4. Non-Functional Requirements

### 4.1 Security
*   **Encryption-at-Rest:** PHI data MUST be encrypted using AES-256 via `pgcrypto`.
*   **Encryption-in-Transit:** TLS 1.3 enforcement with HSTS.
*   **Identity Shield:** Brute-force protection via rate-limiting middleware.

### 4.2 Availability & Reliability
*   **Backup Window:** Automated daily backups with 7-day retention.
*   **Uptime Target:** 99.5% operational availability.

---

## 5. Implementation Guidance for Gemini
When generating the formal SRS:
1.  **Standard Compliance:** Adhere to IEEE 830-1998 standards.
2.  **DPA 2012 Compliance**: Emphasize how `pgcrypto` and role-based gating satisfy the Philippine Data Privacy Act.
3.  **Visual Elements**: Describe the FDI 2D tooth map and the 7-Point Health Indicator as key system innovations.
