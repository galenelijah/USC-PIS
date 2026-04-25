# USC-PIS Reports System Guide

## Overview

The USC-PIS Reports System provides comprehensive analytics and reporting capabilities for healthcare data. The system generates reports in multiple formats (PDF, Excel, CSV, JSON, HTML) and stores them securely in cloud storage for reliable access.

## System Architecture (Updated March 2026)

### Components
- **Report Templates**: Dynamic HTML/Django templates stored in the database.
- **Background Processing**: Powered by **Celery and Redis** for reliable, asynchronous generation.
- **Export Engine**: 
    - **PDF**: Dual-engine approach using `xhtml2pdf` (HTML-to-PDF) with a robust `ReportLab` fallback.
    - **Excel**: High-fidelity multi-sheet workbooks using `Pandas` and `XlsxWriter`.
    - **HTML/CSV/JSON**: Native Django and Python exports.
- **Cloud Storage**: Cloudinary integration with a 4-tier failover download system.

### Storage Configuration
- **Production**: PostgreSQL + Cloudinary.
- **Failover**: System automatically falls back to local storage or on-the-fly regeneration if cloud files are inaccessible.

## Available Report Types

### 1. Patient Summary Report
- Individual patient profiles with full medical/dental history.
- Aggregate patient statistics and demographics.
- Simplified, high-compatibility HTML layout for reliable PDF conversion.

### 2. Visit Trends Report
- Monthly aggregation of medical vs dental visits.
- Peak usage metrics and growth percentage tracking.

### 3. Treatment Outcomes Report
- Analysis of treatment success, improvement, and recovery rates.
- Categorized outcome logs.

### 4. Feedback Analysis Report
- Patient satisfaction metrics and rating distributions (1-5 stars).
- Qualitative theme analysis and recent comment tracking.

### 5. Medical & Dental Statistics
- Top diagnoses and common procedures breakdown.
- Demographic distribution (age/gender) and preventive care rates.

### 6. Health Campaign Performance
- Analysis of health campaign reach, engagement, and effectiveness.
- Participant demographics and feedback.

### 7. User Activity Report
- Tracking of system usage, logins, and staff actions.
- Role-based activity distribution.

## Web Interface Usage

### Accessing Reports
1. Navigate to `/reports` page (requires authentication)
2. Select desired report template
3. Configure date range and filters (e.g., specific patient ID)
4. Choose export format (PDF, Excel, CSV, JSON, HTML)
5. Click "Generate Report"

### Report Generation Process
1. **Request Submission**: Report parameters validated and queued via Celery.
2. **Background Processing**: Celery worker processes the task asynchronously.
3. **Data Collection**: `ReportDataService` gathers specific metrics.
4. **File Creation**: Export service creates the formatted file (with PDF failover protection).
5. **Cloud Upload**: File automatically uploaded to Cloudinary.
6. **Completion**: Report marked as completed and ready for download.

## API Endpoints

### Report Templates
- `GET /api/reports/templates/` - List available templates
- `POST /api/reports/templates/{id}/generate/` - Generate report from template

### Generated Reports
- `GET /api/reports/generated/` - List user's reports
- `GET /api/reports/generated/{id}/download/` - Download report file
- `GET /api/reports/generated/{id}/status/` - Check generation status

## Technical Implementation

### PDF Generation Strategy
The system uses a **Dual-Engine Strategy** for maximum reliability:
- **Primary (xhtml2pdf)**: Renders the database-stored HTML template to PDF, preserving custom branding and styles.
- **Fallback (ReportLab)**: If HTML rendering fails (e.g., complex CSS or engine errors), the system automatically generates a professional, structured PDF using programmatic ReportLab drawing. This ensures a "failed to load PDF" error never reaches the user.

### Excel Generation Strategy
Excel exports create a **Rich Multi-Sheet Workbook**:
- **Overview Sheet**: Key summary metrics.
- **Detailed Sheets**: Each data list (e.g., "Visit Log") gets its own sheet with formatted headers and auto-sized columns.

### Report Generation Flow (Code)
```python
# 1. Enqueue task
generate_report_task_celery.delay(report_id, template_id, filters, date_range)

# 2. Collect Data (ReportDataService)
data = ReportDataService.get_visit_trends_data(date_start, date_end, filters)

# 3. Export (ReportExportService)
content = ReportExportService.export_to_pdf(data, template.template_content, title)
```

## Troubleshooting

### PDF "Failed to Load" in Browser
- **Cause**: The service was previously returning JSON error messages as `.pdf` files.
- **Fix (March 2026)**: The system now returns `None` on failure and the Celery task marks it as `FAILED`.
- **Solution**: Ensure `xhtml2pdf` and `ReportLab` are installed. Run `create_default_report_templates --force` to update database templates to the new simplified versions.

### Missing Data in Reports
- **Solution**: Check that the data keys in your `ReportTemplate.template_content` match the keys returned by `ReportDataService`. The new default templates are pre-aligned with these keys.

---

**Last Updated**: March 23, 2026  
**Status**: Reporting & Data Analytics Module Stabilization Complete  
**Version**: 4.1 (Enhanced ReportLab Layout & Security)
