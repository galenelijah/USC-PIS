# Requirement Traceability Matrix (RTM)
**Project:** USC-DC Patient Information System (USC-PIS)
**Reference Manuscript:** GroupL_WorkingManuscriptv2.2.2.pdf

| Test ID | Requirement Description | Manuscript Page / Section | Status |
|---------|-------------------------|---------------------------|--------|
| UT-01 | PostgreSQL pgcrypto Column-Level Encryption | Appendix G (Security) / Section 4.5 | VERIFIED |
| UT-02 | Academic Year Level Logic & Filtering | Section I.D (Obj. 3) / App. G | VERIFIED |
| UT-03 | @usc.edu.ph Domain Enforcement & MFA Expiration | Section 3.2 (Auth) | VERIFIED |
| UT-04 | Medical/Dental Field Regex Constraints | Appendix G (Integrity) | VERIFIED |
| IT-01 | End-to-End Clinical Pipeline (ACA-HSD-04F) | Section 4.2 (Operations) | VERIFIED |
| IT-02 | Real-time Feedback Analytics Dashboard | Section I.D (Obj. 5) | VERIFIED |
| IT-03 | Role-Based Access Control (RBAC) Stress Test | Section 3.5 (Security) | VERIFIED |
| PT-01 | Report Generation Latency (<1000ms) | Section 4.6 (Performance) | VERIFIED |
| PT-02 | System Concurrency (20+ Users) | Section 4.6 (Performance) | VERIFIED |
| PT-03 | Encryption Computational Overhead Audit | Section 4.5 (Security) | VERIFIED |

---

# Chapter 4: System Testing and Results

### Table 4.1: Unit Testing Results (Security & Logic)
| Test ID | Requirement | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| UT-01 | pgcrypto SQL Audit | Binary storage for Name/Diagnosis | Binary (bytea) hashes detected | PASS |
| UT-02 | Year-Level Logic | Filter 1st-4th Year accurately | 100% Accuracy in filtering | PASS |
| UT-03 | MFA Expiration | Expired codes return invalid | is_expired() logic triggered | PASS |
| UT-04 | Field Constraints | Regex validation for Dental FDI | "11,12" accepted; "1,2" blocked | PASS |

### Table 4.2: Integration Testing Results (Workflow)
| Test ID | Requirement | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| IT-01 | Clinical Pipeline | Nurse -> Doctor -> PDF Flow | PDF Generated with Diagnosis | PASS |
| IT-02 | Feedback Analytics| Persistence of Survey Data | Record created in feedback_feedback | PASS |
| IT-03 | RBAC Security | Cross-patient access restricted | 404 (Hidden) / 403 (Denied) | PASS |

### Table 4.3: Performance Benchmarking Results
| Test ID | Requirement | Target Metric | Measured Metric | Status |
|---------|-------------|---------------|-----------------|--------|
| PT-01 | Report Latency | < 1000ms | ~117.9ms | PASS |
| PT-02 | Concurrency | 20 Concurrent Req | 20/20 Success (0% Drop) | PASS |
| PT-03 | Encryption Lag | < 50ms overhead | +0.48ms per save | PASS |
