# Action Plan: Remediation of System Requirements
**Date:** January 26, 2026
**Based on:** `1-26-2026_MISSING_REQUIREMENTS_REPORT.md`

This document outlines the immediate steps to bring the USC-PIS project into full compliance with the "GroupL_WorkingManuscriptv2.2.2" thesis standards.

## Phase 1: Critical Dependencies (High Priority)
**Objective:** Enable required technical capabilities (Async Tasks, Advanced Exports).
**Status:** ✅ **COMPLETE** (2026-01-26)

- [x] **Install Celery & Redis**
    - Added `celery>=5.3.0` and `redis>=5.0.0` to `backend/requirements.txt`.
    - Created `backend/backend/celery.py`.
    - Updated `Procfile` to include worker process.
- [x] **Install Pandas**
    - Added `pandas>=2.2.0` to `backend/requirements.txt`.

## Phase 2: Structural Refactoring (Medium Priority)
**Objective:** Align module structure with Appendix G (Project Checking List).

- [ ] **Refactor "Health Campaigns" Module**
    - **Current State:** Logic exists inside `health_info`.
    - **Action:**
        1. Run `python manage.py startapp campaigns`.
        2. Move `HealthCampaign`, `CampaignTemplate`, and related models from `health_info` to `campaigns`.
        3. Create data migrations to move existing campaign data to the new tables.
        4. Update `INSTALLED_APPS` and all import references.
- [ ] **Frontend Directory Consolidation**
    - **Current State:** Main app is buried in `backend/frontend/frontend/`.
    - **Action:**
        1. Move `backend/frontend/frontend/*` contents to the root `frontend/` directory.
        2. Update `backend/backend/settings.py` (templates/static paths) to point to the new build location.
        3. Clean up the empty/unused `backend/frontend` intermediate folder.

## Phase 3: Pilot Test Readiness (High Priority)
**Objective:** Prepare data for the specific pilot user group defined in the thesis.
**Status:** ⏳ **NEXT UP**

- [ ] **Generate Pilot Data Fixtures**
    - Create a `fixtures/` directory in `backend/patients/`.
    - Generate a JSON fixture (`tourism_freshmen_pilot.json`) containing:
        - 30-50 Student users with "Tourism Management" as their department.
        - Year level set to "1".
        - Varied medical history data for testing reports.

## Phase 4: Security Verification
**Objective:** Enforce `pgcrypto` usage.

- [ ] **Audit Encryption Migrations**
    - Review `backend/patients/migrations/` to confirm the `pgcrypto` extension is installed.
    - Verify that sensitive fields (e.g., `medical_history`, `treatment_notes`) are using encrypted field types or that the application logic handles encryption/decryption transparently.

## Execution Order
1.  **Phase 1** (Dependencies) - ✅ **DONE**
2.  **Phase 3** (Fixtures) - **START HERE**
3.  **Phase 2** (Refactoring) - Requires careful code changes; best done after dependencies are stable.
4.  **Phase 4** (Security) - Final audit before "release".