# Patients, Medical & Dental Records, Consultations

Base path: `/api/patients/`

Routers

- `patients` → Patient profiles
- `medical-records` → Medical visits
- `dental-records` → Dental visits
- `consultations` → Consultation notes

Key endpoints (examples)

- List patients: `GET /api/patients/patients/`
- Create patient: `POST /api/patients/patients/`
- Patient detail: `GET /api/patients/patients/{id}/`
- Medical records: `GET|POST /api/patients/medical-records/`
- Medical record detail: `GET|PUT|PATCH|DELETE /api/patients/medical-records/{id}/`
- Dental records: `GET|POST /api/patients/dental-records/`
- Dental record detail: `GET|PUT|PATCH|DELETE /api/patients/dental-records/{id}/`
- Consultations: `GET|POST /api/patients/consultations/`
- Dashboard stats: `GET /api/patients/dashboard-stats/`

Notes

- Students only see their own records (via linked Patient → User).
- Staff roles can create/update records; validation enforces clinical fields.
- Indexes added for query performance on common filters.

