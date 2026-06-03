# Report Export & Visualization Architecture (v2.1) - June 3, 2026

## Overview
The USC-PIS reporting system utilizes a dual-layer export architecture designed for high-fidelity data representation and institutional branding. Version 2.1 introduces multi-format support (HTML/JSON) and a high-density visualization engine.

## 1. Export Format Strategy
The `ReportExportService` (backend/reports/services.py) serves as a centralized dispatcher for five distinct formats:

- **PDF/HTML (Visual Formats):** Utilize Django's Template engine and `xhtml2pdf` (for PDF). The HTML template is shared between both formats to ensure visual consistency.
- **Excel/CSV (Tabular Formats):** Utilize `pandas` (for Excel) and the standard `csv` library. They focus on data accessibility while stripping away visual elements like charts and styling.
- **JSON (Data Format):** A raw serialization of the collected report data, including applied filters and generated chart URLs, ideal for API-based interoperability.

## 2. Visualization Engine (Mapped Charts)
The system employs a "Contextual Visualization" strategy to ensure no data table is presented without interpretative visuals.

### 2.1 Dual-Layer Capture
1. **Frontend Priority:** If a workshop UI provides a `charts_base64` payload (captured from the live `<canvas>`), the export engine prioritizes these images as they represent exactly what the user saw.
2. **Backend Fallback:** If base64 data is missing (e.g., from scheduled reports or direct downloads), the `ReportGenerationService` utilizes the **QuickChart.io** API to generate professional server-side charts based on the raw dataset.

### 2.2 Table-Chart Mapping (`mapped_charts`)
A new internal mapping dictionary is generated during the data collection phase. This dictionary maps specific data keys (e.g., `course_distribution`) to their corresponding chart URLs. 

**HTML Template Logic:**
```html
{{% for k, v in report_data.items %}}
    {{% if v|is_list %}}
        <!-- Contextual Chart Rendering -->
        {{% if mapped_charts|get_item:k %}}
            <div class="chart-container">
                <img src="{{ mapped_charts|get_item:k }}" />
            </div>
        {{% endif %}}
        
        <!-- Table Rendering -->
        <table class="data-table">...</table>
    {{% endif %}}
{{% endfor %}}
```

## 3. Layout Standards
- **Width:** Charts are capped at `800px` width and centered.
- **Density:** 100% chart-to-table ratio for all list-based clinical metrics.
- **Color Palette:** Standardized institutional blue (`#003366`) and slate (`#1e293b`) accents.

## 4. Archive UI Enhancements
The `ReportArchive.jsx` component has been extended to support the new format chips:
- **HTML Chip:** `bgcolor: '#e0f2fe'`, `color: '#0284c7'` (Sky Blue)
- **JSON Chip:** `bgcolor: '#fef3c7'`, `color: '#d97706'` (Amber)
