# Feedback

Base path: `/api/feedback/`

Router

- FeedbackViewSet (basename `feedback`)

Typical endpoints

- List/Create feedback: `GET|POST /api/feedback/`
- Feedback detail: `GET|PUT|PATCH|DELETE /api/feedback/{id}/`

Model behavior

- One feedback per patient per medical visit (unique on `patient, medical_record` when set)
- One general feedback per patient when `medical_record` is null

Usage notes

- Students may be prompted post‑visit to submit feedback; analytics appear in reports.
- Email utilities can request feedback via templates under `utils` email admin endpoints.

