# USC-PIS Reports System Guide (v5.0)

## Overview

The USC-PIS Reports System provides comprehensive analytics, operational intelligence, and institutional accountability for healthcare management. The system generates high-fidelity exports in multiple formats (PDF, Excel, CSV, JSON, HTML) with deep visualization integration.

## System Architecture (Updated May 30, 2026)

### Components
- **Report Templates**: Dynamic HTML/Django templates stored in the database.
- **Background Processing**: Powered by **Celery and Redis** for asynchronous generation.
- **Export Engine**: 
    - **PDF**: Primary high-fidelity `xhtml2pdf` engine with modernized **Institutional Branding**, quadruple-brace variable escaping, and base64 chart injection.
    - **Excel**: Multi-sheet workbooks using `Pandas` and `XlsxWriter`.
    - **HTML/CSV/JSON**: Native Django and Python exports.
- **Visual Analytics**: The backend uses the **QuickChart API** for server-side charts AND a **Workshop-to-PDF Capture** system that transmits browser-rendered Chart.js canvases as high-resolution base64 images for 100% fidelity.
- **Accountability Trail**: Integrated with the **System Audit Workshop**, allowing forensic exports of all administrative and clinical mutations.

## Available Report Types (Analytical Workshops)

### 1. Institutional Accountability & Audit Log (New)
- **Engine**: Forensic `USER_ACTIVITY` trail.
- **Accountability**: Translates technical model mutations into human-readable summaries.
- **Security**: Includes actor identity, IP address tracking, role-based auditing, and forensic "Old vs. New" value diffs.

### 2. Clinical Operational Density Analysis (New)
- **Fidelity**: Captures the **Hourly Traffic Density (Bar)** and **Workload Forecast (Line)** visualizations.
- **Intelligence**: Automatically classifies hourly slots into intensity tiers (Peak, Heavy, Stable).
- **Time Sync**: Standardized 24-hour interval logging (00:00-23:59).

### 3. Patient Population & Demographics
- Analysis of student vs. faculty/staff distribution.
- **Academic Mapping**: Granular pie charts for School and Course distribution using `PROGRAMS_CHOICES`.

### 4. Visit Trends & Capacity Analysis
- **Dynamic Granularity**: Adjusts timeline scale (Daily, Weekly, Monthly) based on range.
- **Aggregate Trends**: Combined "Medical + Dental" trend visualization.

### 5. Medical & Dental Statistics (V2.5 Analytical)
- **Top Diagnoses/Procedures**: Programmatically generated charts integrated directly into the PDF.
- **Clinical Vitals**: Integrated vitals monitoring and BMI classification.

### 6. Health Campaign Analytics
- Analysis of reach, engagement, and effectiveness across 13 campaign types.

### 7. Unified Health History (Patient-Centric)
- **Engine**: `USCUnifiedHistoryReport`.
- **Landscape Timeline**: Consolidated view of visits, certificates, and clinical documents.

## Web Interface Usage

### Accessing Workshops
1. Navigate to `/reports` (Staff/Admin) or `/admin/audit` (Admin Only).
2. **Interactive Workshops**: Previews allow drilling down into data before export.
3. **Capture & Export**: Click "Export" within any workshop to trigger a high-fidelity generation that includes your current filter and chart state.

### Report Archive
- Monitors generation status (**Queued** -> **Generating** -> **Ready**).
- Provides 30-day retention for all generated institutional documents.

## Technical Implementation

### PDF High-Fidelity Strategy
The system uses a **Quadruple-Brace Variable System** in Python f-strings to manage Django template complexity:
- Ensures base64 charts (`charts_base64`) are injected into the HTML stream before the PDF engine (xhtml2pdf) processes the layout.
- Prevents network-timeout issues during PDF generation by pre-rendering all visual assets.

### API Endpoints
- `POST /api/reports/templates/{id}/generate/` - Generate with chart injection
- `GET /api/reports/generated/` - List user's reports
- `GET /api/auth/audit-logs/` - Forensic audit trail data source

---

**Last Updated**: May 30, 2026  
**Status**: Institutional Accountability & Operational Flow Finalized  
**Version**: 5.0 (High-Fidelity Workshop Standard)
