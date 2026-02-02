# 🚀 Next Steps: Pre-UAT Finalization

**Date**: February 2, 2026
**Current Phase**: **System Compliance & Optimization**

We are in the final stretch before User Acceptance Testing (UAT). The major "Report Template" and "Pilot Data" gaps are closed. The last remaining technical compliance gap is the lack of asynchronous processing for notifications.

## 🔥 Critical Priority: Celery Integration
**Requirement**: "Async Tasks: Celery (for automated reminders/notifications)" [SystemRequirementsFinal.md]
**Status**: ❌ **Incomplete** (Installed but unused)

### **Action Plan:**
1.  **Create Tasks Module**: Create `backend/notifications/tasks.py`.
2.  **Migrate Logic**: Move email sending logic from `notifications/views.py` (or signals) into a `@shared_task`.
3.  **Implement Async Call**: Update the view to call `.delay()` instead of the synchronous send function.
4.  **Verify**: Ensure emails still send (requires a worker process running locally or on Heroku).

## 📋 Secondary Actions
1.  **Deploy & Seed**:
    *   Deploy current codebase to Heroku (includes Report fixes and UI mappers).
    *   Run `heroku run python backend/manage.py seed_pilot_data --app usc-pis`.
    *   **Verification**: Check that the seeded students show "BS Tourism Management" in their profiles (not "Unknown").
2.  **Report Verification**:
    *   Download a "Patient Summary Report" for one of the seeded Tourism students.
    *   Verify the PDF formatting matches the HTML template.

## 🐛 Watchlist (Potential Issues)
*   **Heroku Worker**: Does the `Procfile` include a worker process? (e.g., `worker: celery -A backend worker ...`). If not, async tasks will queue up but never execute.
*   **Redis URL**: Ensure `CELERY_BROKER_URL` is set in Heroku config vars.

---
*Focus for next session: Turning the Celery requirement status from FAIL to PASS.*