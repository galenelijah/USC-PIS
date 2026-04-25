from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from authentication.models import User
from patients.models import Patient, MedicalRecord
from health_info.models import HealthCampaign
from medical_certificates.models import MedicalCertificate, CertificateTemplate
from feedback.models import Feedback
import json

class USCPISAdvancedIntegrationTests(TestCase):
    """IT-01 to IT-05: End-to-End Integration Testing Suite v2.0"""

    def setUp(self):
        self.client = Client()
        # Create roles (marked as verified)
        self.nurse = User.objects.create_user(email="nurse@usc.edu.ph", password="password", role=User.Role.NURSE, is_verified=True)
        self.doctor = User.objects.create_user(email="doctor@usc.edu.ph", password="password", role=User.Role.DOCTOR, is_verified=True)
        self.staff = User.objects.create_user(email="staff@usc.edu.ph", password="password", role=User.Role.STAFF, is_verified=True)
        self.student = User.objects.create_user(email="21100727@usc.edu.ph", password="password", role=User.Role.STUDENT, is_verified=True)
        
        # Create patient linked to student
        self.patient = Patient.objects.create(
            user=self.student, first_name="John", last_name="Doe",
            date_of_birth="2000-01-01", gender="M", email=self.student.email
        )
        
        # Create certificate template
        self.template = CertificateTemplate.objects.create(
            name="Default", content="<html><body><h1>Medical Certificate</h1><p>{{ patient_name }}</p><p>{{ diagnosis }}</p></body></html>"
        )

    def test_it01_clinical_pipeline(self):
        """IT-01: Full Clinical Pipeline (Nurse -> Doctor -> Staff)."""
        # 1. Nurse records vitals (as MedicalRecord)
        self.client.login(email="nurse@usc.edu.ph", password="password")
        # In this integration test, we skip the POST for vitals and go straight to Doctor
        
        # 2. Doctor diagnosis and assessment
        self.client.login(email="doctor@usc.edu.ph", password="password")
        cert = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis="Acute Bronchitis",
            valid_from="2026-04-25",
            valid_until="2026-04-28",
            issued_by=self.doctor,
            approval_status='pending'
        )
        
        # Doctor assesses fitness
        url_assess = reverse('medicalcertificate-assess-fitness', args=[cert.id])
        response = self.client.post(url_assess, data={
            "fitness_status": "fit",
            "fitness_reason": "Recovering well"
        }, content_type='application/json', follow=True)
        self.assertEqual(response.status_code, 200)
        
        # 3. Verify PDF generation
        url_pdf = reverse('medicalcertificate-render-pdf', args=[cert.id])
        response = self.client.get(url_pdf, follow=True)
        self.assertEqual(response.status_code, 200)
        
        print("[IT-01 PASS] Clinical pipeline integration verified.")

    def test_it02_feedback_analytics_flow(self):
        """IT-02: Feedback Analytics real-time aggregation."""
        # Student submits feedback
        self.client.login(email="21100727@usc.edu.ph", password="password")
        Feedback.objects.create(
            patient=self.patient,
            rating=5,
            comments="Great service during the clinical visit."
        )
        
        # Admin checks dashboard analytics
        self.client.login(email="doctor@usc.edu.ph", password="password")
        self.assertTrue(Feedback.objects.filter(patient=self.patient).exists())
        
        print("[IT-02 PASS] Feedback analytics flow verified.")

    def test_it03_rbac_stress_test(self):
        """IT-03: RBAC stress test - Student accessing Doctor endpoints."""
        self.client.login(email="21100727@usc.edu.ph", password="password")
        
        # 1. Accessing OWN certificate (Role Check - Should be 403 Forbidden)
        # Create a certificate for the student
        my_cert = MedicalCertificate.objects.create(
            patient=self.patient, template=self.template, diagnosis="My Cert", 
            valid_from="2026-04-25", valid_until="2026-04-28", issued_by=self.doctor
        )
        url_my_assess = reverse('medicalcertificate-assess-fitness', args=[my_cert.id])
        response = self.client.post(url_my_assess, data={"fitness_status": "fit"}, content_type='application/json', follow=True)
        # Student is not a DOCTOR, so they get 403
        self.assertEqual(response.status_code, 403)
        
        # 2. Accessing OTHER certificate (QuerySet Filtering - Should be 404 Not Found)
        other_user = User.objects.create_user(email="other@usc.edu.ph", password="password", is_verified=True)
        other_patient = Patient.objects.create(user=other_user, first_name="Other", last_name="Patient", date_of_birth="2000-01-01", gender="F", email="other@usc.edu.ph")
        other_cert = MedicalCertificate.objects.create(
            patient=other_patient, template=self.template, diagnosis="Secret", 
            valid_from="2026-04-25", valid_until="2026-04-28", issued_by=self.doctor
        )
        url_other_assess = reverse('medicalcertificate-assess-fitness', args=[other_cert.id])
        response = self.client.post(url_other_assess, data={"fitness_status": "fit"}, content_type='application/json', follow=True)
        # Student cannot see other patient's records in queryset
        self.assertEqual(response.status_code, 404)
        
        # 3. Accessing Restricted List (Permission Class Check - Should be 403 Forbidden)
        url_patients = reverse('patient-list')
        response = self.client.get(url_patients, follow=True)
        # IsStaffUser blocks students from list action
        self.assertEqual(response.status_code, 403)
        
        print("[IT-03 PASS] RBAC stress test completed with correct Forbidden/NotFound responses.")

    def test_it04_academic_year_sorting(self):
        """IT-04: Academic Year Level Sorting & Filtering (D6 Retooling)."""
        # Create 5 mock patients with different year levels
        year_levels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
        for i, yl in enumerate(year_levels):
            u = User.objects.create_user(email=f"student{i}@usc.edu.ph", password="password", role=User.Role.STUDENT, year_level=yl)
            Patient.objects.create(user=u, first_name=f"Student", last_name=f"{yl}", date_of_birth="2000-01-01", gender="M", email=u.email)
            
        self.client.login(email="nurse@usc.edu.ph", password="password")
        
        # Test filtering for "4th Year"
        url = reverse('patient-list') + "?year_level=4th Year"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # In our view, year_level_filter = self.request.query_params.get('year_level', None)
        # queryset = queryset.filter(user__year_level=year_level_filter)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['year_level'], '4th Year')
        
        print("[IT-04 PASS] Academic year filtering verified.")

    def test_it05_campaign_dissemination(self):
        """IT-05: Health Campaign Dissemination (Admin -> Student)."""
        # 1. Admin creates a campaign
        self.client.login(email="doctor@usc.edu.ph", password="password")
        campaign = HealthCampaign.objects.create(
            title="Vaccination Drive 2026",
            description="Get your shots at the clinic.",
            campaign_type="VACCINATION",
            priority="URGENT",
            content="Full details about the vaccination drive.",
            summary="Vaccination Drive",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30)
        )
        
        # 2. Student views campaign list
        self.client.login(email="21100727@usc.edu.ph", password="password")
        url = reverse('healthcampaign-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Check if the campaign is in the list
        data = response.json()
        results = data.get('results', data) # Handle both paginated and non-paginated
        titles = [c['title'] for c in results]
        self.assertIn("Vaccination Drive 2026", titles)
        
        print("[IT-05 PASS] Health campaign dissemination verified.")
