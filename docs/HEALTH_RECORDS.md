# Health Records System Documentation

**Last Updated:** February 15, 2026

## Overview
The Health Records system (`/health-records`) is the core module for managing patient clinical data. It has been significantly updated to provide a unified, robust, and user-friendly experience for both medical staff and patients (Students/Teachers).

## Key Features

### 1. Unified Record Component (`MedicalRecord.jsx`)
We have moved away from disparate dialogs for creating, editing, and viewing records. A single, powerful component now handles all states:
*   **Create Mode:** Full form access with validation.
*   **Edit Mode:** Pre-filled form with validation. Restricted to Staff/Doctors.
*   **View Mode (`readOnly`):** A simplified, clean UI that displays data in non-editable text blocks. Used for "View" actions and for Patient access.

### 2. Enhanced Patient Search
The patient selection interface now matches the advanced search found in Dental Records.
*   **Autocomplete:** Search by Name, Email, or USC ID.
*   **Visual Context:** Displays patient Avatar, Name, Email, and ID in the dropdown.
*   **Selected State:** Shows a prominent "Patient Card" once a user is selected.

### 3. Validation & Data Integrity
*   **Date Formatting:** Strict enforcement of `YYYY-MM-DD` for backend compatibility, while supporting ISO 8601 parsing.
*   **Robust Schema:** Validation schemas (`yup`) have been relaxed to correctly handle optional numeric fields (Vital Signs) without errors on empty inputs.
*   **Error Visibility:** A global alert box now aggregates all validation errors at the top of the form, making it clear what needs to be fixed.

### 4. Integration with Medical Certificates
*   **Generate Certificate:** A new workflow allows Staff to generate a Medical Certificate directly from a Health Record.
*   **Pre-filling:** Clicking "Generate Certificate" opens the certificate form with Patient Name, Diagnosis, and Recommendations already filled from the record.

## Routes & Access

### Staff / Medical Personnel
*   **Route:** `/health-records`
*   **Capabilities:** View All, Create, Edit, Delete, Generate Certificate, Export.

### Students & Teachers (Patient Role)
*   **Route:** `/health-records` (Displays as "My Health Records")
*   **Capabilities:** View Own Records (Read-Only), Export Own Data.
*   **Note:** Teachers now share the same view and permissions as Students.

## Technical Details
*   **Component:** `frontend/src/components/HealthRecords.jsx` (Main Page), `frontend/src/components/MedicalRecord.jsx` (Form/View).
*   **API:** `healthRecordsService` (`/api/medical-records/`).
*   **State:** Uses `local state` for form management and `Redux` for user role context.
