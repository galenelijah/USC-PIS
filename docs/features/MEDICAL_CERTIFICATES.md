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

