# USC-PIS Email Notifications Setup Guide

## 📧 Email System Implementation Complete

The USC-PIS email notification system has been successfully implemented with professional templates and automated workflows.

## 🚀 Quick Setup (Production)

### Step 1: Create SendGrid Account (Recommended)
1. Visit [SendGrid](https://sendgrid.com) and create a free account (100 emails/day)
2. Go to Settings → API Keys
3. Create a new API key with "Full Access" permissions
4. Copy the API key (starts with `SG.`)

### Step 2: Set Environment Variables
Add these variables to your Heroku app:

```bash
# Via Heroku CLI
heroku config:set EMAIL_HOST_PASSWORD="your_sendgrid_api_key_here"
heroku config:set DEFAULT_FROM_EMAIL="noreply@usc-pis.herokuapp.com"

# Or via Heroku Dashboard
# Go to Settings → Config Vars → Add:
EMAIL_HOST_PASSWORD=your_sendgrid_api_key_here
DEFAULT_FROM_EMAIL=noreply@usc-pis.herokuapp.com
```

### Step 3: Deploy and Test
```bash
git add .
git commit -m "Add email notification system"
git push heroku main

# Test the system
heroku run python manage.py test_email --email your-email@usc.edu.ph
```

## 🛠️ Development Setup

### Local Testing (Console Backend)
By default, emails are printed to console in development:

```bash
cd USC-PIS/backend
source venv/Scripts/activate  # Windows
python manage.py test_email --email test@usc.edu.ph
```

### Local Testing (Gmail SMTP)
For testing with real emails locally:

```bash
# Add to your .env file
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Not your regular password!
DEFAULT_FROM_EMAIL=your-gmail@gmail.com
```

## 📋 Email Templates Created

### 1. Welcome Email (`welcome.html`)
- **Trigger**: User registration
- **Recipient**: New users
- **Content**: Welcome message, system overview, next steps

### 2. Password Reset (`password_reset.html`)
- **Trigger**: Password reset request
- **Recipient**: Users requesting password reset
- **Content**: Secure reset link, security tips

### 3. Medical Certificate Notifications
- **`certificate_created.html`**: Confirmation of certificate request
- **`certificate_approved.html`**: Certificate approval notification
- **Trigger**: Medical certificate workflow events
- **Recipients**: Students and medical staff

### 4. Feedback Request (`feedback_request.html`)
- **Trigger**: 24 hours after medical visit
- **Recipient**: Patients
- **Content**: Quick feedback buttons, detailed feedback form link

## 🔧 Management Commands

### Test Email System
```bash
# Test welcome email
python manage.py test_email --email your@email.com --type welcome

# Test password reset email
python manage.py test_email --email your@email.com --type password_reset
```

### Send Automated Feedback Emails
```bash
# Dry run (see what would be sent)
python manage.py send_feedback_emails --dry-run

# Send actual emails for visits from 24 hours ago
python manage.py send_feedback_emails --hours 24

# Send for visits from 48 hours ago
python manage.py send_feedback_emails --hours 48
```

## 📅 Automated Email Schedule (Future Setup)

To fully automate feedback emails, set up a daily cron job or Heroku Scheduler:

### Heroku Scheduler Setup
1. Install Heroku Scheduler addon:
   ```bash
   heroku addons:create scheduler:standard
   ```

2. Add scheduled job:
   ```bash
   heroku addons:open scheduler
   ```

3. Create daily job:
   - **Command**: `python manage.py send_feedback_emails --hours 24`
   - **Schedule**: Daily at 10:00 AM
   - **Description**: Send feedback emails for visits from 24h ago

## 🎯 Email Features Implemented

### ✅ Basic Notifications
- [x] Welcome emails for new registrations
- [x] Password reset emails with secure tokens
- [x] Professional HTML templates with USC-PIS branding
- [x] Mobile-responsive email design

### ✅ Medical Workflow Integration
- [x] Medical certificate status notifications
- [x] Automated feedback requests after visits
- [x] Doctor notifications for pending approvals
- [x] Patient notifications for certificate updates

### ✅ System Features
- [x] Graceful error handling (emails don't break registration)
- [x] Development/production email backend switching
- [x] Email service abstraction layer
- [x] Management commands for testing and automation

## 🔍 Troubleshooting

### Email Not Sending
1. Check environment variables:
   ```bash
   heroku config | grep EMAIL
   ```

2. Test email configuration:
   ```bash
   heroku run python manage.py test_email --email your@email.com
   ```

3. Check logs:
   ```bash
   heroku logs --tail | grep -i email
   ```

### Common Issues

#### "Invalid API Key" Error
- Double-check your SendGrid API key
- Ensure the key has proper permissions
- Regenerate the key if necessary

#### Emails Going to Spam
- Set up SPF/DKIM records (SendGrid provides instructions)
- Use a custom domain for sending emails
- Warm up your sending reputation gradually

#### Template Not Found Error
- Ensure template files are in `backend/templates/emails/`
- Check template file names match exactly
- Verify the templates directory is included in TEMPLATES setting

## 📈 Next Steps for Enhancement

### Phase 1: Advanced Notifications (Optional)
- Appointment reminder emails (24h and 2h before)
- Health campaign announcement emails
- System maintenance notifications
- Weekly health insights summaries

### Phase 2: Email Analytics (Optional)
- Track email open rates
- Monitor click-through rates
- A/B test email templates
- Delivery success monitoring

### Phase 3: Multi-language Support (Optional)
- English/Filipino email templates
- User language preferences
- Localized email content

## 📊 Email System Statistics

Once deployed, you can track:
- **Welcome emails**: Sent to all new users automatically
- **Feedback requests**: Sent 24 hours after medical visits
- **Certificate notifications**: Sent for all workflow state changes
- **Password resets**: Sent on-demand for security requests

## 🎉 Success Metrics

After implementation, you should see:
- ✅ **Improved user engagement**: Users receive timely, relevant notifications
- ✅ **Better feedback collection**: Automated reminders increase response rates
- ✅ **Professional experience**: Branded emails enhance system credibility
- ✅ **Reduced support load**: Clear communication reduces user confusion

---

**Email system implementation complete!** 🚀  
The USC-PIS now has a comprehensive, professional email notification system ready for production use.

For support or questions about the email system, check the implementation in:
- `backend/utils/email_service.py` - Core email service
- `backend/templates/emails/` - Email templates
- `backend/utils/management/commands/` - Management commands