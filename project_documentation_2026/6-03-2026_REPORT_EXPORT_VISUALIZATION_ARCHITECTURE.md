# Report Export & Visualization Architecture (v3.0) - June 3, 2026

## Overview
The USC-PIS reporting system utilizes a triple-tier export architecture designed for high-fidelity data representation, institutional compliance, and data integrity. Version 3.0 introduces visual stabilization protocols and hardened data sanitization.

## 1. Export Format Strategy
The `ReportExportService` (backend/reports/services.py) serves as a centralized dispatcher for five distinct formats:

- **PDF/HTML (Visual Formats):** Utilize Django's Template engine and `xhtml2pdf` (for PDF). Version 3.0 enforces **A4 Landscape** orientation to accommodate high-density clinical data without text overlapping.
- **Excel/CSV (Tabular Formats):** Utilize `pandas` (for Excel) and the standard `csv` library. Metadata headers are standardized with **PHT** timezone affixes.
- **JSON (Data Format):** A raw serialization of the collected report data, including applied filters and generated chart URLs, designed for 100% interoperability.

## 2. Visualization Engine (Mapped Charts)
The system employs a "Contextual Visualization" strategy to ensure no data table is presented without interpretative visuals.

### 2.1 Dual-Layer Capture
1. **Frontend Priority:** If a workshop UI provides a `charts_base64` payload (captured from live `<canvas>`), the engine prioritizes these exact visual states.
2. **Backend Fallback:** The **QuickChart.io** API serves as the server-side fallback, utilizing a 35px layout padding and custom datalabels plugin for maximum legibility.

### 2.2 Table-Chart Mapping (`mapped_charts`)
Standardized mapping ensures that every list-based clinical metric (e.g., `top_diagnoses`) is paired with its visualization. Version 3.0 adds an explicit **"Analytical Reference"** section at the document footer to store raw engine query strings for diagnostic transparency.

## 3. Visual Stabilization Protocols
Version 3.0 introduces strict layout rules to eliminate vertical overlapping and character-splitting bugs:

- **Universal Paragraph Wrapping:** All table cells utilize the `word-wrap: break-word` and `white-space: normal` CSS rules. This forces long comments and change-logs to calculate row heights dynamically.
- **Top Alignment:** Enforced `vertical-align: top` for all data rows to maintain a professional grid layout.
- **Diagnostic Masking:** The `is_chart_url` filter automatically detects and suppresses engine query strings within primary data tables, replacing them with a clean `[Visual Component]` placeholder.

## 4. Institutional Standards
- **N/A Fallback Layer:** A global sanitization pass replaces `null` or empty strings with **"N/A"** before template rendering.
- **Timezone Compliance:** All timestamps are affixed with **"PHT"** (Philippine Time) for legal and audit compliance.
- **Confidentiality Stamps:** Footers include "CONFIDENTIAL INSTITUTIONAL DOCUMENT - DO NOT DISCLOSE" branding.

## 5. Archive UI Integration
Standardized chip indicators for the new multi-format support:
- **HTML Chip:** Sky Blue (`#e0f2fe`)
- **JSON Chip:** Amber (`#fef3c7`)

