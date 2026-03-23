# Replace Report Templates — How-To (Updated March 2026)

This guide shows how to replace old report templates with the latest default templates and verify the new dynamic PDF/HTML generation.

## Prerequisites
- Backend set up and migrations applied.
- Admin/staff access to trigger report generation.
- `xhtml2pdf` and `reportlab` installed in the environment.

## Command Overview
The primary command for refreshing templates is:
- `python backend/manage.py create_default_report_templates --force`

This command:
- Overwrites existing templates with the latest high-compatibility USC versions.
- Ensures all 13 standard report types are present in the database.
- Automatically adds `{% load report_tags %}` to enable custom filters.

## Typical Usage
1. **Local Update**:
   ```bash
   python backend/manage.py create_default_report_templates --force
   ```

2. **Production Update (Heroku)**:
   ```bash
   heroku run "python backend/manage.py create_default_report_templates --force"
   ```

## What's Changed in March 2026
- **Dynamic PDF**: PDF exports now utilize the HTML templates from the database.
- **Fail-Safe Generation**: If the HTML template fails to convert to PDF, the system uses a programmatic `ReportLab` fallback to ensure a valid file is always delivered.
- **Improved Data Alignment**: The `ReportDataService` has been unified to provide identical data structures for all 5 export formats (PDF, Excel, CSV, JSON, HTML).

## Verifying Changes
1. **Check Database**: Go to Django Admin (`/admin/reports/reporttemplate/`) and verify that `template_content` contains the new simplified HTML structure.
2. **UI Test**:
   - Generate a "Patient Summary" in **PDF** format.
   - Verify it downloads and opens correctly.
   - Generate the same report in **Excel** format.
   - Verify it contains an "Overview" sheet and detailed sheets for history.

## Notes
- **Styling**: If you customize templates in the Admin, stick to simple CSS and table-based layouts. `xhtml2pdf` does not support complex modern CSS (Flexbox/Grid).
- **Format Consistency**: The `--force` flag is essential to apply the latest architectural fixes to existing template rows.

## Rollback
There is no automated rollback for `--force`. It is recommended to export your `ReportTemplate` table via Django Admin or a JSON dump before running the command if you have significant custom modifications.

---

**Last Updated**: March 21, 2026  
**Status**: Unified Template System Active
