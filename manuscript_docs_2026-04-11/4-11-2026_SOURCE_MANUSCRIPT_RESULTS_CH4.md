# SOURCE DOCUMENT: Manuscript Results & Discussion (Chapter 4) - USC-PIS
**Date:** April 11, 2026
**Target AI Task:** Draft the Results section for the thesis manuscript.

---

## 1. Introduction to Findings
The USC-PIS was subjected to a three-stage validation process: Unit Testing, Integration Testing, and Performance Benchmarking. All tests were conducted in a production-mirror environment on Heroku.

---

## 2. Data Tables for Manuscript

### Table 4.1: Security and Authentication Validation (Unit Tests)
| Test ID | Feature | Description | Status |
| :--- | :--- | :--- | :--- |
| **SEC-01** | `pgcrypto` | Encryption of patient illnesses and medications in PostgreSQL. | **PASS** |
| **SEC-02** | Domain Lock | Rejection of non-@usc.edu.ph email domains. | **PASS** |
| **SEC-03** | MFA-Light | Delivery and validation of 6-digit email codes. | **PASS** |
| **SEC-04** | RBAC | Denial of administrative access to student accounts. | **PASS** |

### Table 4.2: System Integration and Workflow (End-to-End)
| Workflow | Description | Result |
| :--- | :--- | :--- |
| **Onboarding** | Registration to Profile Setup (Fig. 3) | **100% Data Persistence** |
| **Cert. Flow** | Request $\rightarrow$ Doctor Approval $\rightarrow$ PDF Export | **ACA-HSD-04F Compliant** |
| **Reporting** | Filtered Data $\rightarrow$ Excel/PDF Generation | **Accurate Aggregation** |

### Table 4.3: Performance Benchmarks (Responsiveness)
| Metric | Action | Result (Avg) |
| :--- | :--- | :--- |
| **Latency** | Student Dashboard Load | **0.48 seconds** |
| **Throughput** | Simultaneous Logins (50 Users) | **No degraded service** |
| **Export** | PDF Medical Certificate Generation | **1.25 seconds** |

---

## 3. Analysis and Discussion Points

### 3.1 The Impact of pgcrypto
The implementation of column-level encryption represents a significant advancement over the previous paper-based system. By utilizing the PostgreSQL `pgcrypto` extension, the USC-PIS ensures that even in the event of a database breach, patient-specific medical histories remain unreadable (ciphertext), thus satisfying the Data Privacy Act of 2012.

### 3.2 Efficiency in Clinic Operations
Validation results show that the average time to retrieve a patient's medical history was reduced from approximately 5-10 minutes (manual file search) to under 1 second. The automated **ACA-HSD-04F** certificate generation ensures that physicians can focus on clinical assessment rather than clerical documentation.

### 3.3 Discussion of Pilot Results (UAT)
User Acceptance Testing (UAT) yielded a **94% Overall Satisfaction Score**. Staff specifically highlighted the "Smart Search" and "Visual Dental Mapping" as critical improvements to their daily clinic workflow.
