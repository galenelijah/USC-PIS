# Health & Dental Records System Documentation

**Last Updated:** April 25, 2026

## Overview
The Clinical Records system covers both Medical and Dental departments. It provides a unified experience for managing patient clinical data, focused on streamlined charting and secure documentation.

## Key Features

### 1. Unified Record Component (`MedicalRecord.jsx` & `Dental.jsx`)
We have moved away from disparate dialogs for creating, editing, and viewing records. A single, powerful component now handles all states:
*   **Create Mode:** Full form access with validation.
*   **Edit Mode:** Pre-filled form with validation. Restricted to Staff/Doctors.
*   **View Mode (`readOnly`):** A simplified, clean UI that displays data in non-editable text blocks. Used for "View" actions and for Patient access.

### 2. Streamlined Consultations (Medical & Dental)
*   **Mandatory Concern:** Both medical and dental visits now prioritize the **"Concern / Reason for Visit"** as the primary field.
*   **Dental Simplification:** Dental records have been refactored to focus on consultations and referrals. Fields like "Diagnosis" and "Treatment" are now optional, allowing for rapid-entry dental checks.
*   **Referral Support:** Added an explicit **"Referral To"** field for dental visits requiring external specialist care.

### 3. Enhanced Patient Search
The patient selection interface provides advanced search functionality:
*   **Autocomplete:** Search by Name, Email, or USC ID.
*   **Visual Context:** Displays patient Avatar, Name, Email, and ID in the dropdown.
*   **Selected State:** Shows a prominent "Patient Card" once a user is selected.

### 4. Patient Dashboards (Personalized)
*   **Medical Dashboard:** Students and faculty have access to a personalized overview of their clinical history, vital signs, and documents.
*   **Role-Based Restriction:** As of April 25, 2026, personal dashboards are restricted to Student and Faculty roles only. Administrative staff use the management interfaces.
*   **Automatic Counts:** Dashboards display real-time counts of Medical Records and Consultations (Medical + Dental).

### 5. Integration with Medical Certificates
*   **Generate Certificate:** A new workflow allows Staff to generate a Medical Certificate directly from a Health Record.
*   **Pre-filling:** Clicking "Generate Certificate" opens the certificate form with Patient Name, Purpose/Requirement, and Recommendations already filled from the record.

## Routes & Access

### Staff / Medical Personnel
*   **Route:** `/health-records` & `/dental-records`
*   **Capabilities:** View All, Create, Edit, Delete, Generate Certificate, Export.

### Students & Teachers (Patient Role)
*   **Route:** `/health-records` (Displays as "My Health Records") & `/patient-dashboard`
*   **Capabilities:** View Own Records (Read-Only), View Personal Health Trends.

## Technical Details
*   **Components:** `HealthRecords.jsx`, `Dental.jsx`, `PatientMedicalDashboard.jsx`.
*   **APIs:** `healthRecordsService`, `dentalRecordService`.
*   **State:** Uses `local state` for form management and `Redux` for user role context.
