# USC-PIS: Technical Architecture & System Evaluation Report

## 1. System Architecture & Tech Stack
The University of San Carlos Patient Information System (USC-PIS) is engineered using a modern, scalable **three-tier web architecture** designed for high availability and low-latency clinical operations.

*   **Presentation Layer (Frontend):** Developed utilizing **React 18** with the **Vite** build system. The interface leverages **Material-UI (MUI)** components to provide a responsive, progressive-disclosure GUI compatible with desktop and mobile browsers.
*   **Application Layer (Backend):** Powered by **Python** and **Django 5.0.2**, integrated with **Django REST Framework (DRF) 3.14.0**. Heavy clinical data processing and report generation are handled asynchronously via a **Celery** task queue with **Redis** as the message broker to prevent HTTP thread blocking.
*   **Data Layer (Database):** Implements a dual-database paradigm. **PostgreSQL 16.8** is utilized for production environments, while **SQLite** is used for local development, synchronized via vendor-aware migration logic.
*   **Enterprise Integrations:**
    *   **Hosting & CI/CD:** Orchestrated via **Heroku** with an automated **GitHub Actions** pipeline.
    *   **Scalable Media Storage:** Utilizes **Cloudinary CDN** for secure, persistent storage of attachments and campaign PubMats.
    *   **Communications:** Interfaces with the **Gmail API** via **OAuth 2.0** for reliable dispatch of verification codes and feedback reminders.

## 2. Security & Data Privacy Integration
The system enforces military-grade security protocols to safeguard Protected Health Information (PHI) and satisfy data privacy regulations.

*   **Database Encryption:** Integration of the PostgreSQL **`pgcrypto` extension** enforces **AES-256 column-level symmetric encryption-at-rest**. Sensitive fields (Patient Names, Diagnoses, Illnesses) are intercepted by Django signals and converted into secure **BinaryField (bytea)** hashes upon database commit.
*   **Role-Based Access Control (RBAC):** Access is strictly governed by DRF permission classes across a hierarchical user structure: **Admin, Doctor, Dentist, Nurse, Staff, and Student/Faculty (Patient)**.
*   **SafeList Onboarding:** A specialized protocol that maps pre-authorized clinical emails to specific roles, bypassing standard MFA logic to automate professional account deployment.
*   **System Hardening:** The file upload module implements rigorous validation, achieving a **100% rejection rate** against high-risk executable formats, including **.EXE, .JS, and .PY** scripts.

## 3. Core Functionalities & Clinical Workflows
The USC-PIS digitalizes and optimizes critical clinic operations through specialized modules.

*   **Unified Clinical Charting:** Centralized interfaces for Medical and Dental record management. The Dental module includes strict **regex validation** for **FDI notation (11-48)** to ensure clinical accuracy.
*   **Medical Certificate Pipeline:** Digitalizes the **USC Form ACA-HSD-04F** issuance. The workflow is role-gated, allowing Nurses to draft documents while restricting final approval and PDF unlocking exclusively to users with the **DOCTOR** role.
*   **Asynchronous Reporting Engine:** A Celery-powered module that synthesizes massive clinical datasets into five export formats: **PDF, Excel (.xlsx), CSV, JSON, and HTML**.
*   **Automated Feedback Loops:** Generates visit-linked satisfaction surveys with automated **24-hour follow-up notifications** to ensure high student engagement.
*   **Application Retooling:** An advanced filtering architecture that allows clinical staff to dynamically segment the patient registry by **Academic Year, Semester, and Program** in real-time.

## 4. Database Schema & Integrity
The database architecture is normalized to **Third Normal Form (3NF)** to eliminate redundancy and ensure absolute data consistency.

*   **Entity Decoupling:** The schema cleanly separates **`authentication_user`** (credentials and RBAC identifiers) from **`patients_patient`** (demographic and academic profiles) to resolve over-normalization risks.
*   **Relational Integrity:** Clinical records and certificates are mapped via explicitly constrained Foreign Keys with cascading safeguards.
*   **Healthcare Compliance:** Every clinical entity (Medical Records, Dental Records, Profiles) retains strict **`created_at`** and **`updated_at`** immutability, establishing a permanent, forensic audit trail required for healthcare compliance.

## 5. Testing, SQA, and Performance Metrics
The USC-PIS underwent rigorous Software Quality Assurance (SQA) audits to verify reliability under peak clinical loads.

*   **DevOps Pipeline:** **GitHub Actions CI/CD** executes **15 automated tests** (Unit, Integration, and Performance) before every production deployment.
*   **Search Query Latency:** Achieved a benchmark of **127.81ms** for patient searches among 100+ records, nearly four times faster than the 500ms threshold.
*   **PDF Rendering Speed:** The dual-engine rendering module generates official certificates in **122.93ms to 124.53ms**.
*   **System Concurrency:** Handled **20 simultaneous HTTP requests** in **0.66 seconds** with a **0% data drop rate**.
*   **Cryptographic Overhead:** The `pgcrypto` execution adds **< 1.0ms** to database transactions, ensuring security without impacting UX.
*   **User Acceptance Testing (UAT):**
    *   **Student Satisfaction Mean:** **4.76 / 5.00**
    *   **Clinic Staff Satisfaction Mean:** **3.29 / 5.00** (Reflecting initial transition friction from manual workflows).
