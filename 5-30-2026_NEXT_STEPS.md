# Next Steps: PDF Export Stabilization & Legacy Template Removal
**Date:** May 30, 2026 (Morning Session Planning)

## Critical Issue: Persistent Legacy PDF Templates
Despite multiple attempts to force the high-fidelity "Workshop" engine, PDF exports in the `/reports` page continue to render using the legacy ReportLab-based templates. This is a primary concern for system finalization as it breaks visual parity with the modern UI.

### Identified Potential Causes
1. **xhtml2pdf Failures:** The system may be encountering silent errors during HTML-to-PDF conversion, triggering the `USCPISReportGenerator` (ReportLab) fallback.
2. **Template Content Persistence:** Even with database clears, `template_html` passed through `common_kwargs` might be retrieving cached or stale data in the Celery worker context.
3. **Indentation/Syntax in fallback block:** Recent fixes to `export_to_pdf` indentation must be verified in the actual execution environment.
4. **Environment Constraints:** `xhtml2pdf` may have missing dependencies (e.g., specific fonts or libraries) in the current environment that prevent successful rendering.

## Planned Investigation (Next Session)
1. **Verbose Logging:** Wrap the `pisa.CreatePDF` call in a more verbose try/except block to capture the exact CSS or HTML parsing error.
2. **Forced Failure Test:** Temporarily comment out the ReportLab fallback entirely to force an error message when the HTML engine fails, pinpointing the breakdown.
3. **Dependency Audit:** Verify if `reportlab`, `xhtml2pdf`, and `html5lib` versions are compatible and that all necessary USC branding assets (logos) are accessible to the PDF engine.
4. **Cache Invalidation:** Ensure the Celery worker is restarted or that `db.close_old_connections()` is properly clearing the model cache for `ReportTemplate`.

## Implementation Targets
- **Visual Parity:** PDF exports must exactly match the "Workshop" standard (Grid metrics, Chart.js/QuickChart visualizations, and specialized data groupings).
- **Consolidated Engine:** Remove all legacy ReportLab "Specialized Generators" once the HTML engine is stabilized to prevent future regressions.
- **Audit Verification:** Ensure the `system_log` section appears correctly at the bottom of all generated PDFs.

---
*Created by Gemini CLI - Session Handover*
