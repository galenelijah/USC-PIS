# Patient Information System – Project Requirements

## 📌 Project Title
**Modernizing the USC-DC Clinic's Patient Information System: A Design and Implementation Project**

---

## 🧭 Objective
To develop a modern, web-based Patient Information System (PIS) to address operational inefficiencies at the University of San Carlos (USC) Clinic.

---

## ✅ Core Functional Requirements

- **Medical and Dental Records**
  - Centralized storage of medical history, treatment plans, medications, and dental records
  - Upload and access supporting documents (lab results, x-rays)
  - Role-based data entry and updates

- **Health Information Dissemination**
  - Web pages for campaigns
  - PubMats, banners, and educational content
  - Automated and manual notifications

- **Patient Feedback Collection**
  - Digital evaluation forms
  - Automated reminders
  - Feedback analysis tools and visualizations

- **Report Generation**
  - Custom reports (visit trends, treatment outcomes)
  - Export to PDF and Excel
  - Graphs and charts using Chart.js

- **Medical Certificate Issuance**
  - Template-based issuance
  - Data autofill and verification
  - Admin approval process

- **Notifications**
  - Medication reminders
  - Health alerts and campaign updates
  - Email + in-app notifications with logging

---

## 🔐 Security Requirements

- **Encryption**
  - PostgreSQL `pgcrypto` for column-level encryption

- **Authentication & Authorization**
  - Django-based login system
  - Role-Based Access Control (RBAC)
  - Roles:
    - `Student`
    - `Nurse`
    - `MedicalDoctor`
    - `Dentist`
    - `Staff`

## 🧠 User Roles & Admin Control
- Roles are managed via Django Admin
- Admin can assign/modify permissions per role
- System does not connect to university SSO

---

## ⚙️ Technical Stack

- **Frontend:** React.js
- **Backend:** Django + Django Rest Framework
- **Database:** PostgreSQL
- **Deployment Platform:** Heroku (basic tier)
- **CI/CD:** Simplest config available (manual or GitHub Actions)
- **Visualizations:** Chart.js
- **PDF/Excel Export:** ReportLab, Pandas

---

## 🌐 Non-Functional Requirements

- **Web-Based Platform:** Accessible via browsers (desktop and mobile)
- **Scalability:** Architecture supports future modules
- **Accessibility:** Basic usability; WCAG not prioritized (yet)
- **Performance:** Should handle USC clinic-level load (no benchmark provided)
- **Audit/Logging:** Basic logs for notifications and user actions
- **Backup & Recovery:** Not explicitly required, but to be considered in future iterations

---

## 🛠️ Development Phases (Roadmap Summary)

1. **Planning & Requirements Gathering**
2. **System Analysis & Design**
3. **Environment Setup**
4. **Module Implementation**
5. **Testing & Validation**
6. **Pilot Deployment**
7. **Full Deployment & Maintenance**

---

## 🧪 Testing & Validation Plan

- Unit testing per component/module
- Integration testing across modules
- Performance testing (stress/load)
- User Acceptance Testing (80% of 1st-year BSTM students)
- Feedback-driven iteration loop

## 🧪 Pilot User Group
- Initial test group: 80% of 1st year students (BSTM) and selected clinic staff

---

## 📚 Training & Support

- **Training Materials:** Detailed user manuals
- **Support Contact:** Student dev team (Group L) during deployment and testing phases

---

## 🚫 Limitations

- Basic security only (no 2FA or SSO)
- No existing data to migrate
- No third-party integrations (standalone system)
- Medication tracking and inventory management are deferred to future iterations

- **Explicit Standalone Statement:** System is standalone; not integrated with any other systems

---

## 🚨 Risk Management Summary

- **User Adoption:** Mitigated through involvement, training, and feedback
- **Integration Risks:** Avoided by standalone design
- **Technical Risks:** Minimized via testing, contingency planning, and reliable stack
- **Project Management Risks:** Controlled by clear timeline and milestone tracking

---

## 📅 Deliverables Timeline

| Deliverable | Description | Due Date |
|------------|-------------|----------|
| D1 | Research Manuscript | June 8, 2024 |
| D2 | Software Components | Sept 16, 2024 |
| D3 | Technical Documentation | Sept 23, 2024 |
| D4 | Functional Prototype | Sept 30, 2024 |
| D5 | Testing at Clinic | Oct 7, 2024 |
| D6 | Application Retooling | Oct 21, 2024 |

---

## 🎯 Justification for Student Usage

- Students benefit from access to personal health data
- Can provide feedback directly in-app
- Engage with health awareness campaigns
- Convenience of access via mobile/web anytime