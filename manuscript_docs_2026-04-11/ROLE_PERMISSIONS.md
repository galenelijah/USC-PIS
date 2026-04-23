# USC-PIS Role and Permission Definitions

This document outlines the user roles and their respective access levels within the University of San Carlos Patient Information System (USC-PIS).

## User Roles

The system recognizes seven distinct roles, grouped into three primary categories:

1.  **Administrative**: ADMIN, STAFF
2.  **Clinical/Medical**: DOCTOR, DENTIST, NURSE
3.  **Patient/End-User**: STUDENT, FACULTY

---

## Permission Matrix

### 1. Administrative Category

#### **ADMIN (Administrator)**
*   **System Management**: Full access to User Management (creating, editing, deleting users).
*   **System Monitoring**: Access to Database Monitoring tools and system logs.
*   **Configuration**: Manage Email Administration and global system settings.
*   **Data Access**: View all patient records, medical records, and dental consultations.
*   **Reporting**: Full access to the Reports and Analytics module.
*   **Content**: Create and manage Health Information and Campaigns.

#### **STAFF (Office/Clinic Staff)**
*   **Patient Management**: Create and manage patient profiles (ID Number, Program, Year Level).
*   **Record Management**: Create and update basic Medical Records.
*   **Content Management**: Create and manage Health Information articles and Health Campaigns.
*   **Feedback**: View and manage patient feedback.
*   **Analytics**: View clinical reports and analytics.
*   **Administrative**: Access to Email Administration.

---

### 2. Clinical/Medical Category

#### **DOCTOR (Physician)**
*   **Clinical Assessment**: Full access to create and edit detailed Medical Records (Vitals, Assessment, Plan, Concerns).
*   **Patient Dashboard**: Access to the comprehensive Patient Medical Dashboard for historical trends.
*   **Certification**: Issue and approve Medical Certificates.
*   **Analytics**: View detailed clinical reports and health insights.
*   **History**: Access the Unified Health History of any patient.

#### **DENTIST (Dental Surgeon)**
*   **Dental Consultations**: Full access to create and manage Dental Records (Procedures, Tooth Mapping, Treatment Plans).
*   **Clinical Records**: Create and view Medical Records for cross-referencing health history.
*   **Certification**: Issue Medical/Dental Certificates.
*   **Analytics**: View dental-specific reports and general analytics.

#### **NURSE (Clinic Nurse)**
*   **Patient Intake**: Register new patients and update existing profiles.
*   **Vitals Tracking**: Record vitals and initial patient concerns in Medical Records.
*   **Health Promotion**: Manage and publish Health Campaigns and Information.
*   **History**: View patient health history to assist clinical staff.
*   **Analytics**: View general clinical reports.

---

### 3. Patient/End-User Category

#### **STUDENT (University Student)**
*   **Self-Service**: View their own Unified Health History, including medical and dental visits.
*   **Record Access**: Download their own Medical Records and specific visit logs.
*   **Profile**: Manage their personal profile, emergency contacts, and sensitive health declarations (with encryption).
*   **Health Insights**: View personal health trends and data-driven insights.
*   **Information**: Access published Health Information and Campaigns.
*   **Feedback**: Submit service feedback to the clinic.

#### **FACULTY (Faculty/Employee)**
*   **Self-Service**: Same access as a STUDENT (viewing own history, personal health insights).
*   **Profile Management**: Update employee-specific health information and contact details.
*   **Certificates**: View and download their own Medical Certificates.

---

## Security and Privacy Features

*   **Role-Based Access Control (RBAC)**: All API endpoints are protected by role-specific permissions to ensure data is only accessible to authorized personnel.
*   **Data Encryption (pgcrypto)**: Sensitive patient fields (Allergies, Medications, Illnesses) are encrypted at the database level and are only decrypted for authorized medical roles.
*   **Audit Logging**: The system tracks record creation and modifications (via `created_by` and `updated_at` fields) for accountability.
*   **Secure File Access**: Document attachments (archives) are served via a secure proxy, ensuring only authorized users can view clinical files.
