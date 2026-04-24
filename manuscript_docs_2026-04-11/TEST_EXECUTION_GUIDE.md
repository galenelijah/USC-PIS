# USC-PIS Test Execution Guide
**Version:** 1.0.0 (Defense Readiness)
**Last Updated:** April 24, 2026

This guide provides step-by-step instructions for executing the full-spectrum validation suite required for the USC-DC Patient Information System defense and manuscript.

---

## 1. Prerequisites

Ensure you have the following installed on your host machine:
- **Python 3.10+** (Required for the backend)
- **PostgreSQL** (Running locally, or access to the Heroku database)
- **Requests Library** (For performance testing): `pip install requests`

---

## 2. Unit & Integration Tests (Logic & Security)
These tests verify pgcrypto encryption, RBAC boundaries, and the Medical Certificate pipeline. They run in an isolated test database.

### **Option A: Using WSL (Recommended)**
```bash
# 1. Navigate to the backend directory
cd /mnt/c/Users/galen/Documents/THESISSSS/USC-PIS/backend

# 2. Setup/Activate environment (if not already done)
python3 -m venv venv_wsl
source venv_wsl/bin/activate
pip install -r requirements.txt

# 3. Run the tests
python manage.py test authentication.tests_unit_complete patients.tests_integration_complete
```

### **Option B: Using Windows PowerShell**
```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Setup/Activate environment
python -m venv venv_win
.\venv_win\Scripts\activate
pip install -r requirements.txt

# 3. Run the tests
python manage.py test authentication.tests_unit_complete patients.tests_integration_complete
```

---

## 3. Performance & Stress Tests (Latency & Load)
These tests measure real-world response times. They should be run against your **live Heroku site** for the most accurate manuscript data.

### **Step 1: Configuration**
1. Open `backend/tests_performance_complete.py`.
2. Locate the `BASE_URL` line. Update it to your Heroku URL:
   ```python
   BASE_URL = "https://your-usc-pis-app.herokuapp.com"
   ```
3. (Optional) Log into the USC-PIS system as an **Admin**, open the browser Developer Tools (F12), go to the **Application/Network** tab, and copy your JWT `token`. Paste it into the `ADMIN_TOKEN` variable in the script.

### **Step 2: Execution**
Run this from your standard terminal:
```bash
python backend/tests_performance_complete.py
```

---

## 4. Mapping Results to Manuscript
After running the tests, navigate to the `manuscript_docs_2026-04-11/` folder. Use the terminal output to update the following files:

1.  **`4-24-2026_UNIT_TEST_LOGS.md`**: Fill in the `Actual Output` based on the console PASS messages.
2.  **`4-24-2026_PERFORMANCE_SECURITY_LOGS.md`**: Update the `ms` (milliseconds) values with the averages provided by the performance script.
3.  **`4-24-2026_SOURCE_MANUSCRIPT_RESULTS_CH4.md`**: This is your final source for copy-pasting tables into your Word/LaTeX thesis document.

---

## 5. Troubleshooting
- **ModuleNotFoundError (Requests):** Run `pip install requests`.
- **401 Unauthorized:** Your `ADMIN_TOKEN` in the performance script has expired. Log in again and get a fresh token from the browser.
- **404 Not Found:** Ensure `BASE_URL` in the performance script includes the protocol (http/https) and does not have a trailing slash.
