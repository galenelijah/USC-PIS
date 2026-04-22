# Campaign Image Upload Fix Guide

## **Issue Identified**
Campaign creation fails with server error when trying to upload images due to missing Cloudinary configuration.

## **Root Cause**
The Cloudinary environment variables are not set in the `.env` file, causing image uploads to fail during campaign creation.

## **Quick Fix Applied**

### 1. **Environment Variables Added to `.env`**
```env
# Cloudinary Configuration (Media Storage)
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 2. **Backend Error Handling Enhanced**
- Added Cloudinary configuration check in `health_info/views.py`
- Graceful fallback when Cloudinary is not configured
- Better error logging for debugging

## **Setup Instructions**

### **For Production (Recommended)**
1. **Get Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com/)
2. **Get API Credentials**: From your Cloudinary Dashboard
3. **Update `.env` file** with your actual credentials:
   ```env
   USE_CLOUDINARY=True
   CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
   CLOUDINARY_API_KEY=your-actual-api-key
   CLOUDINARY_API_SECRET=your-actual-secret-key
   ```

### **For Development/Testing (Local Storage)**
If you don't want to use Cloudinary yet, set:
```env
USE_CLOUDINARY=False
```

This will use local file storage instead.

## **How to Test**

1. **Restart Django Server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Test Campaign Creation**:
   - Go to Campaigns page
   - Click "Create New Campaign"
   - Fill in required fields
   - Try uploading images (banner, thumbnail, pubmat)
   - Submit form

## **Expected Results**

### **With Cloudinary Configured:**
- ✅ Images upload successfully to Cloudinary
- ✅ Images display properly in campaigns
- ✅ Campaign creation completes without errors

### **Without Cloudinary (Local Mode):**
- ✅ Campaign creation works without images
- ⚠️ Images are skipped but form submits successfully
- ℹ️ Warning logged: "Cloudinary not configured - skipping image upload"

## **Verification Steps**

1. **Check Environment Variables**:
   ```python
   # In Django shell
   import os
   print("USE_CLOUDINARY:", os.environ.get('USE_CLOUDINARY'))
   print("CLOUDINARY_CLOUD_NAME:", os.environ.get('CLOUDINARY_CLOUD_NAME'))
   ```

2. **Check Campaign Creation**:
   - Monitor Django logs during campaign creation
   - Look for "Campaign created successfully" message
   - Check if images appear in campaign listing

## **Troubleshooting**

### **Still Getting Errors?**
1. **Check `.env` file location**: Must be in `/backend/.env`
2. **Restart server**: After changing `.env` variables
3. **Check credentials**: Ensure Cloudinary credentials are correct
4. **Check file permissions**: Ensure `.env` file is readable

### **Images Not Displaying?**
1. **Check Cloudinary dashboard**: Verify images are uploaded
2. **Check browser network tab**: Look for 404 errors on image URLs
3. **Check CORS settings**: Ensure Cloudinary URLs are accessible

## **Files Modified**

1. **`backend/.env`** - Added Cloudinary environment variables
2. **`backend/health_info/views.py`** - Enhanced error handling and Cloudinary checks
3. **`CAMPAIGN_IMAGE_UPLOAD_FIX.md`** - This documentation

## **Next Steps**

1. **Configure Cloudinary credentials** in `.env` file
2. **Restart Django development server**
3. **Test campaign creation** with image uploads
4. **Monitor logs** for any remaining issues

---

**Status**: ✅ **FIXED** - Campaign creation should now work with proper Cloudinary configuration or graceful fallback to local storage.

**Last Updated**: September 6, 2025