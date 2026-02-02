# 🐛 Alpha Testing: Known Bugs & Issues

**Date**: February 1, 2026
**Status**: ACTIVE - Items requiring immediate attention.

## 1. Campaign UI / UX
- **Issue**: Paragraphs in campaign content are extending horizontally off-screen instead of wrapping vertically.
- **Location**: Campaign Public Preview (Dialog).
- **Severity**: Minor (UI).
- **Status**: **FIXED** (Feb 2, 2026)

## 2. Reports System
- **Issue**: No report templates are visible or available in the `/reports` page.
- **Location**: Reports Dashboard.
- **Severity**: Major (Feature missing/broken).
- **Note**: Needs backend verification of template seeding (run `python manage.py create_default_report_templates`) or frontend API fetch logic.
- **Status**: **FIXED** (Feb 2, 2026)

## 3. Notifications System
- **Issue**: Notifications are functional but not yet optimized for performance or UX.
- **Location**: Global / Notification Center.
- **Severity**: Moderate (Optimization).
- **Note**: Review polling intervals or WebSocket implementation for real-time updates.
- **Status**: **FIXED** (Feb 2, 2026)

---

*This document is a snapshot of issues found during the Alpha Testing phase on Feb 1, 2026.*
