# Report Templates Rollout Guide

This guide explains how to enable and verify the “report templates” (HTML-based) for the Reports module, in addition to the email templates already implemented.

## What Changed
- The Reports service can now render HTML reports using the template content stored in `ReportTemplate.template_content`.
- When exporting with `export_format=HTML`, the system renders the selected report’s template and returns an `.html` file.
- PDF/Excel/CSV/JSON continue to work. PDF still uses ReportLab programmatic rendering for portability, while HTML uses your saved templates.

## Where Templates Live
- Model: `backend/reports/models.py` → `ReportTemplate.template_content` (HTML string)
- Default templates: available via a management command
  - `backend/reports/management/commands/create_default_report_templates.py`
  - `backend/reports/management/commands/fix_report_formats.py` (ensures supported formats include JSON and provides basic HTML defaults if missing)

## How Rendering Works (HTML)
- In `backend/reports/services.py`:
  - `ReportGenerationService.generate_*_report(..., template_html=...)` accepts `template_html`.
  - `ReportExportService.export_to_html(report_data, template_content, title, extra_context)` renders a Django template string with context that includes:
    - `report_data` (the assembled data for the report)
    - `title`, `generated_at`, `date_range_start`, `date_range_end`, `filters`
- In `backend/reports/views.py`, when generating a report the system passes the selected `ReportTemplate.template_content` into the service.

## Enabling Templates
1) Ensure templates exist in your database:
   - Option A: Create defaults
     - `python backend/manage.py create_default_report_templates`
   - Option B: If you already have rows but missing formats/templates
     - `python backend/manage.py fix_report_formats`
2) Confirm a template’s `supported_formats` contains `HTML` if you intend to export HTML.
3) Generate a report with `export_format=HTML` through your UI/API.

## How To Test
- Quick script: `python backend/test_report_fixes.py`
  - If no templates found, it will prompt you to run `fix_report_formats`.
- API/UI: from the Reports screen, pick a template and choose `HTML` as the export format (if the UI supports format selection). Otherwise, hit the API endpoint used by the UI with `export_format: "HTML"`.
- Validate output: download the resulting `.html` and open in a browser. It should match the template.

## Notes
- PDF still uses ReportLab; the `template_content` is ignored for PDF to avoid adding heavy HTML→PDF dependencies.
- The HTML template uses Django templating syntax. You can reference data via `{{ report_data.<field> }}` and iterate using `{% for %}` blocks.
- Common context keys available to the template:
  - `title`, `generated_at`, `report_data`, `date_range_start`, `date_range_end`, `filters`

## Troubleshooting
- “Old templates” still appearing:
  - Ensure deployment includes these changes.
  - Confirm your generate call uses `export_format=HTML` when you want to see the stored template output.
  - Check that the chosen `ReportTemplate` actually has your expected HTML in `template_content`.
- HTML generation fails:
  - The system falls back to JSON output. Check logs for template errors (undefined variables, syntax issues).
- No templates in DB:
  - Run `create_default_report_templates` first, or seed your own via admin.

## Optional Enhancements
- Add a simple admin preview endpoint to render and view `ReportTemplate.template_content` with sample data.
- Provide a safe HTML sanitizer or standardized stylesheet for consistent brand styling.

---

With this rollout, your previously authored report templates are now usable for HTML exports while existing PDF/Excel/CSV/JSON exports continue to work reliably.

