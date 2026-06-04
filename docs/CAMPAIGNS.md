# Health Campaigns — Developer and Operator Guide

This document describes how the Health Campaigns feature works end‑to‑end after the recent stability and UX rework. It covers API design, required fields, image handling, frontend behavior, and production troubleshooting.

## Overview
- Public, read‑only for all authenticated users; create/edit restricted to staff roles (`ADMIN`, `STAFF`, `DOCTOR`, `NURSE`).
- Robust create/update with defensive file handling. Campaigns always save; image upload problems never cause HTTP 500.
- List API includes `description` and `content` so previews render without a second request.
- Frontend (admin + student): hydrates with detail GET for complete data; updates use PATCH to avoid overwriting unchanged fields.

## API Endpoints
Base: `/api/health-info/campaigns/`

- List: `GET /api/health-info/campaigns/?ordering=-created_at&page=<n>&page_size=<n>`
- Detail: `GET /api/health-info/campaigns/<id>/`
- Create: `POST /api/health-info/campaigns/` (multipart/form-data)
- Update (partial): `PATCH /api/health-info/campaigns/<id>/` (multipart/form-data or JSON)
- Delete: `DELETE /api/health-info/campaigns/<id>/`
- Engage: `POST /api/health-info/campaigns/<id>/engage/`
- Resources: `GET /api/health-info/campaigns/<id>/resources/`
- Upload resource: `POST /api/health-info/campaigns/<id>/upload_resource/`
- Analytics: `GET /api/health-info/campaigns/analytics/`
- Featured: `GET /api/health-info/campaigns/featured/`

## Admin Interface
- **Consolidated Management:** As of April 24, 2026, the dedicated "Email Campaigns" tab has been removed from the Email Administration page to prevent redundancy. All health-related campaigns and public notifications are managed through the primary Campaigns system.
- **Role-Based Access:** Creation and modification remain restricted to staff roles.

## Data Model — Required Fields
Required to create:
- `title` (string)
- `description` (string)
- `campaign_type` (one of: GENERAL, VACCINATION, MENTAL_HEALTH, NUTRITION, DENTAL_HEALTH, HYGIENE, EXERCISE, SAFETY, PREVENTION, AWARENESS, EMERGENCY, SEASONAL, CUSTOM)
- `content` (string)

Optional but recommended:
- `summary`, `objectives`, `target_audience`, `call_to_action`, `tags`, `external_link`, `contact_info`.
- `start_date` (ISO datetime or `YYYY-MM-DD`): Optional. Set for time-sensitive events.
- `end_date` (ISO datetime or `YYYY-MM-DD`): Optional. If set, must be after `start_date`.

## Status & Visibility Lifecycle
- **Statuses:**
  - `POSTED`: Visible to authorized users. Triggers mass notifications to students upon selection.
  - `COMPLETED`: Archived state for finished events. Still visible in history.
  - `ARCHIVED`: Strictly hidden from Students, Faculty, and Public. Only visible to Clinical/Admin staff for records.
- **Always-On Campaigns:** If no `start_date` or `end_date` are provided, the campaign is treated as permanent and remains visible as long as it is in `POSTED` status.
- **Event-Based Campaigns:** If dates are provided, the campaign will show an "Active Now" badge only during the specified window. It automatically moves to `COMPLETED` once the `end_date` passes via the background scheduler.

## PubMat Material Handling
- **Image-Only Policy:** As of April 25, 2026, the system exclusively accepts image files (JPG, PNG, WebP, GIF) for new PubMat materials. PDF support for new uploads has been removed to ensure consistent visual rendering.
- **Legacy PDF Support:** Existing campaigns with PDF materials are still supported via a direct download mechanism.
- **Direct Download for PDFs:** For legacy materials in PDF format, the system provides a "Click-to-Download" card that saves the file directly to the user's device, matching the secure behavior of clinical record attachments.
- **Interactive Image Viewing:** Image-based PubMats open in a high-quality interactive viewer, allowing users to zoom and inspect materials within the app.

## Image Handling (Cloudinary)
- Controlled in serializer: campaign is created/updated first, then images are attached only if Cloudinary is configured.
- If Cloudinary is not configured or the upload fails, the server logs a warning and returns success (campaign is saved without images).
- Production env vars (Heroku):
  - `USE_CLOUDINARY=True`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

## Error Behavior
- Validation errors return HTTP 400 with field‑specific messages.
- File storage errors are logged but do not fail requests.
- Server never returns an HTML 500 page for expected validation/storage errors.

## Frontend Integration (React)
- **Unified View:** A single component (`CampaignsPage`) serves all user roles.
  - **Staff/Admin:** Access to Create, Edit, and Delete actions via buttons and menus.
  - **Student/Patient:** Read-only view. Administrative actions are conditionally hidden.
- Create/Update forms use FormData and do not force `Content-Type`; Axios sets multipart boundaries automatically.
- Quality gates (client‑side): minimum lengths for title/description/content and date sanity check; shows inline field errors.
- Updates use `PATCH` to avoid blanking fields not included in the payload.
- Admin edit/view/preview always fetch detail by id before rendering.
- List view shows newest campaigns first, lazy‑loads images, provides overlay CTA, and supports filtering/searching for all users.

## Troubleshooting
- 500 on create with images:
  - Ensure the app is redeployed with the latest serializer and views.
  - Verify Cloudinary env vars; check `heroku logs --tail` for Cloudinary errors.
  - Even with Cloudinary down, campaign creation should succeed (images skipped).
- Content missing in preview:
  - The list now includes `description` and `content`. If still missing, hard refresh the SPA bundle and verify the API response payload.
- Edits wiping content:
  - The UI fetches detail before opening edit and uses PATCH. If this appears again, ensure the SPA bundle is updated (front‑end cache).

## Smoke Tests (Production)
1) Create campaign without images → Expect 201 and content visible on previews.
2) Create campaign with images → Expect images uploaded (when Cloudinary set) or created without images (no 500).
3) Edit an existing campaign → Fields prefilled; save without changing all fields → unchanged fields persist.
4) Student list → Newest first, images lazy‑load, dialog shows content; “Load more” present when applicable.

## Security Notes
- Rotate secrets if they were shared in logs or chat: `SECRET_KEY`, `CLOUDINARY_API_SECRET`, and email credentials.
- Keep `DEBUG=False` in production.

