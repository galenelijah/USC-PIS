# Software Requirements Specification (SRS): USC-PIS
**Project:** University of San Carlos Patient Information System (USC-PIS)
**Date:** April 22, 2026
**Version:** 3.2.0 (Enhanced Document Management)
**Compliance:** IEEE 830-1998 Standard

---

## 1. Introduction

### 1.1 Purpose
This document defines the formal functional and non-functional requirements for the USC-PIS, a production-grade healthcare information system optimized for the University of San Carlos.

### 1.2 System Overview
The system provides a three-tier architecture (React/Django/PostgreSQL) that digitizes clinical workflows, secures patient health information (PHI) via column-level encryption, and now integrates external document management.

---

## 2. Functional Requirements (FR)

### 2.1 Identity & Access Management (FR-IAM)
*   **REQ-IAM-01: Domain Enforcement.** Registration restricted to `@usc.edu.ph` email addresses.
*   **REQ-IAM-02: MFA Verification.** 6-digit email code mandatory.
*   **REQ-IAM-03: Standardized RBAC.** Permissions MUST be checked against uppercase role constants.

### 2.2 Clinical Operations (FR-CLIN)
*   **REQ-CLIN-01: Standardized Formats.** Medical certificates MUST use the Form **ACA-HSD-04F** landscape template.
*   **REQ-CLIN-02: Unified Clinical Timeline.** The system MUST provide a chronological view of all medical, dental, and external document records.
*   **REQ-CLIN-03: PHI Encryption.** All diagnosis and vitals data MUST be stored using `pgcrypto` AES-256 encryption.
*   **REQ-CLIN-04: Date Range Filtering.** All clinical list views MUST support "From" and "To" date filters for granular record retrieval.
*   **REQ-CLIN-05: Patient Document Ingestion.** The system MUST allow clinic staff to upload and categorize external files (X-Rays, Lab Results) to patient profiles.

### 2.3 Infrastructure Monitoring (FR-DIAG)
*   **REQ-DIAG-01: 7-Point Diagnostic Engine.** Real-time health checks on Database, Email, Backups, Security, Performance, Storage, and Cache.
*   **REQ-DIAG-02: Automated Audit Triggers.** Diagnostics MUST run every 6 hours.
*   **REQ-DIAG-03: Composite ID Tracking.** Unique record identification MUST use a `TYPE-ID` prefix to prevent database ID collisions in unified views.

### 2.4 Administration & Outreach (FR-ADMIN)
*   **REQ-ADMIN-01: Global Control.** Master toggle for system-wide automated email communications.
*   **REQ-ADMIN-02: Template CRUD.** Browser-based management of all notification and outreach templates.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security (NFR-SEC)
*   **REQ-SEC-01: PHI Protection.** 100% of sensitive medical fields MUST be encrypted at rest.
*   **REQ-SEC-02: Document Privacy.** External documents MUST only be accessible to clinical staff and the specific patient owner.

### 3.2 UI/UX Consistency (NFR-UX)
*   **REQ-UX-01: Responsive Layout.** The UI MUST use a modern Flexbox architecture.
*   **REQ-UX-02: Terminology Accuracy.** Clinical dental modules MUST be labeled "Consultations" to reflect diagnostic assessment scope.

---

## 4. Technical Architecture
*   **Stack**: React 18, Django 5.1, PostgreSQL 16.
*   **Monitoring**: 7-Point Diagnostic Audit engine.
*   **Outreach**: Gmail API for high-reliability institutional communications.
*   **Storage**: Cloudinary for clinical document persistence.
