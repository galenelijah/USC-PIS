# File Upload System Status - April 2026

## **Overview**
The USC-PIS file upload system has been stabilized and optimized for production deployment on Heroku using Cloudinary for permanent storage. This document summarizes the recent fixes and the current architecture.

## **Recent Fixes (April 22, 2026)**

### 1. **Persistent Campaign Media**
- **Issue**: Campaign creation was failing or skipping images when Cloudinary wasn't perfectly configured.
- **Fix**: Re-aligned the `HealthCampaignCreateUpdateSerializer` to use standard Django storage patterns. 
- **Persistence**: Explicitly removed local storage fallbacks for campaigns to prevent data loss on Heroku's ephemeral filesystem. All campaign media now goes directly to **Cloudinary**.

### 2. **Patient Document API Correction**
- **Issue**: The frontend was hitting `/api/file-uploads/patient-documents/`, but the backend was listening on `/api/files/patient-documents/`.
- **Fix**: Synchronized the frontend `patientDocumentService` to use the correct backend route.
- **Result**: Patient document uploads are now fully functional and correctly linked to patient profiles.

### 3. **Expanded Professional File Support**
- **Issue**: Security validation was too restrictive, blocking common professional files like Excel and PowerPoint.
- **Fix**: Updated `FileSecurityValidator` to allow the following formats:
    - **Documents**: `.pdf`, `.doc`, `.docx`, `.txt`, `.rtf`, `.odt`
    - **Spreadsheets**: `.xls`, `.xlsx`, `.csv`, `.ods`
    - **Presentations**: `.ppt`, `.pptx`, `.odp`
    - **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`
- **Security**: Added robust MIME type detection and consistency checks to ensure only safe files are processed.

## **System Architecture**

### **Storage Backend (Cloudinary)**
- **Configuration**: Managed in `backend/backend/settings.py` via the `STORAGES` dictionary.
- **Scope**: All user-uploaded content (Campaign images, Patient documents, Health Info images) is stored externally on Cloudinary.
- **Heroku Compatibility**: This architecture is mandatory for Heroku, as any file saved to the local Heroku disk is deleted within 24 hours.

### **Validation Layer**
- **Location**: `backend/file_uploads/validators.py`
- **Functions**: 
    - Filename sanitization (removes dangerous characters).
    - File size limits (default 25MB, images 10MB).
    - Content-type verification (checks actual file bytes, not just extensions).
    - Dangerous extension blocking (`.exe`, `.sh`, `.php`, etc.).

## **Maintenance & Troubleshooting**

### **Verifying Cloudinary Connection**
If images stop loading:
1. Check Heroku Config Vars: `USE_CLOUDINARY` must be `True`.
2. Verify API Credentials: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` must match your Cloudinary dashboard.

### **Restoring Broken References**
If deployment causes existing image references to break, run:
```bash
heroku run python manage.py restore_campaign_images
```

## **File Reference Summary**
- **Backend Settings**: `backend/backend/settings.py`
- **Validators**: `backend/file_uploads/validators.py`
- **Campaign Logic**: `backend/health_info/serializers.py`
- **Frontend Service**: `frontend/src/services/api.js`
