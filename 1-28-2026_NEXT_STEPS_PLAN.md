# Implementation Plan: Pilot Readiness & Refactoring
**Date:** January 28, 2026
**Context:** Post-Architecture Fix & Course Feature Implementation

This plan prioritizes the remaining tasks required to bring the system to full "Thesis Compliance" and readiness for the Pilot Test.

## 🚀 PHASE 1: Pilot Test Data (Top Priority)
**Goal:** Populate the system with the specific user group required for the pilot testing phase [cite: 483].

### Task 1.1: Generate Student Fixtures
*   **Target File:** `backend/patients/fixtures/tourism_freshmen_pilot.json`
*   **Requirements:**
    *   **Count:** 30-50 Users
    *   **Role:** `STUDENT`
    *   **Course:** `Bachelor of Science in Tourism Management` (ID: 34)
    *   **Year Level:** `1`
    *   **Data:** Varied fake names, USC emails (`@usc.edu.ph`), and dates of birth.
*   **Action:** Write a Python script (`scripts/generate_fixtures.py`) to generate this JSON file programmatically to ensure consistency, then run it.

### Task 1.2: Load & Verify Data
*   **Action:** Run `python manage.py loaddata tourism_freshmen_pilot.json`
*   **Verification:**
    *   Check Django Admin: Are 50 new students listed?
    *   Check Frontend: Does the "Course" column show "Tourism Management" for them?

---

## 🏗️ PHASE 2: Health Campaigns Module (Architectural Compliance)
**Goal:** Move campaign logic to a dedicated app as required by Appendix G.

### Task 2.1: Create App
*   **Command:** `python manage.py startapp campaigns`

### Task 2.2: Migrate Models
*   **Move:** `HealthCampaign`, `CampaignTemplate`, `CampaignResource`, `CampaignFeedback` from `health_info/models.py` to `campaigns/models.py`.
*   **Refactor:** Update all imports in views, serializers, and admin files that reference these models.
*   **Database:** Create a data migration to move existing rows from the `health_info` tables to the new `campaigns` tables (or drop and recreate if data loss is acceptable).

### Task 2.3: Update API Endpoints
*   **URLs:** Move campaign-related URLs from `health_info/urls.py` to `campaigns/urls.py`.
*   **Frontend:** Update API calls in `frontend/src/services/api.js` to point to the new endpoints (e.g., `/api/campaigns/` instead of `/api/health-info/campaigns/`).

---

## 🛡️ PHASE 3: Security & Final Polish
**Goal:** Final pre-defense checks.

### Task 3.1: Pgcrypto Audit
*   **Verify:** Check the `authentication_user` table to ensure `illness_enc`, `medications_enc` columns are actually being populated with binary data when a user saves their profile.

### Task 3.2: User Manual Alignment
*   **Action:** Ensure the "User Guide" markdown files match the new UI (especially the new "Course" column in the Patient list).

---

## 📝 Execution Order for Next Session
1.  **Run** `git push heroku main` (if not done) and verify the live site works.
2.  **Execute** Phase 1 (Generate Fixtures).
3.  **Execute** Phase 2 (Campaigns Refactor).
