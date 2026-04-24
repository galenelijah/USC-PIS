import time
import requests
import statistics
import threading

# Configuration - Update these with actual Heroku URL and valid Tokens before running
BASE_URL = "https://usc-pis-5f030223f7a8.herokuapp.com" # Change to Heroku URL
ADMIN_TOKEN = "YOUR_ADMIN_TOKEN"
STUDENT_TOKEN = "YOUR_STUDENT_TOKEN"

def test_report_generation_latency():
    """PT-01: Measure response time for generating Patient Visit Summary Reports."""
    url = f"{BASE_URL}/api/reports/generate/"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}", "Content-Type": "application/json"}
    payload = {"report_type": "MEDICAL", "format": "PDF", "date_range": "30_DAYS"}

    print("Starting PT-01: Report Generation Latency...")
    times = []
    
    # We do 10 requests to avoid spamming the server too much, but enough for average
    for i in range(10):
        start = time.time()
        try:
            res = requests.post(url, json=payload, headers=headers)
            if res.status_code in [200, 201]:
                times.append((time.time() - start) * 1000)
            else:
                print(f"Request {i} failed: {res.status_code}")
        except Exception as e:
            pass

    if times:
        print(f"[PT-01 Result] Average PDF Generation Time: {statistics.mean(times):.2f} ms")
        print(f"[PT-01 Result] Max Latency: {max(times):.2f} ms")
    else:
        print("[PT-01 SKIPPED] Ensure server is running and ADMIN_TOKEN is valid.")

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
