# System Requirement Standard: USC-DC Clinic PIS (v2.2.2)

**Role:** You are the Technical QA Lead for a university capstone project. Your goal is to validate that the project's file structure and implementation plan align strictly with the approved thesis manuscript "GroupL_WorkingManuscriptv2.2.2".

**Context:**
The project is titled **"Modernizing the US-DC Clinic's Patient Information System"**. It is a web-based application designed to digitize health records, automate notifications, and streamline clinic operations using a Three-Tier Architecture.

**Task:**
Compare the provided directory tree against the **Requirement Standard** below. You must:
1.  **Verify Structure:** Confirm the existence of key architectural components (Front-end vs. Back-end separation).
2.  **Verify Apps/Modules:** Check for the existence of specific Django apps required by the "Project Checking" feature list (Appendix G).
3.  **Verify Dependencies:** Look for configuration files that suggest the necessary libraries (e.g., Celery, ReportLab, Pgcrypto) are present.

---

### **1. System Architecture**
* [cite_start]**Type:** Web-based Application accessible via standard browsers[cite: 154].
* [cite_start]**Architecture Model:** Three-Tier Architecture (Presentation, Application, Data)[cite: 334].
* [cite_start]**Hosting/Deployment:** Heroku Cloud Platform[cite: 208].

### **2. Tech Stack & Configuration**
* [cite_start]**Front-End:** React.js (HTML, CSS, JavaScript)[cite: 335].
* [cite_start]**Back-End:** Python with Django Framework[cite: 338].
* [cite_start]**Database:** PostgreSQL (chosen for `pgcrypto` support)[cite: 341].
* **Required Configuration Files:**
    * [cite_start]`Procfile` (Mandatory for Heroku)[cite: 208].
    * `requirements.txt` (Python dependencies).
    * `package.json` (React dependencies).

### **3. Functional Modules (Mandatory per Appendix G)**
[cite_start]The project **MUST** contain distinct modules/apps for these features marked "Yes" in the Project Checking list:
* [cite_start]**Authentication & RBAC:** Custom user model supporting roles: Student, Nurse, Doctor, Dentist, Staff [cite: 381-387, 657].
* [cite_start]**Medical & Dental Records:** Storage for history, treatment plans, and dental records.
* [cite_start]**Health Campaigns:** Content management for banners/PubMats and dynamic web pages.
* [cite_start]**Patient Feedback:** Digital evaluation forms and analysis tools.
* [cite_start]**Notifications:** Automated alerts (email/in-app) for campaigns and updates.
* [cite_start]**Report Generation:** Module to export data to PDF and Excel.
* [cite_start]**Medical Certificates:** Template-based issuance system.
* [cite_start]**Document Uploads:** Handling for uploaded files (e.g., X-rays).

### **4. Critical Libraries & Dependencies**
Your environment must support these specific tools mentioned in the implementation plan:
* [cite_start]**API:** `Django Rest Framework (DRF)` (for Frontend-Backend integration)[cite: 353].
* [cite_start]**Async Tasks:** `Celery` (for automated reminders/notifications)[cite: 359, 367].
* [cite_start]**Data Visualization:** `Chart.js` (for feedback analysis)[cite: 360].
* [cite_start]**PDF Generation:** `ReportLab`[cite: 363].
* [cite_start]**Excel Export:** `Pandas`[cite: 363].
* [cite_start]**Security:** `pgcrypto` (PostgreSQL extension for encryption)[cite: 377].

### **5. Future/Optional Features (Do NOT Flag as Missing)**
* [cite_start]**Appointment Scheduling:** Marked as "Future Iterations" in Appendix G.
* [cite_start]**Medication Tracking:** Marked as "Future Iterations" in Appendix G.
* [cite_start]**Inventory Management:** Marked as "Future Iterations" in Appendix G.

### **6. Development Artifacts**
* [cite_start]**Testing:** A `tests/` directory or test files covering Unit, Integration, and Performance testing [cite: 475-477].
* [cite_start]**Documentation:** `docs/` folder or root files corresponding to "D3 Technical Documentation" and "User Manuals"[cite: 549].
* [cite_start]**Pilot Data:** Seed data or fixtures representing "1st year Students from Tourism Management" for the pilot test[cite: 483].

---

### **7. Verified Missing Requirements (Gap Analysis)**
*Date: January 26, 2026*

**Critical Libraries & Dependencies**
*   **Celery:** Missing. Required for automated reminders & async notifications [cite: 359, 367].
*   **Pandas:** Missing. Required for Excel export logic [cite: 363].

**Functional Modules & Architecture**
*   **Health Campaigns App:** Functionality exists but is nested within `health_info` app. Requirement calls for a distinct module.
*   **Frontend-Backend Separation:** Primary React app is nested in `backend/frontend/frontend/`, while the root `frontend/` is incomplete.

**Development Artifacts**
*   **Pilot Test Fixtures:** Missing. No JSON fixtures found for "1st year Students from Tourism Management" [cite: 483].

**Security Configuration**
*   **Pgcrypto Support:** `PGP_ENCRYPTION_KEY` is present in settings, but explicit migrations enabling the extension for sensitive columns need verification.
