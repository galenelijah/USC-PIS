# USC-PIS Email Automation Guide

[![Status](https://img.shields.io/badge/Status-Production_Ready-success)]()
[![Email System](https://img.shields.io/badge/Email-Gmail_App_Password-blue)]()
[![Updated](https://img.shields.io/badge/Updated-April_21_2026-green)]()

## 🚀 Automated Email System Overview

USC-PIS features a sophisticated, multi-layered notification engine that handles everything from patient onboarding to critical infrastructure monitoring.

## 📧 **Email Configuration (Production)**

```
Email Service: Gmail API (Modern OAuth 2.0)
From Address: 21100727@usc.edu.ph
Backend: django-gmailapi-backend
Status: ✅ OPERATIONAL & MONITORED
```

## 🔄 **Notification Lifecycle**

### 1. **Automated Clinical Triggers**
- **Welcome Emails**: Sent instantly on registration via Gmail API.
- **Certificate Workflow**: Real-time notifications for creation, approval, and rejection. Students are notified of status changes; Doctors are alerted to pending assessments.
- **Visit Logs**: Patients receive in-app alerts when clinic visits (Medical/Dental) are committed or updated.
- **Feedback Loop**: Automatically triggered 24 hours after a medical or dental visit.

### 2. **Administrative Automation**
- **Staff Alerts**: Instant notifications for clinic personnel (Admins, Doctors, Nurses) when students submit feedback or upload critical documents (Lab Results/X-Rays).
- **Health Diagnostics**: 7 core infrastructure checks run every 6 hours.
- **System Logs**: Every email event and **high-priority notification** (URGENT/Clinical State) is cryptographically logged in the `AuditLog` table for compliance auditing.

## 🛠️ **Administration Dashboard (/email-administration)**

The administration interface is the central command for all system communication.

### **System Health Diagnostics (7 Points)**
The system runs real-time diagnostics on the following critical components:
1. **Database**: Connection health and record retrieval performance.
2. **Email Infrastructure**: Authentication status and provider availability.
3. **Automated Backups**: Success of data snapshots in the last 7 days.
4. **Security Shield**: Production-grade security header and SSL enforcement.
5. **Performance**: System responsiveness and active rate-limiting.
6. **Cloud File Storage**: Connectivity to persistent medical media storage.
7. **System Speed (Cache)**: Health of the UI speed-optimization layer.

### **Staff Access Management**
Admins can now manage communication channels for **all clinic personnel** (Doctors, Nurses, Staff, Facultys):
- **Granular Control**: Toggle In-App, Email, and Desktop alerts per individual.
- **Role-Based Inclusion**: Automatically identifies all professional roles while excluding students.
- **Real-time Status**: Monitors if a staff member is actively receiving or blocked from system alerts.

### **Template Lifecycle (CRUD)**
- **UI Editor**: Create and modify templates directly in the browser.
- **Variables**: Support for `{{patient_name}}`, `{{current_date}}`, etc.
- **Static Fallbacks**: View immutable system-static templates used for core security (e.g., password reset).

## ⚙️ **Management Commands**

### **Automation Controls**
```bash
# Seed standard clinic templates (Reminders, Campaigns, etc.)
python manage.py send_scheduled_notifications --create-templates

# Run infrastructure health audit and send admin alerts
python manage.py health_check_alerts --alert-level warning

# Process the feedback loop for visits from X hours ago
python manage.py auto_send_feedback_emails --hours 24
```

---

## 🚨 **Troubleshooting & Health Indicators**

### **Healthy Status (Green)**
- All 7 infrastructure checks passed.
- Email backend is in `PRODUCTION` mode.
- SMTP credentials verified.

### **Warning Status (Orange)**
- System in `DEVELOPMENT` mode.
- Minor performance lag detected.
- No successful backup in last 24 hours.

### **Critical Status (Red)**
- Database connection lost.
- Email provider authentication failed.
- Files cannot be stored on persistent cloud storage.

---

**Last Updated**: April 21, 2026  
**System Version**: 2.5.0-PROD  
**Automation Level**: 100% (Scheduler + Real-time Hooks)  
**Infrastructure**: Fully Monitored (7-Point Diagnostics)