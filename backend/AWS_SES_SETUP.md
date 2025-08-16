# AWS SES Setup for USC-PIS Email System

## Overview

This guide sets up **Amazon Simple Email Service (SES)** for USC-PIS production email delivery. AWS SES provides reliable, cost-effective email service with excellent deliverability.

## Why AWS SES?

- ✅ **Free Tier**: 62,000 emails/month for 12 months (then $0.10 per 1,000)
- ✅ **High Deliverability**: 99.9% delivery rate
- ✅ **Reliable**: Enterprise-grade infrastructure
- ✅ **Scalable**: Handles growth automatically
- ✅ **Cost-Effective**: Most affordable option for high volume

## Prerequisites

- AWS Account (free to create)
- Admin access to USC-PIS Heroku app
- 15 minutes setup time

## Step-by-Step Setup

### Step 1: Create AWS Account (5 minutes)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow signup process (requires credit card but SES free tier covers USC-PIS needs)
4. Complete account verification

### Step 2: Set Up SES in AWS Console (5 minutes)

1. **Login to AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Login with your AWS account

2. **Navigate to SES**
   - Search for "SES" in services
   - Select "Simple Email Service"
   - Choose region: **US East (N. Virginia)** recommended

3. **Verify Domain or Email**
   - Click "Verified identities" in left menu
   - Click "Create identity"
   - Choose "Email address" for quick setup
   - Enter: `noreply@usc-pis.com` (or your preferred from email)
   - Click "Create identity"
   - **Check your email** and click verification link

### Step 3: Create IAM User for SES (3 minutes)

1. **Go to IAM Service**
   - Search for "IAM" in AWS console
   - Click "Users" in left menu
   - Click "Create user"

2. **Create User**
   - Username: `usc-pis-ses-user`
   - Access type: ✅ **Programmatic access**
   - Click "Next"

3. **Attach Permissions**
   - Click "Attach policies directly"
   - Search for and select: `AmazonSESFullAccess`
   - Click "Next" → "Create user"

4. **Save Credentials**
   - **⚠️ IMPORTANT**: Copy and save these values:
     - `Access Key ID`: (starts with AKIA...)
     - `Secret Access Key`: (long random string)
   - **You won't see the secret again!**

### Step 4: Configure Heroku Environment (2 minutes)

```bash
# Set AWS SES credentials in Heroku
heroku config:set USE_AWS_SES=True
heroku config:set AWS_ACCESS_KEY_ID="your_access_key_id_here"
heroku config:set AWS_SECRET_ACCESS_KEY="your_secret_access_key_here"
heroku config:set AWS_SES_REGION_NAME="us-east-1"
heroku config:set DEFAULT_FROM_EMAIL="noreply@usc-pis.com"

# Verify configuration
heroku config | findstr AWS
```

### Step 5: Deploy and Test (5 minutes)

```bash
# Deploy the AWS SES integration
git add .
git commit -m "Integrate AWS SES for production email delivery

- Add django-ses and boto3 packages
- Configure AWS SES with fallback to SMTP
- Support both SES and SendGrid backends
- Free tier covers 62,000 emails/month

🤖 Generated with Claude Code"
git push heroku main

# Test email functionality
heroku run python manage.py shell -c "
from django.core.mail import send_mail
send_mail(
    'AWS SES Test Email',
    'This is a test email from USC-PIS using AWS SES.',
    'noreply@usc-pis.com',
    ['your-email@usc.edu.ph'],
    fail_silently=False,
)
print('Email sent successfully!')
"
```

## Verification Checklist

- [ ] AWS account created and verified
- [ ] SES email identity verified (check email for verification link)
- [ ] IAM user created with SES permissions
- [ ] AWS credentials copied and saved securely
- [ ] Heroku environment variables set
- [ ] Application deployed successfully
- [ ] Test email sent and received

## Expected Results

After setup, you should see:
- ✅ No email backend errors in logs
- ✅ Test emails delivered successfully
- ✅ From address shows as your verified email
- ✅ Emails have high deliverability (no spam folder)

## Moving Out of SES Sandbox

**Initially, SES is in "sandbox mode"** which restricts sending:
- ✅ Can send to verified email addresses only
- ❌ Cannot send to unverified addresses
- ❌ Limited to 200 emails/day

**To send to any USC email addresses**:

1. **Request Production Access**
   - Go to SES Console → "Account dashboard"
   - Click "Request production access"
   - Fill out form:
     - **Use case**: Transactional emails for healthcare application
     - **Website URL**: https://usc-pis-5f030223f7a8.herokuapp.com
     - **Description**: "Sending medical appointment confirmations, certificate notifications, and system alerts for University of Southern California Patient Information System"
   - Submit request

2. **Approval Process**
   - Usually approved within 24 hours
   - AWS may ask for additional information
   - Once approved: unlimited verified recipients

## Cost Monitoring

**Free Tier (12 months)**:
- 62,000 emails/month FREE
- Covers USC-PIS needs completely

**After Free Tier**:
- $0.10 per 1,000 emails
- USC-PIS estimated: <$5/month

**Monitor Usage**:
- Check SES console → "Account dashboard"
- View sending statistics and costs

## Troubleshooting

### Email Not Sending
1. Check Heroku logs: `heroku logs --tail`
2. Verify AWS credentials are set correctly
3. Ensure from email is verified in SES
4. Check if still in SES sandbox mode

### "MessageRejected" Error
- **Cause**: From email not verified in SES
- **Solution**: Verify the email address in SES console

### "AccessDenied" Error  
- **Cause**: IAM user lacks SES permissions
- **Solution**: Add `AmazonSESFullAccess` policy to IAM user

### "InvalidParameterValue" Error
- **Cause**: Wrong region or malformed email
- **Solution**: Verify region matches SES setup

## Fallback to SendGrid

If AWS SES doesn't work, easily switch back:

```bash
# Disable AWS SES
heroku config:unset USE_AWS_SES

# Set SendGrid credentials (if available)
heroku config:set EMAIL_HOST_PASSWORD="your_sendgrid_api_key"
```

## Support

- **AWS SES Documentation**: [docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses)
- **Django-SES Package**: [github.com/django-ses/django-ses](https://github.com/django-ses/django-ses)
- **AWS Support**: Available through AWS console

---

**Setup Status**: ✅ Ready for deployment  
**Cost**: Free (62,000 emails/month for 12 months)  
**Reliability**: Enterprise-grade (99.9% uptime)  
**Deliverability**: Excellent (better than most SMTP services)