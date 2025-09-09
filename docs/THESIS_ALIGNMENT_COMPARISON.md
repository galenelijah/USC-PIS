# Thesis Manuscript (pis.md) vs Project — Alignment Report

Date: 2025-09-09

This report compares the implemented USC‑PIS system with the thesis summary in `pis.md`. It highlights what’s delivered, what’s intentionally deferred, any gaps, and recommended steps to align the manuscript and product for production readiness.

## Alignment Summary
- Overall: Strong alignment with core objectives (records, campaigns, feedback, reports, notifications, certificates). Security posture exceeds “basic security” stated in the manuscript.
- Scope control: Appointments and inventory are explicitly deferred in `pis.md`; the codebase follows that decision.
- Notable gaps vs manuscript details: No Dentist role; no explicit `pgcrypto` column‑level encryption.

## Delivered (Meets or Exceeds)
- Health Records: Medical and dental records with separate views/exports; file uploads validated.
- Health Campaigns: Full CRUD + images; student card view at `/campaigns`; full‑page preview at `/campaigns/:id`.
- Feedback: Student feedback collection with ratings/comments; admin list/flows.
- Reporting: Templates with multi‑format export (PDF/Excel/CSV/JSON); reliability fallbacks documented.
- Notifications: In‑app center and email integration (AWS SES ready).
- Certificates: Issuance workflow, templates, status tracking, notifications.
- Platform/Build: Heroku deploy; release phase migrate + collectstatic; WhiteNoise + Vite configured.

## Partial/Deferred (per manuscript scope)
- Appointments: Deferred; no booking UI/APIs (removed legacy stubs to avoid confusion).
- Inventory: Deferred; not implemented.
- SIS Integration: Deferred; not integrated.
- Mobile App: Not in scope; responsive web SPA only.

## Gaps vs Manuscript Details
1) Roles — Dentist
- Manuscript lists a Dentist role; codebase roles are: `ADMIN`, `DOCTOR`, `NURSE`, `STAFF`, `STUDENT` (no `DENTIST`).
- Impact: Dental workflows can be handled by DOCTOR/NURSE, but it’s a mismatch with manuscript text.
- Evidence: `backend/authentication/models.py` (Role enum).

2) Database Encryption — pgcrypto
- Manuscript mentions “PostgreSQL with pgcrypto” and “Encrypted data columns.”
- Current project relies on transport security and strict headers; no explicit column encryption via `pgcrypto`.
- Options:
  - Implement selective column encryption using `pgcrypto` (sensitive medical fields).
  - Or update the manuscript to reflect current at‑rest/transport security posture without column crypto.

3) “Basic Security” vs Actual Posture
- Manuscript promises basic security; project implements HSTS, SSL redirect, secure cookies, strict headers, CSP/CORS, etc.
- Action: Update the manuscript wording to reflect stronger security implementation.

4) “Analytics” Claim
- Manuscript highlights “analytics for better decision‑making.” Project has robust reporting and some stats; analytics dashboards are basic.
- Options: Add a minimal analytics panel (trends/tiles) or reword to “reporting and operational insights.”

## Evidence Pointers (selected)
- Roles: `backend/authentication/models.py` (no DENTIST enum).
- Campaigns: `backend/frontend/frontend/src/components/StudentCampaigns.jsx`, `.../PublicCampaignPreview.jsx`, `.../services/api.js`.
- Reports: `backend/reports/*`; README Reporting section.
- Feedback: `backend/frontend/frontend/src/components/Feedback*`.
- Certificates: `backend/medical_certificates/*`, `.../pages/MedicalCertificatesPage.jsx`.
- Notifications: `backend/frontend/frontend/src/components/Notifications.jsx`.
- Security: `backend/backend/settings.py` (HSTS, SSL redirect, cookies, CORS, CSP vars), `backend/backend/middleware.py` (custom headers/CSP).

## Recommended Adjustments (to align thesis + product)
- Roles: Either (a) add `DENTIST` role and scope it to dental pages/permissions, or (b) update manuscript to list the 5 current roles.
- Pgcrypto: Decide and document one of:
  - Implement selective `pgcrypto` column encryption + key management notes; or
  - Update manuscript to clarify at‑rest/transport security (TLS, HSTS, cookies, headers) and mark column crypto as future enhancement.
- Analytics language: Add a small analytics dashboard (visits/month, certificates issued, feedback score trend) or soften claim to “reporting and operational insights.”
- Update manuscript wording to reflect stronger‑than‑basic security and current deployment architecture (Heroku, WhiteNoise, Vite).

## Quick Wins (1–2 days)
- Add `DENTIST` role (enum, RBAC checks, visibility on dental pages) with minimal UI/logic changes.
- Consolidate CSP/CORS and enable rate limiting in production (see production plan), and document in thesis “Security Measures.”
- Add 3–4 analytics tiles on admin dashboard (visits/certificates/feedback summary) to concretely back the “analytics” narrative.
- If keeping `pgcrypto`, encrypt a narrow set of fields to demonstrate capability and document operational tradeoffs.

## Production Readiness Tie‑In
- See `PRODUCTION_READINESS_AUDIT.md` and `PRODUCTION_READINESS_NEXT_STEPS.md` for concrete security/ops gaps (CSP/CORS duplication, disabled rate limiting, dependency pins) and a P0/P1 plan to close them before the final submission and defense.

