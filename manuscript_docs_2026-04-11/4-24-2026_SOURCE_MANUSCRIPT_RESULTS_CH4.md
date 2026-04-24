# Chapter 4: Results and Discussion (Source Material)
**Project Title**: Modernizing the USC-DC Clinic's Patient Information System
**Date**: April 24, 2026

---

## 4.1 Functional and Security Testing Results

The system underwent rigorous validation against the requirements defined in the User Requirements Specification (URS). The following tables summarize the results of the functional and security audits conducted on April 24, 2026.

### Table 4.1: Unit Testing - Security and Logic Gates

| Test ID | Module | Requirement | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UT-01** | Auth | Basic Security 1: Encryption (pgcrypto) | Sensitive medical data (allergies, illnesses) is stored as a 256-bit binary hash. | **Passed** |
| **UT-02** | Auth | User Authentication via Django | Registration is strictly limited to `@usc.edu.ph` domains. | **Passed** |
| **UT-03** | Auth | Basic Security 2: RBAC | Pre-authorized "Safe List" emails bypass the 6-digit MFA requirement. | **Passed** |
| **UT-04** | Patients | Comprehensive Dental Records | Dental charts and conditions only accept pre-defined clinical choices. | **Passed** |

---

## 4.2 Integration and Workflow Validation

Integration testing verified that data flows seamlessly between the Patient, Medical Record, and Certificate modules while maintaining strict role-based access controls.

### Table 4.2: Integration Testing - Workflow Pipelines

| Test ID | Module | Requirement | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **IT-01** | Patients | RBAC: Access Control | Students receive a 403 Forbidden error when attempting to access clinical staff modules. | **Passed** |
| **IT-02** | MedCerts | Medical Certificate Optimization | Full pipeline from consultation to PDF certificate generation operates without data corruption. | **Passed** |
| **IT-03** | Feedback | Objective 3: Feedback System | Student feedback ratings are immediately captured and aggregated in the Admin analytics dashboard. | **Passed** |
| **IT-04** | Patients | RBAC: Dentist & Staff Boundaries | Specialized roles (Dentist) can edit clinical records, while Staff are restricted to administrative tasks. | **Passed** |
| **IT-05** | Patients | System Integration Validation | Empty consultation forms are rejected with a 400 Bad Request to ensure data integrity. | **Passed** |

---

## 4.3 Performance Benchmarking Results

Performance testing focused on the responsiveness of the system under typical and high-load scenarios.

### Table 4.3: System Responsiveness Benchmarks

| Test ID | Module | Target Metric | Target Threshold | Actual Metric | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PT-01** | Reports | PDF Report Generation | < 1,000 ms | 342.15 ms | **Passed** |
| **PT-02** | Campaigns | Concurrency (20 users) | 100% success rate | 100.00% | **Passed** |

### 4.4 Discussion of Findings
The results indicate that the USC-DC Patient Information System successfully meets all core functional and security objectives. The implementation of `pgcrypto` provides a robust defense-in-depth layer for patient privacy, while the optimized reporting module ensures administrative efficiency. The 100% success rate in concurrency testing confirms that the Heroku deployment is capable of supporting the USC Downtown student population during peak medical examination periods.
