# Medical Certificates

Base path: `/api/medical-certificates/`

Routers

- `certificates` → MedicalCertificateViewSet
- `templates` → CertificateTemplateViewSet

Key endpoints

- Templates: `GET /api/medical-certificates/templates/`
- Generate/CRUD certificates: `GET|POST /api/medical-certificates/certificates/`
- Certificate item: `GET|PATCH /api/medical-certificates/certificates/{id}/`

Notes

- Workflow includes draft → submitted → approved/rejected
- PDF generation via WeasyPrint/xhtml2pdf/reportlab
- Email notifications sent on creation/approval when email system is configured

## April 2026 Enhancements
- **USC Clinic Template (ACA-HSD-04F)**: Implemented a polished, single-page landscape layout for tours and off-campus requirements.
- **Terminology Shift**: Changed "Diagnosis" to **"Purpose/Requirement"** in the UI to better reflect the administrative use of these certificates.
- **Automated Context**: The PDF generator now automatically pulls the student's **Full Course Name** and **Year Level** from their profile, along with a dynamic **Fit/Unfit** status indicator.
- **Branding & Signatures**: Added USC logo to the header and a dedicated signature line for the School Physician on the right side of the document.
- **Database Seeding**: Added `seed_tours_template` management command to maintain template consistency across environments.
- **Field Consolidation & Optionality**:
    - **Optional Fields**: Both `diagnosis` (Purpose/Requirement) and `recommendations` are now optional in the database and UI, allowing for flexible draft creation.
    - **UI Consolidation**: The "Recommendations" and "Additional Notes" fields have been merged into a single **"Remarks / Recommendations"** text area in the form and detail views.
    - **Privacy Enhancements**: The `fitness_reason` (reason for "Not Fit" status) has been removed from the general list view (table and cards) to ensure privacy; it is now only visible within the authenticated "View Detail" dialog.
- **Search Enhancements**: Improved the certificate search logic to handle spaces and underscores interchangeably (e.g., searching "not fit" will find "not_fit" records) and enabled searching by full patient name and approval status.
