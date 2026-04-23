# File Upload System Status - April 2026

**Last Updated: April 22, 2026**

## **Overview**
The USC-PIS file upload system has been fully stabilized and optimized for production deployment on Heroku. The system follows a **Cloud-First Persistence** model, using Cloudinary as the exclusive storage provider for all clinical and administrative media.

## **Architecture & Security**

### **1. Storage Layer (Cloudinary)**
- **Exclusive Provider**: All files (Campaign Images, X-rays, Scanned Documents, PDFs) are stored on Cloudinary.
- **Heroku Integration**: Standard local storage fallbacks have been removed to ensure files are never saved to Heroku's ephemeral disk (which wipes files daily).
- **Resource Types**: The system is explicitly configured in `settings.py` to handle `image`, `raw`, and `video` formats.

### **2. Security Layer (CSP)**
- **Content Security Policy**: Hardened to allow only trusted sources.
- **PDF Compatibility**: Explicitly allows `blob:`, `data:`, and `https://res.cloudinary.com` to support modern browser PDF rendering.
- **Protection**: `X_FRAME_OPTIONS` is set to `SAMEORIGIN`, preventing external clickjacking while allowing the app to display its own Cloudinary-hosted documents in frames/previews.

### **3. Validation Layer**
- **Signature Detection**: The `FileSecurityValidator` uses binary header checking (`%PDF`) to identify PDFs, providing a more robust check than simple extension matching.
- **MIME Expansion**: Full support for professional formats including `.xlsx`, `.pptx`, `.docx`, and various PDF variants.

## **Clinical Workflows**

### **The "Save then Attach" Workflow**
To prevent data race conditions and ensure 100% database integrity, the clinical forms (Medical/Dental) follow a two-step process:
1.  **Step 1**: Create and save the clinical record (Diagnosis, Treatment, etc.).
2.  **Step 2**: Attach supporting documents using the **Upload** icon in the record list or the **Document Archive**.

### **Centralized Document Archive**
- **Location**: `/health-insights` (Document Archive tab).
- **Function**: A unified repository for all patient documents across all clinical visits. 
- **Linking**: Every upload is automatically linked to its specific Medical or Dental record via **Migration 0004**.

## **Technical Reference**

| Feature | Logic Location |
| :--- | :--- |
| **Storage Config** | `backend/backend/settings.py` |
| **Security Headers** | `backend/backend/middleware.py` |
| **File Logic** | `backend/file_uploads/validators.py` |
| **PDF URL Fix** | `backend/file_uploads/serializers.py` (`view_url`) |
| **Linking Logic** | `frontend/src/components/HealthRecords.jsx` & `Dental.jsx` |

---
*Generated for USC-PIS System Stabilization*
