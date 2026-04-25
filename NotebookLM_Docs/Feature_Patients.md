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

## April 2026 Enhancements
- **Advanced Filtering**: Added a collapsible Filter Bar to the patients page, allowing staff to filter by:
  - **Role** (Student, Teacher, or All Patients).
  - **Program/Course** and **Year Level**.
  - **Registration Period**: Supports **Academic Year** (e.g., 2025-2026) and **Semester** (1st Sem, 2nd Sem, Short Term).
- **Date-Based Logic**: The system automatically filters registration dates based on USC semester boundaries:
  - 1st Sem: August 1 – December 31
  - 2nd Sem: January 1 – May 31
  - Short Term: June 1 – July 31
- **API Support**: `patientService` and `PatientViewSet` now handle these complex filtering combinations in real-time.
