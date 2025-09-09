# Medical vs Dental Records — UI Separation

As of September 2025, the system separates Medical and Dental records into dedicated pages. This improves clarity, makes counts accurate, and prevents cross‑contamination of filters/exports.

- Medical Records (staff + students)
- Routes:
  - `/health-insights` — Health Insights & History for all roles (includes medical + dental history). Legacy `/medical-records` redirects here.
  - `/health-records` — Record management. Students see “My Health Records” (read-only). Staff see “Medical Records (Manage)”.
  - Shows medical records only
  - Counts and quick stats reflect medical records only
  - Exports/prints output medical fields only
  - Health Insights refer to medical history

- Dental Records (staff)
  - Route: `/dental-records`
  - Dedicated interface for dental procedures and workflows
  - Separate search, filters, stats, and exports

Notes
- The sidebar labels have been updated to reflect the separation.
- APIs remain unchanged (`/api/patients/medical-records/` and `/api/patients/dental-records/`). The Insights page merges medical+dental for chronology; the management page focuses on medical record CRUD.
- For combined reporting across medical and dental, use the Reports module or export separately from each page.
