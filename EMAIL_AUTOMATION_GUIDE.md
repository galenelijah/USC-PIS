# USC-PIS Email Automation Guide

[![Status](https://img.shields.io/badge/Status-Fully_Automated-success)]()
[![Email System](https://img.shields.io/badge/Email-Gmail_App_Password-blue)]()
[![Updated](https://img.shields.io/badge/Updated-August_17_2025-green)]()

## 🚀 Automated Email System Overview

USC-PIS now has a comprehensive automated email notification system that sends emails for various events throughout the healthcare workflow.

## 📧 **Email Configuration (Production)**

```
Email Service: Gmail SMTP with App Password
From Address: sgalenelijah@gmail.com
SMTP Host: smtp.gmail.com
Port: 587 (TLS)
Status: ✅ OPERATIONAL
```

## 🔄 **Automated Email Types**

### 1. **User Registration Welcome Email** ✅ ACTIVE
- **Trigger**: Automatic when user registers via `/api/auth/register/`
- **Recipient**: New user
- **Template**: `welcome.html`
- **Subject**: "[USC-PIS] Welcome to USC-PIS Healthcare System"
- **Content**: Welcome message with system overview and login link

### 2. **Password Reset Email** ✅ ACTIVE
- **Trigger**: Automatic when user requests password reset via `/api/auth/password-reset/`
- **Recipient**: User requesting reset
- **Template**: `password_reset.html`
- **Subject**: "[USC-PIS] USC-PIS Password Reset Request"
- **Content**: Secure reset link with 24-hour expiration

### 3. **Medical Certificate Notifications** ✅ NOW ACTIVE
- **Trigger**: Automatic on certificate lifecycle events
- **Types**:
  - **Certificate Created**: Sent to student when certificate is created
  - **Pending Approval**: Sent to all doctors when approval needed
  - **Certificate Approved**: Sent to student when doctor approves
  - **Certificate Rejected**: Sent to student when doctor rejects
- **Templates**: `certificate_created.html`, `certificate_approved.html`, `certificate_rejected.html`

### 4. **Feedback Request Email** ✅ NOW AUTOMATED
- **Trigger**: Automated via management command (run daily)
- **Schedule**: 24 hours after medical/dental visits
- **Recipient**: Patients with user accounts
- **Template**: `feedback_request.html`
- **Subject**: "[USC-PIS] Share Your Healthcare Experience - USC-PIS"
- **Content**: Feedback form link and visit details

### 5. **System Health Alerts** ✅ NOW ACTIVE
- **Trigger**: Automated via management command (run regularly)
- **Recipients**: System administrators (sgalenelijah@gmail.com)
- **Conditions**: System errors, backup failures, security issues
- **Subject**: "[USC-PIS] System Alert - Status: UNHEALTHY"

## ⚙️ **Email Automation Setup**

### **Management Commands Available**

#### 1. **Auto Feedback Emails**
```bash
# Send feedback emails for visits from 24 hours ago (run daily)
python manage.py auto_send_feedback_emails --hours 24

# Preview what emails would be sent
python manage.py auto_send_feedback_emails --dry-run

# Send for recent visits (testing)
python manage.py auto_send_feedback_emails --immediate
```

#### 2. **Health Check Alerts**
```bash
# Monitor system health and send alerts for critical issues
python manage.py health_check_alerts

# Send alerts for warnings and critical issues
python manage.py health_check_alerts --alert-level warning

# Preview alerts without sending
python manage.py health_check_alerts --dry-run

# Force send alert for testing
python manage.py health_check_alerts --force-alert
```

#### 3. **Test All Email Types**
```bash
# Test all email notifications
python manage.py test_all_emails --email your-test@email.com

# Test specific email type
python manage.py test_all_emails --email your-test@email.com --test-type welcome

# Preview tests without sending
python manage.py test_all_emails --email your-test@email.com --dry-run
```

### **Heroku Scheduler Setup** (Recommended)

For automated daily execution on Heroku:

1. **Install Heroku Scheduler**:
   ```bash
   heroku addons:create scheduler:standard --app usc-pis
   ```

2. **Add Daily Feedback Email Job**:
   ```bash
   heroku addons:open scheduler --app usc-pis
   ```
   - **Command**: `python backend/manage.py auto_send_feedback_emails --hours 24`
   - **Frequency**: Daily at 9:00 AM UTC
   - **Description**: Send daily feedback request emails

3. **Add Health Monitoring Job**:
   - **Command**: `python backend/manage.py health_check_alerts --alert-level warning`
   - **Frequency**: Every 6 hours
   - **Description**: Monitor system health and send alerts

## 📱 **Email Templates & Links**

All email templates include:
- **Website Link**: https://usc-pis-5f030223f7a8.herokuapp.com
- **Login Link**: https://usc-pis-5f030223f7a8.herokuapp.com/login
- **Feedback Link**: https://usc-pis-5f030223f7a8.herokuapp.com/feedback?visit_id={visit_id}
- **USC-PIS Branding**: Professional templates with USC branding
- **Support Contact**: sgalenelijah@gmail.com

## 🔧 **Technical Implementation**

### **Medical Certificate Email Triggers**
```python
# In medical_certificates/views.py
# Automatically triggered on:
- perform_create() -> 'created' notification
- approve() action -> 'approved' notification  
- reject() action -> 'rejected' notification
```

### **Feedback Email Automation**
```python
# In patients/signals.py
# Django signals automatically log visits for delayed email sending
# Daily management command processes 24-hour-old visits
```

### **Email Service Architecture**
```python
# utils/email_service.py
class EmailService:
    - send_welcome_email()
    - send_password_reset_email()
    - send_medical_certificate_notification()
    - send_feedback_request_email()
    - send_template_email() # Core template engine
```

## 📊 **Monitoring & Logging**

### **Email Delivery Monitoring**
- All emails logged with success/failure status
- Failed emails logged with error details
- Email service failures don't break application flow

### **Log Locations**
```bash
# Check email logs
heroku logs --app usc-pis | grep -i email

# Check specific management command logs
heroku logs --app usc-pis | grep "auto_send_feedback_emails"
```

## 🧪 **Testing Email System**

### **Test Individual Email Types**
```bash
# Test welcome email
python manage.py test_all_emails --email your-test@email.com --test-type welcome

# Test medical certificates
python manage.py test_all_emails --email your-test@email.com --test-type certificates

# Test feedback request
python manage.py test_all_emails --email your-test@email.com --test-type feedback
```

### **Test Production Setup**
```bash
# Test on Heroku
heroku run python backend/manage.py test_all_emails --email your-test@email.com --app usc-pis

# Test specific automation
heroku run python backend/manage.py auto_send_feedback_emails --dry-run --app usc-pis
```

## 📈 **Email Analytics**

### **Current Email Volume** (Estimated)
- **Registration Emails**: ~2-5 per week
- **Password Reset Emails**: ~1-3 per week  
- **Medical Certificate Emails**: ~5-10 per week
- **Feedback Request Emails**: ~5-10 per week (automated)
- **Health Alert Emails**: ~0-2 per week (system dependent)

**Total**: ~15-30 emails per week

## 🚨 **Troubleshooting**

### **Common Issues**

#### 1. **Emails Not Sending**
```bash
# Check email configuration
heroku config --app usc-pis | grep EMAIL

# Test email system
heroku run python backend/manage.py test_all_emails --email your-test@email.com --dry-run --app usc-pis
```

#### 2. **Template Errors**
```bash
# Check for missing templates
ls backend/templates/emails/

# Test specific template
python manage.py test_all_emails --email test@email.com --test-type welcome
```

#### 3. **Scheduler Issues**
```bash
# Check Heroku Scheduler
heroku addons:open scheduler --app usc-pis

# Test commands manually
heroku run python backend/manage.py auto_send_feedback_emails --dry-run --app usc-pis
```

## ✅ **Email System Status**

**🎯 System Status**: **FULLY OPERATIONAL**

- ✅ Gmail App Password configured and working
- ✅ All email templates created and tested
- ✅ Medical certificate workflow emails automated
- ✅ Feedback request emails automated via daily command
- ✅ System health monitoring with email alerts
- ✅ Comprehensive testing framework available
- ✅ Production-ready with Heroku Scheduler support

**Next Steps**: Set up Heroku Scheduler for daily automation

---

**Last Updated**: August 17, 2025  
**Email System**: Fully Automated  
**Total Email Types**: 5 (all active)  
**Automation Level**: 100% automated with scheduler setup