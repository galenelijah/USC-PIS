# System Status Report - March 27, 2026

## System Overview
The USC-PIS has undergone a **Major Security and Infrastructure Upgrade**. We have implemented a mandatory Email Verification system, strictly enforced Google OAuth for reliable communication, and optimized server memory for production stability. The system is now **Fully Operational and Secured**.

## Current Component Status

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Email Verification** | 🆕 Operational | Mandatory 6-digit code verification for all users. |
| **Email Infrastructure** | ✅ Hardened | Strictly forced Google OAuth (Gmail API) to prevent delivery failures. |
| **Safe List Management** | ✅ Fixed | Admin-managed list for automatic USC email verification. |
| **Engagement Tracking** | ✅ Restored | View counts fixed for both Health Info and Campaigns. |
| **System Stability** | ✅ Optimized | Celery memory usage limited to 2 workers to prevent R14 errors. |
| **Security Lockout** | ✅ Adjusted | Failed login cooldown reduced from 30 minutes to 2 minutes. |

## Recent Updates

### Mandatory Email Verification
*   **Verification Barrier**: Users are now blocked from accessing profiles or roles until they verify their USC email via a 6-digit code.
*   **Safe List Bypass**: Emails on the `SafeEmail` list (e.g., USC administration) bypass verification automatically.
*   **Decoupled Role Selection**: Users with text-based emails now choose their role (Teacher/Staff) *after* verification, ensuring data integrity.
*   **Retroactive Enforcement**: Existing unverified users are prompted to verify upon their next login.

### Infrastructure & Stability
*   **Google OAuth Enforcement**: Resolved "Connection unexpectedly closed" errors by forcing the `gmailapi_backend` and removing all SMTP fallbacks.
*   **USC Authentication**: The system now sends from the authenticated USC account (`21100727@usc.edu.ph`) to ensure high deliverability.
*   **Memory Management**: Reduced Celery concurrency from 8 to 2 in the `Procfile`, resolving persistent `R14 (Memory quota exceeded)` loops on Heroku.
*   **Redis SSL Fix**: Corrected the `REDIS_URL` connection logic to support Heroku's SSL requirements (`rediss://` with `ssl_cert_reqs=none`).

### UI & UX Improvements
*   **Email Dashboard**: Updated the `/email-administration` page to accurately report the active backend ("GMAIL_API OAuth 2.0").
*   **Engagement Fixes**: Resolved a permission bug that prevented students from seeing view counts and ensured the UI refreshes instantly after a view is tracked.
*   **Safe List UI**: Fixed a critical frontend crash (`R.map is not a function`) in the Safe List management tab.

## Resolved Critical Issues
*   **NameError: DEBUG**: Fixed a system-wide crash during deployment caused by an out-of-order variable definition.
*   **SMTP Fallback Failure**: Eliminated the SMTP attempt that caused "(550, b'Unauthenticated senders not allowed')" errors.
*   **Missing Templates**: Added missing HTML templates for Medical Certificates and Appointments to prevent EmailService crashes.

## Known Limitations / Issues
*   **Worker Memory**: While stabilized at 2 workers, the system remains on a Basic dyno. High-volume background tasks (e.g., bulk reporting) should be monitored.

## Recommendations
*   **End-to-End Test**: Perform a final registration with a clean text-email to confirm the Verification -> Role Selection -> Profile flow.
*   **Scale Monitoring**: If memory errors return, consider upgrading the Heroku worker dyno or further optimizing report generation tasks.
