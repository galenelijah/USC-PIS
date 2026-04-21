# Software Requirements Specification (SRS): USC-PIS
**Project:** University of San Carlos Patient Information System (USC-PIS)
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)
**Compliance:** IEEE 830-1998 Standard

---

## 1. Introduction

### 1.1 Purpose
This document defines the formal functional and non-functional requirements for the USC-PIS, a production-grade healthcare information system optimized for the University of San Carlos.

### 1.2 System Overview
The system provides a three-tier architecture (React/Django/PostgreSQL) that digitizes clinical workflows, secures patient health information (PHI) via column-level encryption, and monitors system infrastructure health in real-time.

---

## 2. Functional Requirements (FR)

### 2.1 Identity & Access Management (FR-IAM)
*   **REQ-IAM-01: Domain Enforcement.** Registration restricted to `@usc.edu.ph` email addresses.
*   **REQ-IAM-02: MFA Verification.** 6-digit email code mandatory for all unverified accounts.
*   **REQ-IAM-03: Standardized RBAC.** Permissions MUST be checked against uppercase role constants (e.g., `User.Role.ADMIN`) to prevent authorization mismatches.
*   **REQ-IAM-04: Professional Role Gating.** Role upgrade requests from `STUDENT` status require manual `ADMIN` approval.

### 2.2 Clinical Operations (FR-CLIN)
*   **REQ-CLIN-01: Standardized Formats.** Medical certificates MUST use the Form **ACA-HSD-04F** landscape template.
*   **REQ-CLIN-02: Automated Context Mapping.** Program IDs (e.g., "BSCE") MUST be automatically mapped to full USC program names in clinical exports.
*   **REQ-CLIN-03: PHI Encryption.** All diagnosis and vitals data MUST be stored using `pgcrypto` AES-256 encryption.

### 2.3 Infrastructure Monitoring (FR-DIAG)
*   **REQ-DIAG-01: 7-Point Diagnostic Engine.** The system MUST perform real-time health checks on Database, Email, Backups, Security, Performance, Storage, and Cache.
*   **REQ-DIAG-02: Automated Audit Triggers.** Diagnostics MUST run automatically every 6 hours via a background task engine.
*   **REQ-DIAG-03: Staff Notification Channels.** All staff users MUST have independent controls for **In-App**, **Email**, and **Desktop** notification delivery.

### 2.4 Administration & Outreach (FR-ADMIN)
*   **REQ-ADMIN-01: Global Control.** Master toggle for system-wide automated email communications.
*   **REQ-ADMIN-02: Template CRUD.** Browser-based management of all notification and outreach templates.
*   **REQ-ADMIN-03: Real-time Statistics.** Dashboard display of visits (Today, Last 7/30 days) and infrastructure health status.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security (NFR-SEC)
*   **REQ-SEC-01: PHI Protection.** 100% of sensitive medical fields MUST be encrypted at rest.
*   **REQ-SEC-02: Infrastructure Guard.** HSTS, CSP, and Rate-limiting middleware MUST be active in production.

### 3.2 UI/UX Consistency (NFR-UX)
*   **REQ-UX-01: Responsive Layout.** The UI MUST use a modern Flexbox architecture to avoid fixed-margin display errors on small screens.
*   **REQ-UX-02: Navigation Persistence.** The application header MUST be `sticky` to maintain availability of primary controls.

---

## 4. Technical Architecture
*   **Stack**: React 18, Django 5.1, PostgreSQL 16.
*   **Monitoring**: 7-Point Diagnostic Audit engine.
*   **Outreach**: Gmail API for high-reliability institutional communications.
