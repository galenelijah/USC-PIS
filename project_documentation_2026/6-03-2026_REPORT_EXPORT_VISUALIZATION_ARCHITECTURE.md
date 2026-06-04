# Report Export & Visualization Architecture (v3.1) - June 4, 2026

## Overview
The USC-PIS reporting system utilizes a triple-tier export architecture designed for high-fidelity data representation, institutional compliance, and data integrity. Version 3.1 introduces a **Horizontal-First Visualization Strategy** and **Clean Export Hardening**.

## 1. Export Format Strategy
The `ReportExportService` (backend/reports/services.py) serves as a centralized dispatcher for five distinct formats:

- **PDF/HTML (Visual Formats):** Utilize Django's Template engine and `xhtml2pdf` (for PDF). Version 3.1 enforces **A4 Landscape** orientation with a **Clean Export Standard** that prunes technical noise (`Priority`, `ID`, `Meta`) from all documents.
- **Excel/CSV (Tabular Formats):** Utilize `pandas` (for Excel) and the standard `csv` library. Columns are automatically pruned to ensure that administrative spreadsheets remain focused on clinical value.
- **JSON (Data Format):** A raw serialization of the collected report data, including applied filters and generated chart URLs, designed for 100% interoperability.

## 2. Visualization Engine (Mapped Charts)
The system employs a "Contextual Visualization" strategy to ensure no data table is presented without interpretative visuals.

### 2.1 Dual-Layer Capture
1. **Frontend Priority:** If a workshop UI provides a `charts_base64` payload (captured from live `<canvas>`), the engine prioritizes these exact visual states.
2. **Backend Fallback (QuickChart v3.0):** The **QuickChart.io** API serves as the server-side fallback. Version 3.1 upgrades to the **Chart.js v3 Standard** for superior layout control.

### 2.2 Horizontal-First Optimization
To address text overlapping in vertical bars, Version 3.1 shifts all clinical metrics (Diagnoses, Procedures, Service Sentiment) to a **Horizontal Bar Chart** format:
- **`indexAxis: 'y'`**: Forcefully applied to all high-density category charts.
- **Label Clearance**: Implemented a **45px left-margin buffer** and disabled `autoSkip` to ensure 100% label visibility.
- **Data Callouts**: Utilizes the `datalabels` plugin with `align: right` and `offset: 8` to push numeric values safely to the outside edge of bars.

## 3. Visual Stabilization Protocols
Version 3.1 introduces strict layout rules to eliminate vertical overlapping and character-splitting bugs:

- **Universal Paragraph Wrapping:** All table cells utilize the `word-wrap: break-word` and `white-space: normal` CSS rules.
- **Fixed Width Allocation:** The PDF engine now assigns explicit percentage-based widths to columns (e.g., 40% for Findings, 22% for Diagnosis) to prevent layout fragmentation.
- **Diagnostic Masking:** The `is_chart_url` filter automatically detects and suppresses engine query strings within primary data tables.

## 4. Institutional Standards & Accountability
- **Download Accountability:** Every file retrieval (Report/Certificate/Document) triggers a `DOWNLOAD` notification for the actor, creating a transparent audit trail.
- **N/A Fallback Layer:** A global sanitization pass replaces `null` or empty strings with **"N/A"**.
- **Institutional Branding:** All exports are anchored by **University of San Carlos** institutional headers and confidential footers with PHT timestamps.

## 5. Metadata Pruning
The system systematically strips the following fields from all public exports to maintain a professional, clinical focus:
- `priority`, `engagement_count`, `id`, `usc_id`, `meta`, `timestamp`, `charts_base64`.
