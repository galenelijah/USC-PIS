# Cloudinary Setup for USC-PIS Production

## Overview

This guide sets up **persistent media storage** for USC-PIS production deployment using Cloudinary. Solves the Heroku ephemeral filesystem issue where uploaded images disappear after dyno restarts.

## Why Cloudinary?

- ✅ **25 GB free storage** (permanent, no credit card required)
- ✅ **Global CDN** for faster image loading worldwide  
- ✅ **Automatic optimization** - images compressed and optimized
- ✅ **Zero downtime migration** - app keeps running during setup
- ✅ **Fully reversible** - can easily rollback if needed

## Prerequisites

- USC-PIS app deployed on Heroku
- Admin access to Heroku app settings
- 5 minutes of setup time

## Step-by-Step Implementation

### Step 1: Create Cloudinary Account (2 minutes)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Use your USC email for consistency
4. **No credit card required** for free tier
5. After signup, go to Dashboard
6. Copy these three values:
   - **Cloud Name**: (e.g., `usc-pis-media`)
   - **API Key**: (20-digit number)
   - **API Secret**: (long alphanumeric string)

### Step 2: Configure Heroku Environment (1 minute)

**Option A: Via Heroku CLI**
```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name_here
heroku config:set CLOUDINARY_API_KEY=your_api_key_here
heroku config:set CLOUDINARY_API_SECRET=your_api_secret_here
heroku config:set USE_CLOUDINARY=True
```

**Option B: Via Heroku Dashboard**
1. Go to your Heroku app dashboard
2. Click "Settings" tab
3. Click "Reveal Config Vars"
4. Add these four variables:
   - `CLOUDINARY_CLOUD_NAME` = your_cloud_name
   - `CLOUDINARY_API_KEY` = your_api_key  
   - `CLOUDINARY_API_SECRET` = your_api_secret
   - `USE_CLOUDINARY` = True

### Step 3: Add Cloudinary Dependencies (1 minute)

Uncomment the Cloudinary packages in requirements.txt:

```bash
# Edit requirements.txt and change:
# cloudinary==1.36.0
# django-cloudinary-storage==0.3.0

# To:
cloudinary==1.36.0
django-cloudinary-storage==0.3.0
```

### Step 4: Deploy (2 minutes)

```bash
git add .
git commit -m "Activate Cloudinary media storage for production

- Resolves Heroku ephemeral filesystem issue
- Provides persistent image storage for campaigns
- Enables global CDN delivery for better performance
- Implements automatic image optimization

🤖 Generated with Claude Code"
git push heroku main
```

### Step 5: Verify Setup (2 minutes)

1. **Check deployment logs**:
   ```bash
   heroku logs --tail
   ```
   Look for successful deployment messages.

2. **Test image upload**:
   - Go to your production app
   - Upload a new campaign image
   - Check that image URL starts with `https://res.cloudinary.com/`

3. **Verify persistence**:
   ```bash
   heroku restart
   ```
   Image should still load after restart.

### Step 6: Clean Up Broken References (Optional)

Remove old broken image references from database:

```bash
heroku run python manage.py restore_campaign_images
```

## What Changes

### Before (Heroku Filesystem)
- ❌ Images deleted on dyno restart (every 24 hours)
- ❌ URLs like `/media/banners/image.jpg` return 404
- ❌ Users see broken images randomly

### After (Cloudinary)
- ✅ Images persist forever
- ✅ URLs like `https://res.cloudinary.com/usc-pis/image/upload/v1234/banners/image.jpg`
- ✅ Global CDN delivery (faster loading)
- ✅ Automatic optimization (smaller file sizes)

## Testing Checklist

- [ ] New campaign image uploads successfully
- [ ] Image URLs start with `https://res.cloudinary.com/`
- [ ] Images load in browser
- [ ] Images persist after `heroku restart`
- [ ] All existing functionality works normally
- [ ] No errors in `heroku logs`

## Rollback Plan

If anything goes wrong, easily revert:

```bash
# Disable Cloudinary
heroku config:unset USE_CLOUDINARY

# System automatically reverts to filesystem storage
# All new uploads go to local storage again
```

For complete rollback (if needed):
```bash
heroku config:unset CLOUDINARY_CLOUD_NAME
heroku config:unset CLOUDINARY_API_KEY  
heroku config:unset CLOUDINARY_API_SECRET
```

## Troubleshooting

### Images Not Uploading
- Check Heroku config vars are set correctly
- Verify `USE_CLOUDINARY=True` (case sensitive)
- Check logs: `heroku logs --tail`

### Old Images Still Broken
- Run: `heroku run python manage.py restore_campaign_images`
- This is expected - only NEW uploads go to Cloudinary

### Permission Errors
- Verify API credentials are correct in Cloudinary dashboard
- Ensure no extra spaces in config vars

## Cost Monitoring

**Free Tier Limits (Permanent):**
- 25 GB storage
- 25 GB monthly bandwidth
- No time limit (unlike AWS S3)

**Usage Monitoring:**
- Check usage at [cloudinary.com/console](https://cloudinary.com/console)
- USC-PIS estimated usage: <1 GB storage, <5 GB bandwidth/month
- Well within free tier limits

## Support

If issues arise:
1. Check Heroku logs: `heroku logs --tail`
2. Verify config vars: `heroku config`
3. Test locally with same environment variables
4. Cloudinary support: [support.cloudinary.com](https://support.cloudinary.com)

---

**Implementation Status**: ✅ Ready to activate  
**Risk Level**: Very Low (fully reversible)  
**Estimated Setup Time**: 5 minutes  
**Downtime**: Zero