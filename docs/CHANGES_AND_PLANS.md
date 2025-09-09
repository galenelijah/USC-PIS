# USC‑PIS — Changes and Future Plans (Sept 2025)

This document summarizes the recent changes shipped to stabilize key areas (Campaigns, Reports, Health Records, Feedback) and outlines next steps to complete the slice cleanly.

## What Changed (Shipped)

- Campaigns (backend + frontend)
  - Serializer now safely handles images (Cloudinary). Campaigns create/update even if image save fails; no HTML 500s.
  - Viewset returns JSON errors on failures; list responses include `description` and `content` for previews.
  - Frontend uses PATCH for updates (prevents blanking fields); view/edit fetch detail before rendering; student cards improved (lazy images, overlay CTA, load more).

- Reports (frontend)
  - Simplified My Reports: only download original generated format (removed “Export as CSV/Excel/JSON”).
  - Removed laggy Analytics tab and analytics quick‑action to improve responsiveness.
  - Kept Templates + My Reports tabs; Refresh remains.

- Health Records separation (frontend)
  - Management vs. Insights split:
    - `/health-records` is the management page. Students see “My Health Records” (read‑only). Staff see “Medical Records (Manage)”.
    - “Health Insights & History” moved to `/health-insights` (legacy `/medical-records` redirects). Insights include both medical and dental records in a unified timeline.
    - `/dental-records` remains the dedicated dental management UI.
  - Sidebar labels updated accordingly.

- Feedback (backend)
  - Immediate email + in‑app notification after visit creation (both medical and dental).
  - Added `GET /api/feedback/pending/` so the frontend can prompt/block until feedback is submitted.

- Documentation
  - Added/updated: `docs/CAMPAIGNS.md`, `docs/HEALTH_RECORDS.md`, README reporting notes, user guide updates.

## Deploy & Verify Checklist

- Heroku deploy
  - Push code and rebuild frontend assets.
  - Smoke test Campaigns: create/update (with/without images), edit uses PATCH, previews have content.
  - Smoke test Reports: only Templates + My Reports; single download action; no analytics tab.
  - Smoke test Health pages: `/health-insights` shows medical+dental timeline; `/health-records` focuses on medical management; `/dental-records` for dental management.
  - Create medical and dental records for a test student → verify immediate email + in‑app “Feedback Required” notification. Confirm `/api/feedback/pending/` values.

- Security hygiene
  - Rotate secrets shared during debugging: `SECRET_KEY`, `EMAIL_HOST_PASSWORD`, `CLOUDINARY_API_SECRET`.

## Next Steps (High‑Impact)

- Feedback UX gate (frontend)
  - Add banner + modal on student dashboard if `pending.has_pending` is true; link to feedback page.
  - Optional gentle enforcement: block non‑critical navigation until feedback submitted.

- Database Health tab
  - Reduce to essentials: Up/Down, latency, connection count, recent errors. Remove heavy charts/loops.

- Reporting polish
  - Optionally restrict generation formats (e.g., PDF only) to align with “download original only”.
  - Keep My Reports focused on Refresh + Download; remove placeholder filter button.

- Feedback model (optional)
  - Add `dental_record` FK to Feedback or migrate to a generic “visit” relation for precise dental feedback tracking.

- Ops improvements
  - Add Heroku Scheduler task to re‑email feedback reminders if not submitted in 48h.
  - Add a lightweight “Email Status” card for admins (backend email backend, last send success indicator).

## Campaigns — Open Items (Parked for later)

- Image uploads: works with Cloudinary; add a small banner if Cloudinary is disabled to warn staff.
- Create/edit forms: inline field errors exist; consider adding inline helper hints for recommended lengths.
- Student cards: optional enhancements (view/engagement counters, consistent image aspect‑ratio boxes).

## Rollback/Risk Notes

- Reports: removing extra export actions is a UI change only; underlying endpoints remain intact.
- Health Records: dental code was removed from medical views; `/dental-records` remains fully functional.
- Feedback emails: immediate sends replace delayed management‑command approach; if email delivery is an issue, switch to Scheduler‑based reminders while keeping in‑app notifications.

