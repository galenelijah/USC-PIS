# USC-PIS Reports System Guide

## Overview

The USC-PIS Reports System provides comprehensive analytics and reporting capabilities for healthcare data. The system generates reports in multiple formats (PDF, Excel, CSV, JSON, HTML) and stores them securely in cloud storage for reliable access.

## System Architecture (Updated May 29, 2026)

### Components
- **Report Templates**: Dynamic HTML/Django templates stored in the database.
- **Background Processing**: Powered by **Celery and Redis** for reliable, asynchronous generation.
- **Export Engine**: 
    - **PDF**: Primary high-fidelity `xhtml2pdf` (HTML-to-PDF) engine with modernized Workshop-standard CSS and institutional branding.
    - **Excel**: High-fidelity multi-sheet workbooks using `Pandas` and `XlsxWriter`.
    - **HTML/CSV/JSON**: Native Django and Python exports.
- **Visual Analytics**: The backend uses the **QuickChart API** via `_generate_chart_url_complex` to inject multi-series Workshop visualizations (lines, bars, pie) directly into exported documents.
- **Report Archive**: Dedicated history UI for monitoring generation status and downloading past exports.
- **Cloud Storage**: Cloudinary integration with a 4-tier failover download system.

### Storage Configuration
- **Production**: PostgreSQL + Cloudinary.
- **Failover**: System automatically falls back to local storage or on-the-fly regeneration if cloud files are inaccessible.

## Available Report Types (Analytical Workshops)

### 1. Patient Population & Demographics
- Analysis of student vs. faculty/staff distribution.
- **Academic Mapping**: Granular pie charts for School and Course distribution (Top 7 + "Other" grouping).
- Institutional alignment using `PROGRAMS_CHOICES` and `ACADEMIC_DIRECTORY_MAP`.

### 2. Visit Trends & Capacity Analysis
- **Dynamic Granularity**: Automatically adjusts timeline scale (Daily, Weekly, Monthly) based on the date range.
- **Aggregate Trends**: Combined "Medical + Dental" trend line for total clinic throughput visualization.
- Peak usage metrics and growth percentage tracking.

### 3. Operational Efficiency Report
- Workload intensity mapping based on patient volume per hour.
- Identification of peak hours and staff utilization metrics.

### 4. Feedback & Sentiment Analysis
- Patient satisfaction metrics and rating distributions (1-5 stars).
- **Qualitative Audit**: Integrated table of raw comments and improvement suggestions.
- High-fidelity star distribution visualizations.

### 5. Medical & Dental Statistics (V2.0 Analytical)
- **Engine**: `USCMedicalAnalyticalReport` and `USCDentalAnalyticalReport`.
- **Top Diagnoses/Procedures**: Programmatically generated Bar/Doughnut charts integrated directly into the PDF.
- **Clinical Details**: Dental reports focus on Referrals and Findings; Medical reports include Vitals (BP/T) and BMI classification.

### 6. Health Campaign Analytics
- Analysis of health campaign reach, engagement, and effectiveness.
- **Comparative Tracking**: Side-by-side engagement metrics for targeted campaign audits.

### 7. Unified Health History (Patient-Centric)
- **Engine**: `USCUnifiedHistoryReport`.
- **Consolidated Timeline**: Aggregates Medical visits, Dental consultations, Medical Certificates, and Patient Documents into a single, branded landscape timeline.

## Web Interface Usage

### Accessing Reports
1. Navigate to `/reports` page (requires Staff/Admin role).
2. **Global Timeline Control**: Standardized presets:
    - **Full Academic History** (All-time)
    - **Last 7 Days** (Weekly view)
    - **Last 30 Days** (Monthly view)
    - **Last 6 Months** (Semester view)
    - **Manual Range Selection** (Custom start/end pickers)
3. **Workshops**: Click "Drill-down" or "View Details" on any preview card to open the interactive analytical workshop.
4. **Exporting**: Click PDF, Excel, or CSV in the workshop footer.

### Report Archive
- Located at the bottom of the Reports dashboard.
- Monitors background generation status (**Queued** -> **Generating** -> **Ready**).
- Provides permanent download links for all generated files (30-day retention).

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
