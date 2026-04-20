# Testing Methodology & Validation Strategy: USC-PIS
**Date:** April 11, 2026
**Document Version:** 1.0 (Final Audit)

---

## 1. Overview of Testing Strategy
The USC-PIS validation followed a **V-Model testing approach**, ensuring that every functional requirement mapped to a corresponding verification phase. The strategy combined automated unit testing, end-to-end integration workflows, and security-first auditing.

---

## 2. Levels of Testing

### 2.1 Unit Testing (Component Isolation)
*   **Objective:** To verify the logic of individual functions and models in isolation.
*   **Methodology:** Used the `django.test.TestCase` framework to create a transient database for each test run.
*   **Key Focus:** 
    *   **Security Logic:** Verification of `pgcrypto` symmetric encryption triggers.
    *   **Data Validation:** Accuracy of BMI calculations and USC email domain regex.
    *   **Signal Integrity:** Ensuring `post_save` signals (welcome emails, profile generation) do not cause race conditions.

### 2.2 Integration Testing (Workflow Validation)
*   **Objective:** To ensure seamless data flow between the React Frontend and Django REST API.
*   **Methodology:** Used `rest_framework.test.APIClient` to simulate real-world user requests (POST/GET/PATCH) and verify status codes and JSON payloads.
*   **Key Focus:**
    *   **The Registration Journey:** From account creation to 6-digit MFA verification.
    *   **The Certificate Lifecycle:** Staff drafting $\rightarrow$ Doctor Assessment $\rightarrow$ PDF Export.

### 2.3 Performance & Stress Testing
*   **Objective:** To benchmark system responsiveness under university-scale workloads.
*   **Methodology:** Manual profiling using Django's `RequestLoggingMiddleware` to measure "Time to First Byte" (TTFB) and total API duration.
*   **Key Focus:** Smart Search latency and PDF rendering speed.

### 2.4 Security & RBAC Audit
*   **Objective:** To ensure strict adherence to the Data Privacy Act of 2012 and USC-HSD permissions.
*   **Methodology:** "Black-box" permission testing where Student tokens were used to attempt access to Staff-only endpoints (`/api/patients/`, `/api/reports/`).

---

## 3. Testing Environment

| Component | Technical Specification |
| :--- | :--- |
| **Language** | Python 3.12.3 / JavaScript (ES6+) |
| **Framework** | Django 5.1.7 / React 18 |
| **Database** | PostgreSQL 16 (Production) / SQLite (Test Isolation) |
| **Runner** | Django Test Runner (Manage.py test) |
| **Infrastructure** | Heroku Standard-1X Dynos |

---

## 4. Quality Assurance Fix-Loop
During the audit on April 11, 2026, an iterative **"Test-Identify-Patch"** loop was employed:
1.  **Detection:** Identifying `NoneType` errors in signals during rapid registration.
2.  **Resolution:** Implementing null-safety guards in `services.py`.
3.  **Verification:** Re-running the 46-case suite to ensure 100% regression-free status.

---

## 5. Compliance Standards
*   **IEEE 829:** Standard for Software Test Documentation.
*   **HIPAA-Lite:** Adapted security standards for university-level PHI (Patient Health Information).
*   **USC-HSD Template Compliance:** Exact mapping of data fields to the **ACA-HSD-04F** Landscape Form.
