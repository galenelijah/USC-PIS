# USC-PIS Notification & Alert System Guide

## Overview
USC-PIS features a multi-tiered notification ecosystem designed for clinical transparency, patient safety, and administrative accountability. The system implements **Panel Recommendation 2.d**, ensuring all critical updates are communicated via persistent logs, real-time alerts, and hard validation barriers.

## 1. Multi-Tiered Notification Architecture

### Tier 1: Persistent Dashboard Event Logs (PostgreSQL)
- **Clinical visit Logs**: Patients receive automated in-app notifications when Medical, Dental, or Consultation records are created/updated.
- **Workflow State Changes**: Students are alerted when Medical Certificates move from `Pending` to `Issued` or `Rejected`.
- **Security Mutations**: Real-time alerts are triggered for password changes or critical profile updates.
- **Deep Linking**: Notifications include metadata (e.g., `certificate_id`) allowing users to navigate directly to the relevant record.

### Tier 2: Hard Inline Validation Banners (React)
- **Blocking Prompts**: High-visibility `ValidationBanner` components appear at the top of forms when constraints are violated.
- **Physiological Bounds**: Errors like "Temperature out of bounds (32-42°C)" or "Future date blocked" are displayed in a persistent red MUI Alert.
- **Submission Guard**: The submit interface is programmatically blocked until all validation errors are resolved.

### Tier 3: Context-Specific Snackbar Feedback
- **Precise Action Feedback**: Replaces generic "Changes saved" with specific messages like "Dental Record Committed" or "Report Export Initialized."
- **Security Traps**: Specific toast alerts for "Session Expired" (CSRF/401) with automated redirection to login.
- **Network Resilience**: Targeted alerts for connectivity timeouts or server failures.

## 2. Staff-Side Monitoring
- **Incoming Feedback**: Clinic staff (Admins, Doctors, Nurses) are notified when a patient submits a satisfaction survey.
- **Document Uploads**: Staff are alerted when a student uploads a `Lab Result`, `X-Ray`, or other clinical document.
- **Review Queues**: Doctors receive alerts for certificates pending their assessment and signature.

## 3. Compliance & Auditability
- **Audit Logging**: Every high-priority or clinical-state notification is mirrored in the `AuditLog` table.
- **Reporting Readiness**: These logs capture the sender, recipient, priority, and clinical context, enabling the generation of immutable communication reports for institutional compliance.

## 4. Technical Configuration

### Backend Signals
Triggers are centralized in `backend/notifications/signals.py` using Django's `post_save` hooks.
- **Role Filtering**: Staff alerts are dynamically routed based on user roles (`ADMIN`, `DOCTOR`, `NURSE`, `STAFF`).
- **Delivery Methods**: Support for `IN_APP`, `EMAIL`, or `BOTH` based on user preferences.

### Frontend Components
- **`AppNotification.jsx`**: Global listener for the `app_notification` event bus.
- **`ValidationBanner.jsx`**: Reusable component for form-level error summaries.
- **`api.js`**: Enhanced Axios interceptors for context-aware feedback.

---
**Last Updated**: May 28, 2026  
**Status**: Fully Integrated Notification Ecosystem  
**Version**: 5.0 (Multi-Tiered Auditability)
