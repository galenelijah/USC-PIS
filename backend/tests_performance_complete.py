import time
import requests
import statistics
import threading

# Configuration - Automatic Discovery
# Try to detect if we are running locally or against Heroku
import os

BASE_URL = "http://localhost:8000"
# If you want to run against Heroku, uncomment the line below:
# BASE_URL = "https://your-usc-pis-app.herokuapp.com" 

ADMIN_TOKEN = "YOUR_ADMIN_TOKEN" # Required for PT-01
STUDENT_TOKEN = "YOUR_STUDENT_TOKEN" # Optional for PT-02 (allows public)

def test_report_generation_latency():
    """PT-01: Measure response time for report-related endpoints."""
    # We use the templates list endpoint as it's a stable, staff-only endpoint
    # that measures both database query speed and auth overhead.
    url = f"{BASE_URL}/api/reports/templates/"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}", "Content-Type": "application/json"}

    print("Starting PT-01: Report Module Latency...")
    times = []

    for i in range(10):
        start = time.time()
        try:
            res = requests.get(url, headers=headers)
            if res.status_code == 200:
                times.append((time.time() - start) * 1000)
            elif res.status_code == 401:
                print(f"Request {i} failed: 401 Unauthorized (Update your ADMIN_TOKEN!)")
                break
            else:
                print(f"Request {i} failed: {res.status_code}")
        except Exception as e:
            print(f"Error during request: {e}")

    if times:
        print(f"[PT-01 Result] Average Report Module Latency: {statistics.mean(times):.2f} ms")
        print(f"[PT-01 Result] Max Latency: {max(times):.2f} ms")
    else:
        print("[PT-01 SKIPPED] Ensure server is running and ADMIN_TOKEN is valid in the script.")


def simulate_concurrent_user(user_id, results_list):
    """Worker function for concurrency testing."""
    url = f"{BASE_URL}/api/health-info/campaigns/"
    headers = {"Authorization": f"Bearer {STUDENT_TOKEN}"}
    
    start = time.time()
    try:
        res = requests.get(url, headers=headers)
        duration = (time.time() - start) * 1000
        results_list.append({'status': res.status_code, 'time': duration})
    except:
        results_list.append({'status': 500, 'time': 0})

def test_concurrency_stress():
    """PT-02: Simulate 20 concurrent users fetching Health Campaigns."""
    print("\nStarting PT-02: Concurrency Stress Test (20 users)...")
    threads = []
    results = []
    
    for i in range(20):
        t = threading.Thread(target=simulate_concurrent_user, args=(i, results))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    success_count = sum(1 for r in results if r['status'] == 200)
    avg_time = statistics.mean([r['time'] for r in results if r['status'] == 200]) if success_count > 0 else 0
    
    print(f"[PT-02 Result] Successful Requests: {success_count}/20")
    print(f"[PT-02 Result] Average Response Time under load: {avg_time:.2f} ms")

if __name__ == "__main__":
    test_report_generation_latency()
    test_concurrency_stress()
