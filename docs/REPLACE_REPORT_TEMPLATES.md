# Replace Report Templates — How-To

This guide shows how to replace old report templates with the latest default templates, with an optional backup, and verify everything is working.

## Prerequisites
- Backend set up and migrations applied
- Admin/staff access (to trigger report generation from UI if needed)

## Command Overview
We added a management command that:
- Optionally backs up current templates to a JSON file
- Replaces existing templates with the latest defaults
- Ensures supported formats (e.g., adds HTML/JSON where needed)

Command:
- `python backend/manage.py replace_report_templates [--backup <path>] [--skip-fix] [--dry-run]`

Flags:
- `--backup <path>`: Save a JSON backup of the current templates before replacing (recommended)
- `--skip-fix`: Skip running `fix_report_formats` after replacement
- `--dry-run`: Show planned actions without making changes

## Typical Usage
1) Back up and replace (recommended):
```
python backend/manage.py replace_report_templates --backup backups/report_templates_backup.json
```

2) Replace without backup (fastest):
```
python backend/manage.py replace_report_templates
```

3) Preview only (no changes):
```
python backend/manage.py replace_report_templates --dry-run
```

## What It Does
- Runs `create_default_report_templates --force` to (re)create the latest templates
- Runs `fix_report_formats` to ensure templates include expected export formats (PDF, EXCEL, CSV, JSON, HTML as appropriate)
- Prints a summary of template counts before/after

## Verifying Changes
- Quick test script:
```
python backend/test_report_fixes.py
```
  - If templates are missing, it will suggest commands to create/fix them

- UI/API test:
  - Generate a report using a template you replaced
  - Choose `HTML` export format to see the new template’s HTML output
  - Download and open the `.html` file to confirm it’s the new content

## Notes
- PDF exports still use ReportLab (programmatic rendering) and won’t reflect the HTML template. Use the `HTML` format to validate your template content.
- If you want PDF to follow the HTML template too, we can integrate an HTML→PDF engine (e.g., WeasyPrint).

## Rollback
- If you used `--backup`, you can manually restore templates by loading the JSON file and updating each `ReportTemplate` row (via Django shell or a small one-off script). If you want, we can add a `restore_report_templates` command later.

---

This process replaces old report templates with the latest versions and ensures export formats are consistent.

