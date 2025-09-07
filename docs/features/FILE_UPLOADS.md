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

