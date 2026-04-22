# Campaign Image Upload Fix - April 2026

## **Status**
✅ **STABILIZED** - The campaign creation and update process has been streamlined to use standard Django patterns for better reliability with Cloudinary.

## **Implementation Details**
The campaign system is now strictly configured to use **external cloud storage (Cloudinary)** for all media. This is essential for Heroku deployment because:
1.  Heroku's local disk is **ephemeral** (files are deleted every 24 hours).
2.  Local storage fallbacks would lead to broken images and data loss.

### **Key Technical Changes**
- **Serializer Optimization**: `HealthCampaignCreateUpdateSerializer` in `backend/health_info/serializers.py` now leverages Django's native storage management.
- **Auto-Upload**: Images are automatically routed to Cloudinary based on the `STORAGES` configuration in `backend/backend/settings.py`.
- **Validation**: File size and type validation occur before any upload attempt to ensure security and prevent server-side crashes.

## **Deployment Checklist for Images**

### 1. **Verify Cloudinary Status**
Ensure the following variables are set in your Heroku environment:
- `USE_CLOUDINARY=True`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

### 2. **Check Content Security Policy (CSP)**
The system is configured with a strict CSP. If images do not load, verify that `https:` is allowed in `CSP_IMG_SRC` within `settings.py`:
```python
CSP_IMG_SRC = ("'self'", "data:", "https:")
```

### 3. **Run Image Restoration (If needed)**
If campaign images appear broken after a migration or significant deployment, run the restoration command to clear dead references:
```bash
heroku run python manage.py restore_campaign_images
```

## **Related Documentation**
- For general file upload status (Patient documents, etc.), see: `FILE_UPLOAD_SYSTEM_STATUS.md`
- For Cloudinary setup instructions, see: `backend/CLOUDINARY_SETUP.md`
