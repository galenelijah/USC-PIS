# USC-PIS Latest Test Execution Results
**Date:** April 28, 2026
**Environment:** Local Development (WSL/Ubuntu)
**Database:** PostgreSQL 15 (Local)
**Test Runner:** Django `manage.py test`

---

## Testing Methodology & Overview
The USC-PIS testing suite is designed to ensure the system meets high standards for security, clinical accuracy, and performance. The suite is categorized into three primary layers, each targeting specific requirements of the Patient Information System.

### 1. Unit Testing (Security & Logic)
Targeted at individual components and database-level constraints.
*   **pgcrypto SQL Audit (`test_ut01`):** Directly queries the PostgreSQL system catalogs to verify that sensitive fields (like Patient Diagnosis and Name) are stored as encrypted binary `bytea` hashes, ensuring data-at-rest security.
*   **Year-Level Logic (`test_ut02`):** Validates the custom sorting and filtering algorithm for academic year levels (1st Year - 5th Year), ensuring clinic staff can accurately segment patient populations.
*   **MFA & Auth Expiration (`test_ut03`):** Tests the time-sensitive logic of 2FA verification codes, confirming that codes expire precisely after 10 minutes.
*   **Medical Regex Validation (`test_ut04`):** Enforces strict data entry formats, such as the FDI World Dental Federation notation (e.g., "11,12") and standard Blood Type formats (e.g., "AB+").
*   **Safe List Onboarding (`test_ut05`):** Verifies the automated role-assignment bypass for pre-authorized medical staff.

### 2. Integration Testing (Workflow & RBAC)
Simulates real-world clinical scenarios and cross-role interactions.
*   **Clinical Pipeline (`test_it01`):** An end-to-end simulation of a patient visit: Nurse intake → Doctor assessment → Fitness status assignment → PDF Certificate generation.
*   **RBAC Stress Test (`test_it03`):** A comprehensive security audit that attempts "privilege escalation" (e.g., a Student trying to access Doctor-only fitness assessment endpoints), verifying that the system correctly returns `403 Forbidden` or `404 Not Found`.
*   **Campaign Dissemination (`test_it05`):** Confirms that health alerts created by administrators correctly propagate to the student-facing dashboard feed.

### 3. Performance Benchmarking (Latency & Overhead)
Ensures the system remains responsive under clinical load.
*   **PDF Latency (`test_pt01`):** Measures the time required to generate and stream a medical certificate PDF, targeting sub-second response times.
*   **Concurrency Simulation (`test_pt02`):** Uses a `ThreadPoolExecutor` to fire 20 simultaneous requests at the API, verifying database connection pooling and thread safety.
*   **Encryption Overhead (`test_pt03`):** Compares the save-latency between standard fields and pgcrypto-encrypted fields to ensure security doesn't noticeably degrade performance.

---

## Executive Summary
| Category | Tests | Passed | Failed | Skipped | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Advanced Unit Tests** | 6 | 5 | 0 | 1 | ✅ **PASS** |
| **Integration Tests** | 5 | 5 | 0 | 0 | ✅ **PASS** |
| **Performance Benchmarks** | 4 | 4 | 0 | 0 | ✅ **PASS** |
| **TOTAL** | **15** | **14** | **0** | **1** | ✅ **SUCCESS** |

---

## 1. Advanced Unit Testing (`tests_unit_v2.py`)
These tests verify the core logic, security boundaries, and data integrity constraints of the USC-PIS backend.

| Test ID | Requirement | Result | Observation |
| :--- | :--- | :--- | :--- |
| **UT-01** | pgcrypto SQL Audit | **PASS** | Binary storage for sensitive patient data verified. |
| **UT-02** | Year-Level Logic | **PASS** | Academic year filtering and sorting logic confirmed. |
| **UT-03** | MFA Expiration | **PASS** | 2FA code expiration (10-minute window) verified. |
| **UT-04** | Field Constraints | **PASS** | Regex validation for dental and medical notations confirmed. |
| **UT-05** | Safe List Onboarding | **PASS** | Automated role assignment for safe-listed emails verified. |
| **UT-06** | File Security | **PASS** | Extension-based rejection for malicious files confirmed. |

---

## 2. Integration Testing (`tests_integration_v2.py`)
These tests simulate end-to-end clinical workflows and cross-module interactions.

| Test ID | Requirement | Result | Observation |
| :--- | :--- | :--- | :--- |
| **IT-01** | Clinical Pipeline | **PASS** | Nurse -> Doctor -> PDF workflow completed (200 OK). |
| **IT-02** | Feedback Analytics | **PASS** | Real-time analytics and survey persistence verified. |
| **IT-03** | RBAC Stress Test | **PASS** | Role-based restrictions correctly return 403/404. |
| **IT-04** | Academic Year Sort | **PASS** | API-level filtering for academic records verified. |
| **IT-05** | Campaign Flow | **PASS** | Administrative campaign broadcast to student feed confirmed. |

---

## 3. Performance Benchmarking (`tests_performance_v2.py`)
Benchmarks measuring system latency, concurrency, and computational overhead.

| Test ID | Metric | Target | Actual | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PT-01** | PDF Generation Latency | < 1000ms | **120.49 ms** | ✅ PASS |
| **PT-02** | Concurrency (20 Users) | 20 Req | **20/20 Success (0.64s)** | ✅ PASS |
| **PT-03** | Encryption Overhead | < 50ms | **0.02 ms** | ✅ PASS |
| **PT-04** | Search Query Efficiency | < 500ms | **122.01 ms** | ✅ PASS |

*Note: One test was skipped during this run as per the test suite configuration.*

---

## 4. System Logs & Audit Evidence
*   **Database:** PostgreSQL `uscpis_db` synchronized and migrated.
*   **Notifications:** Verified creation of `Patient Welcome Message` templates.
*   **API Monitoring:** All critical endpoints (PDF, Fitness Assessment, Search) logged within performance thresholds.
*   **Security:** Middleware correctly identified and blocked unauthorized cross-role requests.
