# System Status Report - April 2, 2026

## System Overview
The USC-PIS has successfully completed its **Communication & Branding Stabilization**. All hardcoded contact information has been centralized into the core settings, ensuring consistency across all automated emails, in-app notifications, and health campaigns. The system now accurately reflects its current feature set and contact methods.

## Current Component Status

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Email Infrastructure** | ✅ Standardized | Centralized `SUPPORT_EMAIL` and `SITE_URL` in `settings.py`. |
| **Email Service** | ✅ Refactored | `EmailService` now automatically injects support contact and site URLs into all templates. |
| **Welcome Workflow** | ✅ Updated | Account creation emails now correctly point to support and omit non-functional /help links. |
| **Notifications** | ✅ Corrected | Welcome notifications now show the correct USC Health Center phone: **(032) 230-0100**. |
| **Appointment Feature** | 🚫 Removed | References removed from UI (Dental form), User Guide, and Onboarding. |
| **Compliance Report** | 🚫 Removed | Removed placeholder Compliance & Privacy report template and logic. |
| **Email Service** | ✅ Enhanced | Refactored to support professional HTML templates for all notifications. |

## Recent Updates

### Report & Template Streamlining
*   **Compliance Report Removal**: The "Compliance & Privacy Report" template and its associated placeholder logic have been removed to focus on core clinical production tools.
*   **Report Transparency Tooltip**: Added an informational tooltip to the Report Generation dialog explaining that PDF reports are formatted summaries (limited to 200 items), while Excel/CSV provide full raw data.

### Contact & Branding Standardization
*   **Centralized Settings**: All automated emails and system alerts now pull their contact email from `settings.SUPPORT_EMAIL` (defaulting to `21100727@usc.edu.ph`).
*   **Dynamic URLs**: Site links within all templates are now dynamically generated using `settings.SITE_URL`.
*   **Professional HTML Templates**: Created `patient_welcome.html` to provide a polished onboarding experience.

### User Experience (UX) Refinements
*   **Appointment System Cleanup**: 
    *   Removed the "Next Appointment Recommended" field from Dental and Medical records.
    *   Updated "Medical Appointments" terminology to "Medical Records" in History views.
    *   Performed a total cleanup of the **User Guide** to remove obsolete scheduling instructions.
*   **Welcome Workflow**: Removed the dead link to the `/help` page from both HTML and text versions.
*   **Onboarding Notification**: Modified the `Patient Welcome Message` template to remove the "- Schedule appointments" line.
*   **Campaign Contact Info**: Replaced placeholder hotline `(555) 123-4567` with actual USC Health Center: **(032) 230-0100**.

### Report Transparency & Format Alignment
*   **Export Format Tooltip**: Added an informational tooltip to the Report Generation dialog explaining that PDF reports are formatted summaries (limited to 200 items), while Excel/CSV provide full raw data.
*   **User Guide Update**: Documented the differences between PDF and Excel exports to manage user expectations regarding data volume.
*   **Standardized Support**: All report-related support queries are now directed to the new centralized clinic email.

### Technical Integrity
*   **Context-Aware Emails**: `EmailService` now automatically injects support contact and site URLs into all templates.
*   **Notification Engine**: Updated to prioritize HTML templates over hardcoded string blocks.

## Resolved Critical Issues
*   **Feature Misalignment**: Fully removed UI and documentation references to the non-existent appointment system to prevent user confusion.
*   **Hardcoded Credentials**: Scrubbed all instances of personal emails from the codebase.

## Known Limitations / Issues
*   **Appointment Scheduling**: This feature is officially out-of-scope for the current version.
*   **Help Center**: The `/help` page is currently not implemented.

## Recommendations
*   **User Guide Distribution**: Ensure the newly updated `USER_GUIDE.md` is shared with stakeholders as it now reflects the system's actual capabilities.
