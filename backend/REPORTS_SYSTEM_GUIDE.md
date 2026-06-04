# USC-PIS Reports System Guide (v5.1)

## Overview

The USC-PIS Reports System provides comprehensive analytics, operational intelligence, and institutional accountability for healthcare management. The system generates high-fidelity exports in multiple formats (PDF, Excel, CSV, JSON, HTML) with deep visualization integration and absolute access resilience.

## System Architecture (Updated May 30, 2026)

### Components
- **Report Templates**: Dynamic HTML/Django templates stored in the database.
- **Background Processing**: Powered by **Celery and Redis** for asynchronous generation.
- **Export Engine**: 
    - **PDF**: Primary high-fidelity `xhtml2pdf` engine with modernized **Institutional Branding**, quadruple-brace variable escaping, and base64 chart injection.
    - **Excel**: Multi-sheet workbooks using `Pandas` and `XlsxWriter`.
    - **HTML/CSV/JSON**: Native Django and Python exports.
- **Visual Analytics**: The backend uses the **QuickChart API** for server-side charts AND a **Workshop-to-PDF Capture** system that transmits browser-rendered Chart.js canvases as high-resolution base64 images for 100% fidelity.
- **Access Resilience**: Implemented a **Silent Re-generation Fallback**. If a report file is missing from storage during download, the system automatically identifies the report type and re-renders the document on-the-fly using the original generator's context.

## Available Report Types (Analytical Workshops)

### 1. Institutional Accountability & Audit Log (Finalized)
- **Engine**: Forensic `USER_ACTIVITY` trail.
- **Accountability**: Translates technical model mutations into human-readable summaries.
- **Security**: Includes actor identity, IP address tracking, and role-based auditing.

### 2. Clinical Operational Density Analysis (v2.0)
- **Fidelity**: Captures the **Hourly Traffic Density (Bar)** and **Workload Forecast (Line)** visualizations directly from the Workshop UI.
- **Intelligence**: Automatically classifies hourly slots into intensity tiers (Peak, Heavy, Stable).
- **Time Sync**: Standardized 24-hour interval logging (00:00-23:59).

### 3. Patient Population & Demographics
- Analysis of student vs. faculty/staff distribution with granular academic mapping.

### 4. Visit Trends & Capacity Analysis
- Dynamic granularity (Daily/Weekly/Monthly) with combined "Medical + Dental" aggregate trends.

### 5. Medical & Dental Statistics (V2.5 Analytical)
- Programmatically generated charts integrated directly into the PDF with clinical vitals monitoring.

### 6. Health Campaign Analytics
- Analysis of reach and effectiveness across 13 campaign types. 
- *Note: Priority and Engagement metrics have been deprecated in favor of View Count and Performance tiers.*

### 7. Unified Health History (Patient-Centric)
- **Engine**: `USCUnifiedHistoryReport`.
- **Landscape Timeline**: Consolidated view of visits, certificates, and documents.

## Export Engine Hardening (v5.2)
- **Automatic Column Pruning**: The universal export engine now automatically strips deprecated and technical columns from all formats. 
    - Removed: `priority`, `engagement_count`, `id`, `usc_id`, `meta`, `timestamp`, `charts_base64`.
- **Sanitized Output**: Ensures that institutional reports remain clean and focused on clinical/operational value rather than internal database IDs.
- **Format Synchronization**: Changes applied globally to PDF, HTML, JSON, Excel, and CSV to ensure cross-format data parity.

## Web Interface Usage

### Accessing Workshops
1. Navigate to `/reports` (Staff/Admin) or `/admin/audit` (Admin Only).
2. **Interactive Workshops**: Previews allow drilling down into data before export.
3. **Capture & Export**: Click "Export" within any workshop to trigger a high-fidelity generation that includes your current filter and chart state.

### Report Archive
- Monitors generation status (**Queued** -> **Generating** -> **Ready**).
- Provides 30-day retention for all generated institutional documents.

## Technical Implementation

### PDF High-Fidelity & Safety
1.  **Quadruple-Brace System**: Manages Django template complexity in Python f-strings, ensuring correct rendering of `{{ variable }}` in the final HTML.
2.  **Resilient Footers**: Uses a safe-default pattern `user.get_full_name|default:user|default:"Admin"` to prevent template engine crashes if user context is missing during fallback re-generation.
3.  **Pre-rendered Visuals**: Transmits browser-rendered charts as base64 images to prevent network timeouts during PDF creation.

### API Endpoints
- `POST /api/reports/templates/{id}/generate/` - Generate with chart injection
- `GET /api/reports/generated/` - List user's reports
- `GET /api/reports/generated/{id}/download/` - Resilient download with silent re-generation
- `GET /api/auth/audit-logs/` - Forensic audit trail data source

---

**Last Updated**: June 4, 2026  
**Status**: Absolute Access Resilience & Global Column Hardening Verified  
**Version**: 5.2 (Clean Export Standard)
