# Final Test Execution Logs: USC-PIS
**Date:** April 25, 2026
**Environment:** GitHub Actions CI/CD Pipeline (Ubuntu-latest)
**Database:** PostgreSQL 15 (Service Container)

---

## 1. Advanced Unit Testing (tests_unit_v2.py)
**Status:** ✅ PASS (4/4 Tests)
**Execution Time:** 2.656s

| Test ID | Requirement | Result | Evidence |
|---------|-------------|--------|----------|
| UT-01 | pgcrypto SQL Audit | PASS | raw SQL verified `bytea` binary hashes in `diagnosis_enc` |
| UT-02 | Year-Level Logic | PASS | Correctly filtered 1st-4th Year Student QuerySets |
| UT-03 | MFA Expiration | PASS | `is_expired()` correctly returned `True` for +10min codes |
| UT-04 | FDI Field Regex | PASS | "11,12" accepted; invalid notation blocked via `full_clean()` |

---

## 2. Integration Testing (tests_integration_v2.py)
**Status:** ✅ PASS (3/3 Tests)
**Execution Time:** 5.480s

| Test ID | Requirement | Result | Evidence |
|---------|-------------|--------|----------|
| IT-01 | Clinical Pipeline | PASS | Nurse -> Doctor -> PDF Generation successful (HTTP 200) |
| IT-02 | Feedback Flow | PASS | Feedback record persisted in database after visit |
| IT-03 | RBAC Security | PASS | 100% rejection rate for Students accessing Doctor paths |

---

## 3. Performance Benchmarking (tests_performance_v2.py)
**Status:** ✅ PASS (3/3 Tests)
**Execution Time:** 2.614s

| Test ID | Metric | Target | Actual | Status |
|---------|--------|--------|--------|--------|
| PT-01 | PDF Latency | < 1000ms | 117.94ms | ✅ PASS |
| PT-02 | Concurrency | 20 Req | 20/20 Success | ✅ PASS |
| PT-03 | Enc. Overhead| < 50ms | +0.48ms | ✅ PASS |

---

## 4. CI/CD Deployment Log
1.  **Code Check:** Static analysis and syntax check completed.
2.  **Schema Sync:** `python manage.py migrate` applied 2 new migrations (pgcrypto fields).
3.  **Audit Execution:** 10/10 functional and security tests passed in GitHub Actions.
4.  **Production Push:** Native Git deployment to `usc-pis` Heroku app successful.
5.  **Release:** Release command executed; production database synchronized.
