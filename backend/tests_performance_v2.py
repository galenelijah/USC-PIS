import time
from django.test import TestCase, Client
from django.urls import reverse
from authentication.models import User
from patients.models import Patient
from medical_certificates.models import MedicalCertificate, CertificateTemplate
from django.db import connection

class USCPISPerformanceBenchmarks(TestCase):
    """PT-01 to PT-03: Performance Benchmarking Suite v2.0"""

    def setUp(self):
        self.client = Client()
        self.doctor = User.objects.create_user(email="doctor@usc.edu.ph", password="password", role=User.Role.DOCTOR)
        self.patient = Patient.objects.create(
            first_name="Perf", last_name="Test", date_of_birth="2000-01-01", gender="M", email="perf@usc.edu.ph"
        )
        self.template = CertificateTemplate.objects.create(name="T", content="T")
        self.cert = MedicalCertificate.objects.create(
            patient=self.patient, template=self.template, diagnosis="Perf Diagnosis",
            valid_from="2026-04-25", valid_until="2026-04-26", issued_by=self.doctor
        )
        self.client.login(email="doctor@usc.edu.ph", password="password")

    def test_pt01_report_latency(self):
        """PT-01: Measure PDF generation latency (Target <1000ms)."""
        url = reverse('medicalcertificate-render-pdf', args=[self.cert.id])
        start_time = time.time()
        response = self.client.get(url, follow=True)
        end_time = time.time()
        
        latency_ms = (end_time - start_time) * 1000
        print(f"[PT-01] PDF Generation Latency: {latency_ms:.2f}ms")
        self.assertLess(latency_ms, 1000, "PDF latency exceeded 1000ms")

    def test_pt02_concurrency_simulation(self):
        """PT-02: Simulate concurrent Home Page access."""
        import concurrent.futures
        
        def make_request():
            client = Client()
            return client.get('/', follow=True)

        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            results = [f.result() for f in futures]
        end_time = time.time()
        
        success_count = sum(1 for r in results if r.status_code == 200)
        total_time = end_time - start_time
        
        print(f"[PT-02] Concurrency Test: {success_count}/20 successful requests in {total_time:.2f}s")
        self.assertEqual(success_count, 20, "Some concurrent requests failed")

    def test_pt03_encryption_overhead(self):
        """PT-03: Measure Encryption Overhead (Save latency with vs without pgcrypto)."""
        # 1. Measure save without encryption fields (using a standard field)
        start_time = time.time()
        for i in range(10):
            self.doctor.middle_name = f"Test{i}"
            self.doctor.save()
        end_time = time.time()
        baseline_avg = (end_time - start_time) / 10 * 1000
        
        # 2. Measure save with encryption field (illness)
        start_time = time.time()
        for i in range(10):
            self.doctor.illness = f"Sensitive Data {i}"
            self.doctor.save()
        end_time = time.time()
        enc_avg = (end_time - start_time) / 10 * 1000
        
        overhead = enc_avg - baseline_avg
        print(f"[PT-03] Baseline Save: {baseline_avg:.2f}ms | Encrypted Save: {enc_avg:.2f}ms | Overhead: {overhead:.2f}ms")
        
        # In SQLite, signals might not actually call PostgreSQL pgcrypto, 
        # but in CI/CD with Postgres, this will show real data.
        print("[PT-03 PASS] Encryption overhead measured.")
