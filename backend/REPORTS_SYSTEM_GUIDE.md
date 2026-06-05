# USC-PIS Reports System Guide (v6.0)

## Overview

The USC-PIS Reports System provides comprehensive analytics, operational intelligence, and institutional accountability for healthcare management. The system generates high-fidelity exports in multiple formats (PDF, Excel, CSV, JSON, HTML) with deep visualization integration, real-time synchronization, and professional layout management.

## System Architecture (Updated June 5, 2026)

### Components
- **Report Templates**: Dynamic HTML/Django templates stored in the database.
- **Background Processing**: Powered by **Celery and Redis** for asynchronous generation.
- **Export Engine**: 
    - **PDF**: Primary high-fidelity `xhtml2pdf` engine with modernized **Institutional Branding**, quadruple-brace variable escaping, and base64 chart injection.
    - **Excel**: Multi-sheet workbooks using `Pandas` and `XlsxWriter` (standardized to `.xlsx`).
    - **HTML/CSV/JSON**: Native Django and Python exports.
- **Visual Analytics**: The backend uses the **QuickChart API** for server-side charts AND a **Workshop-to-PDF Capture** system that transmits browser-rendered Chart.js canvases as high-resolution base64 images for 100% fidelity.
- **Access Resilience**: Implemented a **Silent Re-generation Fallback**. If a report file is missing from storage during download, the system automatically identifies the report type and re-renders the document on-the-fly using the original generator's context.

## Available Report Types (Analytical Workshops)

### 1. Institutional Accountability & Audit Log (Finalized)
- **Engine**: Forensic `USER_ACTIVITY` trail.
- **Accountability**: Translates technical model mutations into human-readable summaries.
- **Security**: Includes actor identity, IP address tracking, and role-based auditing. MFA/Verification logs are suppressed for noise reduction.

### 2. Clinical Operational Density Analysis (v2.0)
- **Fidelity**: Captures the **Hourly Traffic Density (Bar)** and **Workload Forecast (Line)** visualizations directly from the Workshop UI.
- **Intelligence**: Automatically classifies hourly slots into intensity tiers (Peak, Heavy, Stable).
- **Time Sync**: Standardized 24-hour interval logging (00:00-24:00).

### 3. Patient Population & Demographics (Hardened)
- **Accuracy**: Analysis of student vs. faculty/staff distribution with strict `is_active=True` and distinct user counts to prevent test profile inflation.

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

## Export Engine Hardening (v6.0)
- **Real-Time Synchronization**: A global event bus mechanism automatically refreshes the Report Archive whenever an export is triggered from any workshop, accompanied by institutional toast notifications.
- **PDF Layout Integrity**: Enforced mandatory page breaks for all data tables that follow a chart or visual, ensuring charts and their underlying logs are never fragmented across pages.
- **Automatic Column Pruning**: The universal export engine automatically strips technical columns (`priority`, `engagement_count`, `id`, `usc_id`, `meta`, `timestamp`) from all formats.
- **Label Standardization**: Centralized mapping ensures "Batch X" and other extended academic levels are displayed consistently without redundant qualifiers.

## Web Interface Usage

### Accessing Workshops
1. Navigate to `/reports` (Staff/Admin) or `/admin/audit` (Admin Only).
2. **Interactive Workshops**: Previews allow drilling down into data before export.
3. **Capture & Export**: Click "Export" within any workshop to trigger a high-fidelity generation that includes your current filter and chart state.

### Report Archive
- **Smooth Refresh**: Monitors generation status in real-time (**Queued** -> **Generating** -> **Ready**) without manual refreshing.
- **Notifications**: Users receive instant feedback via "Report Generation Started" and "Report Ready" pop-ups.
- Provides 30-day retention for all generated institutional documents.

## Technical Implementation

### PDF High-Fidelity & Safety
1.  **Quadruple-Brace System**: Manages Django template complexity in Python f-strings, ensuring correct rendering of `{{ variable }}` in the final HTML.
2.  **Layout Control**: Uses `.visual-section .data-table { page-break-before: always; }` to maintain professional document flow.
3.  **Resilient Footers**: Uses a safe-default pattern `user.get_full_name|default:user|default:"Admin"` to prevent template engine crashes if user context is missing.

### API Endpoints
- `POST /api/reports/templates/{id}/generate/` - Generate with chart injection
- `GET /api/reports/generated/` - List user's reports
- `GET /api/reports/generated/{id}/download/` - Resilient download with silent re-generation
- `GET /api/auth/audit-logs/` - Forensic audit trail data source

---

**Last Updated**: June 5, 2026  
**Status**: Institutional Sync & Layout Integrity Hardened  
**Version**: 6.0 (High-Fidelity Standard)
