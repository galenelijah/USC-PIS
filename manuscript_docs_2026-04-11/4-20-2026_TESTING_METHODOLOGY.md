# Testing Methodology & Validation Strategy: USC-PIS
**Date:** April 20, 2026
**Revision:** 2.3.0 (Post-Audit Comprehensive Update)

---

## 1. Overview of Testing Strategy
The USC-PIS validation followed a **V-Model testing approach**, ensuring that every functional requirement mapped to a corresponding verification phase. The strategy combined automated unit testing, end-to-end integration workflows, and security-first auditing.

---

## 2. Levels of Testing

### 2.1 Unit Testing (Component Isolation)
*   **Methodology:** Utilized `django.test.TestCase` for backend isolation and Jest/React Testing Library for frontend components.
*   **Key Focus:** 
    *   **Heuristic Logic:** Testing the regex-based student/staff email detection.
    *   **Calculations:** Verifying BMI and clinical data integrity.
    *   **Security Logic:** Validating `pgcrypto` encryption/decryption signals.

### 2.2 Integration Testing (Workflow Validation)
*   **Methodology:** End-to-end simulation of user journeys using `APIClient`.
*   **Key Focus:**
    *   **The Post-Verification Role Journey:** Verifying that text-based email users are correctly redirected to `/role-selection` and can successfully update their professional role.
    *   **The Certificate Lifecycle:** Testing the hand-off from Staff (drafting) to Doctor (assessing fitness) to PDF generation.

### 2.3 System & Performance Testing
*   **Methodology:** Benchmarking API response times and report generation speed under concurrent loads.
*   **Key Focus:** Ensuring < 500ms latency for clinical record retrieval and real-time dashboard updates.

### 2.4 Security & RBAC Audit (Vulnerability Mapping)
*   **Methodology:** Attempting "Privilege Escalation" by using student credentials to access admin endpoints (e.g., `/api/auth/admin/`, `/api/utils/backup/`).
*   **Outcome:** All unauthorized attempts were blocked by the DRF permission layer with 403 Forbidden responses.

---

## 3. Testing Environment & Tools

| Component | Technical Specification |
| :--- | :--- |
| **Language** | Python 3.12.3 / JavaScript (ES6+) |
| **Backend Testing** | Django Test Runner, Factory Boy |
| **Frontend Testing** | Vitest (Vite-optimized testing) |
| **Database** | PostgreSQL 16 with pgcrypto extension |
| **CI/CD Sim** | Local testing in `venv_custom` (Linux environment) |

---

## 4. Continuous Improvement (April 2026 Audit)
The recent audit on April 20, 2026, specifically addressed edge cases in user onboarding:
1.  **Issue identified:** Text-based emails were defaulting to `STAFF` and skipping role selection.
2.  **Logic Fix:** Updated `UserRegistrationSerializer` to default all text-based emails to `STUDENT` and trigger the frontend `/role-selection` redirect.
3.  **Permission Fix:** Updated `update_user_role` to allow secure self-updates for the `STUDENT` role.
4.  **Verification:** Automated tests confirmed that users can no longer self-assign the `ADMIN` role and that role updates are immutable once set.

---

## 5. Compliance & Documentation
*   **IEEE 829:** Standard for Software Test Documentation.
*   **Data Privacy Act of 2012:** Compliance verified via field-level encryption and RBAC.
*   **USC-HSD Standards:** Document accuracy verified against official **ACA-HSD-04F** medical certificates.
