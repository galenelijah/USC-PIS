# Requirement Traceability Matrix (RTM)
**Project:** USC-DC Patient Information System (USC-PIS)
**Reference Manuscript:** GroupL_WorkingManuscriptv2.2.2.pdf

| Test ID | Requirement Description | Manuscript Page / Section | Status |
| :--- | :--- | :--- | :--- |
| **UT-01** | PostgreSQL pgcrypto Column-Level Encryption | Appendix G (Security) / Section 4.5 | VERIFIED |
| **UT-02** | Academic Year Level Logic & Filtering | Section I.D (Obj. 3) / App. G | VERIFIED |
| **UT-03** | @usc.edu.ph Domain Enforcement & MFA Expiration | Section 3.2 (Auth) | VERIFIED |
| **UT-04** | Medical/Dental Field Regex Constraints | Appendix G (Integrity) | VERIFIED |
| **UT-05** | Safe List Onboarding & Admin Bypass | **Application Retooling** | VERIFIED |
| **UT-06** | Document Upload Security (Integrity Audit) | **Cybersecurity Audit** | VERIFIED |
| **IT-01** | End-to-End Clinical Pipeline (ACA-HSD-04F) | Section 4.2 (Operations) | VERIFIED |
| **IT-02** | Real-time Feedback Analytics Dashboard | Section I.D (Obj. 5) | VERIFIED |
| **IT-03** | Role-Based Access Control (RBAC) Stress Test | Section 3.5 (Security) | VERIFIED |
| **IT-04** | Real-time Academic Year Sorting/Filtering | **Retooling (D6)** | VERIFIED |
| **IT-05** | Health Campaign Dissemination (Admin to Student) | Objective 2 (Awareness) | VERIFIED |
| **PT-01** | Report Generation Latency (<1000ms) | Section 4.6 (Performance) | VERIFIED |
| **PT-02** | System Concurrency (20+ Users) | Section 4.6 (Performance) | VERIFIED |
| **PT-03** | Encryption Computational Overhead Audit | Section 4.5 (Security) | VERIFIED |
| **PT-04** | Patient Search Latency (<500ms) | **Chapter 1 (Efficiency)** | VERIFIED |

---

# Chapter 4: System Testing and Results

### Table 4.1: Unit Testing Results (Security & Logic)
| Test ID | Requirement | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UT-01** | pgcrypto SQL Audit | Binary storage for Name/Diagnosis | Binary (bytea) hashes detected | PASS |
| **UT-02** | Year-Level Logic | Filter 1st-4th Year accurately | 100% Accuracy in filtering | PASS |
| **UT-03** | MFA Expiration | Expired codes return invalid | is_expired() logic triggered | PASS |
| **UT-04** | Field Constraints | Regex validation for Dental FDI | "11,12" accepted; "1,2" blocked | PASS |
| **UT-05** | Safe List Onboarding| Automatic Role Assignment | Assigned: DOCTOR/NURSE | PASS |
| **UT-06** | File Security | Reject .EXE, .JS, .PY | 100% Rejection rate | PASS |

### Table 4.2: Integration Testing Results (Workflow)
| Test ID | Requirement | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **IT-01** | Clinical Pipeline | Nurse -> Doctor -> PDF Flow | Flow Completed (200 OK) | PASS |
| **IT-02** | Feedback Analytics| Persistence of Survey Data | Record created in database | PASS |
| **IT-03** | RBAC Security | Cross-patient access restricted | 404 (Hidden) / 403 (Denied) | PASS |
| **IT-04** | Year-Level Sort | Filter specific records via API | 1/1 Match (4th Year) | PASS |
| **IT-05** | Campaign Flow | Student sees Admin alert | Visible in Dashboard Feed | PASS |

### Table 4.3: Performance Benchmarking Results
| Test ID | Requirement | Target Metric | Measured Metric | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PT-01** | Report Latency | < 1000ms | 124.53ms | PASS |
| **PT-02** | Concurrency | 20 Concurrent Req | 20/20 Success (0% Drop) | PASS |
| **PT-03** | Encryption Lag | < 50ms overhead | < 1ms (Standard) | PASS |
| **PT-04** | Search Efficiency | < 500ms (100 Recs) | 123.16ms | PASS |
