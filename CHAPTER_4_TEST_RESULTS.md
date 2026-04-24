# Requirement Traceability Matrix (RTM)
**Project:** USC-DC Patient Information System (USC-PIS)
**Reference Manuscript:** GroupL_WorkingManuscriptv2.2.2.pdf

| Test ID | Requirement Description | Manuscript Page / Section | Status |
|---------|-------------------------|---------------------------|--------|
| UT-01 | PostgreSQL pgcrypto Column-Level Encryption | Appendix G (Security) / Section 4.5 | Implemented |
| UT-02 | Academic Year Level Logic & Filtering | Section I.D (Obj. 3) / App. G | Implemented |
| UT-03 | @usc.edu.ph Domain Enforcement & MFA Expiration | Section 3.2 (Auth) | Implemented |
| UT-04 | Medical/Dental Field Regex Constraints | Appendix G (Integrity) | Implemented |
| IT-01 | End-to-End Clinical Pipeline (ACA-HSD-04F) | Section 4.2 (Operations) | Implemented |
| IT-02 | Real-time Feedback Analytics Dashboard | Section I.D (Obj. 5) | Implemented |
| IT-03 | Role-Based Access Control (RBAC) Stress Test | Section 3.5 (Security) | Implemented |
| PT-01 | Report Generation Latency (<1000ms) | Section 4.6 (Performance) | Verified |
| PT-02 | System Concurrency (20+ Users) | Section 4.6 (Performance) | Verified |
| PT-03 | Encryption Computational Overhead Audit | Section 4.5 (Security) | Verified |

---

# Chapter 4: System Testing and Results

### Table 4.1: Unit Testing Results (Security & Logic)
| Test ID | Requirement | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| UT-01 | pgcrypto SQL Audit | diagnosis_enc stores binary hash | Hex: 0x504750... (Encrypted) | PASS |
| UT-02 | Year-Level Logic | Filter 1st-4th Year accurately | Correct count per year level | PASS |
| UT-03 | MFA Expiration | Expired codes return invalid | 400 Bad Request on expired | PASS |
| UT-04 | Field Constraints | Dental: "11,12" passes; "1,2" fails | Regex validation success | PASS |

### Table 4.2: Integration Testing Results (Workflow)
| Test ID | Requirement | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| IT-01 | Clinical Pipeline | Nurse -> Doctor -> Staff Flow | PDF Generated with Diagnosis | PASS |
| IT-02 | Feedback Analytics| Real-time Dashboard Update | Avg Rating updated in <50ms | PASS |
| IT-03 | RBAC Security | Student access to /doctor fails | 403 Forbidden | PASS |

### Table 4.3: Performance Benchmarking Results
| Test ID | Requirement | Target Metric | Measured Metric | Status |
|---------|-------------|---------------|-----------------|--------|
| PT-01 | Report Latency | < 1000ms | 452ms | PASS |
| PT-02 | Concurrency | 20 Concurrent Req | 100% Success / 0% Drop | PASS |
| PT-03 | Encryption Lag | < 50ms overhead | +12.4ms per save | PASS |
