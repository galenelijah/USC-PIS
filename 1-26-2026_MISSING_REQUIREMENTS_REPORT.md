# Missing Requirements Report: USC-DC Clinic PIS
**Date:** January 26, 2026
**Reference Document:** `1-26-2026_SystemRequirementsFinal.md`

## 1. Critical Libraries & Dependencies
The following tools required by the thesis manuscript are missing from the environment configuration:

| Requirement | Purpose | Status | Current Alternative |
| :--- | :--- | :--- | :--- |
| **Celery** | Automated reminders & async notifications | **MISSING** | No async task runner installed. |
| **Pandas** | Data analysis and Excel export logic | **MISSING** | Using `openpyxl`/`xlsxwriter` directly. |

---

## 2. Functional Modules & Architecture
Discrepancies in app structure and module organization:

*   **Dedicated Health Campaigns App:**
    *   **Requirement:** Distinct module for content management (Banners/PubMats).
    *   **Finding:** Campaign functionality is currently nested within the `health_info` app. While functional, it does not exist as a standalone "Health Campaigns" app as suggested by the standard's module list.
*   **Frontend-Backend Separation:**
    *   **Finding:** The primary React application is nested deep within `backend/frontend/frontend/`. The root `frontend/` directory is incomplete, and the root `package.json` lacks dependencies. This may lead to deployment confusion on Heroku.

---

## 3. Development Artifacts
Missing assets required for the pilot testing phase:

*   **Pilot Test Fixtures:**
    *   **Requirement:** Seed data/fixtures for "1st year Students from Tourism Management" [cite: 483].
    *   **Finding:** No JSON fixtures found in the codebase. Only raw database backups are present, which are not portable seed data.

---

## 4. Security Configuration
*   **Pgcrypto Support:**
    *   **Finding:** `PGP_ENCRYPTION_KEY` is referenced in `settings.py`, but explicit database migrations enabling the `pgcrypto` extension for specific sensitive columns (Patient History/Treatment) need verification to ensure they match the thesis security model [cite: 377].

---

## Recommended Next Steps
1.  **Add `celery` and `pandas`** to `backend/requirements.txt`.
2.  **Create seed data fixtures** for the Tourism Management student pilot group.
3.  **Refactor Health Campaigns** into a standalone Django app if strict architectural adherence is required for the defense.
4.  **Consolidate Frontend** to a consistent directory structure to match the Three-Tier Architecture model.
