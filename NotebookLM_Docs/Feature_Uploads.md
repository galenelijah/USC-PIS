# File Uploads

Base path: `/api/files/`

Router

- `uploads` → FileUploadViewSet (basename `file-upload`)

Key endpoints

- Uploads: `GET|POST /api/files/uploads/`
- Upload detail: `GET|DELETE /api/files/uploads/{id}/`

Validation & security

- Extensions allowlist per category; dangerous types blocked
- MIME type check (python-magic when available) with fallback
- Signature checks for suspicious binaries
- Size limits configurable via env: `FILE_UPLOAD_MAX_MEMORY_SIZE`, `DATA_UPLOAD_MAX_MEMORY_SIZE`
- Optional image validations via Pillow if installed

Storage

- Local filesystem by default
- Cloudinary when `USE_CLOUDINARY=True` and creds present

## April 2026 Enhancements
- **Secure Download Proxy**: Implemented a backend proxy for clinical documents (`/api/files/patient-documents/{id}/download/`). Files are no longer accessed via public URLs; they are streamed securely through the Django server with full authentication.
- **In-Record Deletion**: Added the ability to delete attachments directly while viewing Medical or Dental records. This action is restricted to medical staff and requires explicit confirmation.
- **Privacy Hardening**:
    - **Health Insights**: Document records in the unified timeline are now non-interactive. Users can see that a file exists but cannot open/view it from the insights view, ensuring data isolation.
    - **Pagination Management**: Disabled pagination for patient document lists to ensure compatibility with array-based frontend components and improve loading performance for patient profiles.
- **Resource Security**: Metadata such as Cloudinary storage URLs are now hidden from API responses to prevent direct access bypasses.

