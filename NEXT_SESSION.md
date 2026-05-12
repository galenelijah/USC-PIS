# Next Session Plan - May 10, 2026

## High Priority: Frontend Stabilization
1.  **Fix Dashboard Navigation Crash:** Resolve the `no-undef` error for `navigate` in `Dashboard.jsx`.
2.  **Lint Debt Reduction:**
    *   Update ESLint configuration to include `jest` and `browser` environments to eliminate noise.
    *   Perform a batch cleanup of `no-unused-vars` in core components.
    *   Audit and fix `react-hooks/exhaustive-deps` warnings in clinical views to prevent stale data bugs.

## Clinical Workflow Enhancements
1.  **PDF Local Environment Setup:** Investigate installing `xhtml2pdf` or `WeasyPrint` dependencies in the local WSL environment to enable full integration testing of medical certificates.
2.  **Database Migration Finalization:** Carefully apply the pending migrations for `health_info` and `feedback` in a staging environment to resolve index-naming conflicts.

## Quality Assurance
1.  **API Regression Test:** Re-run the `probe_api.py` script to ensure all 180+ endpoints remain stable after frontend changes.
2.  **Clinical Audit Prep:** Finalize the "Real Stats" verification for the upcoming Q2 2026 audit.
