# Testing Methodology & Quality Assurance: USC-PIS Full-Spectrum Validation
**Date:** April 24, 2026
**Version:** 4.0.0 (Defense Readiness & Full Traceability)

---

## 1. Comprehensive Testing Framework

The final validation phase (April 24, 2026) established a full-spectrum testing suite designed to provide 100% coverage of functional and security requirements defined in the USC-DC PIS Manuscript v2.2.2.

### 1.1 Multi-Tiered Verification Strategy
*   **Tier 1: Security & Encryption Audit (Unit).** Validation of PostgreSQL `pgcrypto` column-level encryption for sensitive medical data.
*   **Tier 2: Business Logic & Domain Validation (Unit).** Strict enforcement of `@usc.edu.ph` domain and heuristic role assignment.
*   **Tier 3: End-to-End Clinical Workflows (Integration).** Simulation of the complete patient journey from registration to medical certificate issuance (Form ACA-HSD-04F).
*   **Tier 4: RBAC & Permission Boundaries (Integration).** Exhaustive verification of cross-role access restrictions (e.g., Dentist vs. Nurse vs. Student).
*   **Tier 5: Latency & Concurrency Stress (Performance).** Benchmarking report generation speeds and system stability under concurrent user loads.

---

## 2. Security & Logic Validation

### 2.1 PGP Symmetric Encryption Audit (pgcrypto)
*   **Method**: Raw SQL Hash Verification.
*   **Requirement**: "Basic Security 1: Encryption" (Manuscript Section II.B.6).
*   **Test Case**: Inserting medical notes and querying the database via raw SQL to ensure binary hash storage.

### 2.2 MFA & Safe List Bypass
*   **Method**: Authentication Flow Simulation.
*   **Requirement**: "Basic Security 2: RBAC" (Manuscript Section II.B.2).
*   **Test Case**: Verifying that pre-authorized emails in the `SafeEmail` table bypass the 6-digit verification code requirement for rapid deployment testing.

---

## 3. Clinical & Administrative Workflow Validation

### 3.1 The Certificate Pipeline (ACA-HSD-04F)
*   **Method**: Pipeline Simulation.
*   **Requirement**: "Objective 6: Medical Certificate Optimization" (Manuscript Section I.D.6).
*   **Flow**: 
    1. Nurse records patient vitals.
    2. Doctor retrieves record and issue "Fit" status.
    3. System generates digital certificate matching the official USC template.

### 3.2 Feedback Analytics Loop
*   **Method**: Data Capture Verification.
*   **Requirement**: "Objective 3: Patient Feedback System" (Manuscript Section I.D.3).
*   **Test Case**: Student submits a 5-star evaluation; Admin dashboard immediately reflects updated aggregate statistics and rating distribution.

---

## 4. Performance & Boundary Testing

### 4.1 Boundary Data Validation
*   **Method**: Fault Injection.
*   **Requirement**: "System Integration Risks" (Manuscript Section II.C.2).
*   **Test Case**: Attempting to submit clinical forms with empty required fields (Chief Complaint, Diagnosis).
*   **Success Condition**: Backend MUST return `400 Bad Request` with field-specific validation errors.

### 4.2 High-Concurrency Load
*   **Method**: Multi-Threaded Stress Test.
*   **Requirement**: "Objective 5: Notifications & Campaigns" (Manuscript Section I.D.5).
*   **Scenario**: 20+ concurrent users fetching Health Campaign data simultaneously on Heroku.
*   **Success Condition**: 0% request drop rate and average latency < 500ms under load.
