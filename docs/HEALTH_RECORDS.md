# Medical vs Dental Records — UI Separation

As of September 2025, the system separates Medical and Dental records into dedicated pages. This improves clarity, makes counts accurate, and prevents cross‑contamination of filters/exports.

- Medical Records (staff + students)
  - Route: `/medical-records` (staff) and `/health-records` (simplified student view)
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
- APIs remain unchanged (`/api/patients/medical-records/` and `/api/patients/dental-records/`), but the UI no longer mixes them on Medical Records pages.
- For combined reporting across medical and dental, use the Reports module or export separately from each page.
