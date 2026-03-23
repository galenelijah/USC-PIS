# Report Templates Rollout Guide (Updated March 2026)

This guide explains how to enable and verify the dynamic HTML-based report templates for the Reports module.

## What's New
- **Unified Templates**: PDF exports now utilize the same database-stored HTML templates as HTML exports via the `xhtml2pdf` engine.
- **Robust PDF Fallback**: If a template fails to render as a PDF, the system automatically falls back to a professional `ReportLab` programmatic layout.
- **Simplified Layouts**: Templates have been optimized for high compatibility with PDF conversion engines while maintaining the USC-PIS branding.

## Where Templates Live
- **Model**: `backend/reports/models.py` → `ReportTemplate.template_content` (HTML string).
- **Default Management Command**:
  - `python backend/manage.py create_default_report_templates --force`
  - This command populates the database with the latest USC-standard templates.

## How Rendering Works
- **Context Injection**: The `ReportExportService` renders the template using a Context containing:
  - `report_data`: Structured data from `ReportDataService`.
  - `title`, `generated_at`, `report_date`, `date_range_start`, `date_range_end`.
- **PDF Engine**: 
  - Primary: `xhtml2pdf` (HTML-to-PDF).
  - Fallback: `ReportLab` (Programmatic drawing).
- **Excel Engine**: `Pandas` + `XlsxWriter` for multi-sheet workbooks.

## Enabling & Updating Templates
1. **Apply Latest Templates**:
   ```bash
   python backend/manage.py create_default_report_templates --force
   ```
2. **Verify on Heroku**:
   ```bash
   heroku run "python backend/manage.py create_default_report_templates --force"
   ```

## How To Test
1. **Generate Report**: In the UI, choose any report (e.g., Patient Summary) and select `PDF` format.
2. **Open Result**: The PDF should open correctly in your browser and display the USC-PIS header, patient profile, and medical history in a clean, table-based layout.
3. **Verify Data**: Confirm that all fields (Name, ID, Allergies, etc.) are correctly populated from the database.

## Troubleshooting
- **"Failed to load PDF document"**:
  - **Cause**: This usually meant the server returned a JSON error inside a `.pdf` file.
  - **Fix**: We now prevent this by returning `None` on failure. Ensure `xhtml2pdf` is installed in your environment.
- **Missing Sections**:
  - Check `backend/reports/services.py` to ensure `ReportDataService` is returning the expected keys (e.g., `patient`, `medical_records`).
- **Styling Issues**:
  - `xhtml2pdf` has limited CSS support. Use simple table-based layouts and inline styles where possible (the new default templates follow these rules).

---

**Version**: 4.0  
**Last Updated**: March 21, 2026  
**Status**: Dynamic Templates Active for PDF/HTML
