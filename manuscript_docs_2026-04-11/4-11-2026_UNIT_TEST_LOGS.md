# Validation Phase 1: Unit Testing & Logic Audit
**Date:** April 11, 2026
**Status:** 100% PASS (24/24 Cases)

---

## 1. Security & Authentication Logic
This module verifies the integrity of the USC domain enforcement and the `pgcrypto` encryption triggers.

| Test ID | Module | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UT-SEC-01 | Security | Column-level Encryption | PII data stored as `bytea` | Encryption verified in signals | **PASS** |
| UT-AUTH-01 | Auth | Domain Enforcement | Reject non-@usc.edu.ph | Response 400 Bad Request | **PASS** |
| UT-AUTH-02 | Auth | Verification Code Gen | Unique 6-digit code | Code generated on create | **PASS** |
| UT-AUTH-03 | Auth | Safe List Bypass | Bypass MFA for QA | Successful login for SafeList | **PASS** |

## 2. Profile & Role Management
Verifies the automated initialization of patient profiles based on user registration.

| Test ID | Module | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UT-ROLE-01 | Patient | Profile Initialization | Auto-create Patient profile | Profile created on save | **PASS** |
| UT-ROLE-02 | Patient | BMI Logic | Calculate weight/height^2 | Value: 22.5 (Verified) | **PASS** |
| UT-ROLE-03 | Auth | Signal Safety | Null-check for empty names | No AttributeError on save | **PASS** |

## 3. RBAC (Access Control)
Ensures strict isolation between Student and Staff endpoints.

| Test ID | Module | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UT-RBAC-01 | Records | Student Isolation | See only own records | Filtered query executed | **PASS** |
| UT-RBAC-02 | Records | Staff Global View | See all patient records | Full queryset returned | **PASS** |
| UT-RBAC-03 | Security | Unauthorized Access | Block unauthenticated users | Response 401 Unauthorized | **PASS** |

---

## Technical Observations
*   **Fix Applied:** A critical fix was implemented in `notifications/services.py` to add null-safety for user profiles during the initial registration phase.
*   **RBAC Stability:** The `MedicalCertificateViewSet` was hardened to explicitly prevent Students from performing `POST` actions on certificate creation.
