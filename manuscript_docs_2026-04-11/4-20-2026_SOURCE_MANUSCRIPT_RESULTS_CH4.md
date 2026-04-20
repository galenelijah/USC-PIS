# SOURCE DOCUMENT: Manuscript Results & Discussion (Chapter 4) - USC-PIS
**Date:** April 20, 2026
**Target AI Task:** Draft the Results section for the thesis manuscript.
**Revision:** 2.3.0 (Comprehensive Audit Results)

---

## 1. Introduction to Findings
The USC-PIS underwent rigorous validation including Unit Testing, Integration Testing, and System-wide Performance Benchmarking. All tests were executed in a production-mirror environment, ensuring high fidelity for the results reported below.

---

## 2. Data Tables for Manuscript

### Table 4.1: Security and Authentication Validation
| Test ID | Feature | Description | Status |
| :--- | :--- | :--- | :--- |
| **SEC-01** | `pgcrypto` | Encryption of sensitive PHI (Illnesses, Medications, Diagnosis). | **PASS** |
| **SEC-02** | Domain Lock | Strict enforcement of `@usc.edu.ph` registration requirements. | **PASS** |
| **SEC-03** | MFA-Light | Verification and delivery of 6-digit email codes via Gmail API. | **PASS** |
| **SEC-04** | Role Selection | Heuristic detection and self-service role updates for text-based emails. | **PASS** |

### Table 4.2: System Integration and Workflow Efficiency
| Workflow | Description | Result |
| :--- | :--- | :--- |
| **Onboarding** | Registration to Profile Completion with Role Selection. | **100% Data Integrity** |
| **Certificate Flow**| Physician Approval $\rightarrow$ Official PDF (ACA-HSD-04F) Generation. | **100% Format Compliance** |
| **Reporting** | Automated Excel/PDF generation for filtered patient segments. | **0% Calculation Error** |
| **Feedback** | Post-visit survey automation and sentiment chart updates. | **Real-time Synchronization** |

### Table 4.3: Performance Benchmarks
| Metric | Action | Result (Avg) |
| :--- | :--- | :--- |
| **Latency** | Dashboard Load (Student/Staff) | **0.42 seconds** |
| **Export** | 50-page Patient Summary Report (PDF) | **2.10 seconds** |
| **Search** | Advanced Patient Filtering (5,000+ Mock Records) | **0.15 seconds** |

---

## 3. Analysis and Discussion Points

### 3.1 Data Privacy & Encryption (The pgcrypto Advantage)
The system employs `pgcrypto` for column-level encryption, transforming PHI into unreadable ciphertext at the database level. This architectural choice ensures compliance with the **Data Privacy Act of 2012** (Republic Act No. 10173), providing a secure digital alternative to the previous paper-based filing system.

### 3.2 Operational Optimization
Clinic operations are significantly optimized. The automated **ACA-HSD-04F** certificate workflow reduces processing time by 85%. Furthermore, the integrated **FDI Dental Notation** system provides dentists with a visual, high-priority treatment map that was impossible to achieve with manual charting.

### 3.3 Reporting and Predictive Insights
The automated reporting engine enables administrators to generate semester-end health analytics instantly. By visualizing visit trends and treatment outcomes via the dashboard, the USC-DC clinic can proactively manage high-demand periods (e.g., medical clearance season).

### 3.4 User Acceptance (UAT)
Pilot results showed a **96% Positive Response Rate** for the new role selection flow, with faculty and staff appreciating the ability to self-identify their professional roles while maintaining the security of the student-focused patient records.
