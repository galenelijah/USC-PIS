from rest_framework.test import APITestCase
from rest_framework import status
from authentication.models import User
from patients.models import Patient, MedicalRecord, DentalRecord
from medical_certificates.models import MedicalCertificate

class USCPISIntegrationValidationTests(APITestCase):

    def setUp(self):
        self.student = User.objects.create_user(email="21100000@usc.edu.ph", password="pw", role=User.Role.STUDENT)
        self.nurse = User.objects.create_user(email="nurse@usc.edu.ph", password="pw", role=User.Role.NURSE)
        self.doctor = User.objects.create_user(email="doctor@usc.edu.ph", password="pw", role=User.Role.DOCTOR)
        self.dentist = User.objects.create_user(email="dentist@usc.edu.ph", password="pw", role=User.Role.DENTIST)
        self.staff = User.objects.create_user(email="staff@usc.edu.ph", password="pw", role=User.Role.STAFF)
        self.admin = User.objects.create_user(email="admin@usc.edu.ph", password="pw", role=User.Role.ADMIN)
        
        self.patient = Patient.objects.create(
            user=self.student, first_name="Test", last_name="Student", 
            date_of_birth="2000-01-01", gender="M", email="21100000@usc.edu.ph"
        )
        
        self.dental_record = DentalRecord.objects.create(
            patient=self.patient,
            visit_date="2026-04-24T10:00:00Z",
            procedure_performed='CLEANING',
            diagnosis="Calculus"
        )

    def test_permission_audit_student_access_denied(self):
        """IT-01: Ensure Student gets 403 Forbidden on clinical endpoints."""
        self.client.force_authenticate(user=self.student)
        
        # Try to access all patient records
        response = self.client.get('/api/patients/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        
        # Try to issue a medical certificate
        cert_data = {"patient": self.patient.id, "status": "fit", "remarks": "Test"}
        response = self.client.post('/api/medical-certificates/', cert_data)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        
        print("[IT-01 PASS] Permission Audit: Student access successfully denied on clinical endpoints.")

    def test_certificate_pipeline_consultation_to_issuance(self):
        """IT-02: Simulate Consultation -> Vitals -> Certificate Generation."""
        
        # 1. Nurse records vitals
        self.client.force_authenticate(user=self.nurse)
        vitals_data = {
            "patient": self.patient.id,
            "visit_date": "2026-04-24T10:00:00Z",
            "concern": "Cough and Cold",
            "diagnosis": "Viral URI",
            "treatment": "Rest, Hydration",
            "vital_signs": {"temperature": "37.5"}
        }
        response = self.client.post('/api/medical-records/', vitals_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Doctor issues certificate based on consultation
        self.client.force_authenticate(user=self.doctor)
        cert_data = {
            "patient": self.patient.id,
            "status": "fit",
            "remarks": "Cleared to return to class.",
            "issued_by": self.doctor.id
        }
        response = self.client.post('/api/medical-certificates/', cert_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'fit')
        
        print("[IT-02 PASS] Certificate Pipeline: Complete workflow verified.")

    def test_student_feedback_to_admin_analytics(self):
        """IT-03: Simulate student submitting survey and verify Admin Analytics updates."""
        # 1. Student Submits Feedback
        self.client.force_authenticate(user=self.student)
        feedback_data = {
            "patient": self.patient.id,
            "rating": 5,
            "comments": "Great service!",
            "courteous": "yes",
            "recommend": "yes"
        }
        response = self.client.post('/api/feedback/', feedback_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Admin retrieves Analytics
        self.client.force_authenticate(user=self.admin)
        analytics_res = self.client.get('/api/feedback/analytics/')
        self.assertEqual(analytics_res.status_code, status.HTTP_200_OK)
        
        # Verify the 5-star rating was captured in the analytics
        stats = analytics_res.data.get('rating_distribution', {})
        self.assertGreaterEqual(stats.get('5', 0), 1)
        
        print("[IT-03 PASS] Feedback Pipeline: Student survey successfully captured in Admin Analytics.")

    def test_rbac_dentist_and_staff_boundaries(self):
        """IT-04: Dentist RBAC audit & Staff boundary checks."""
        # 1. Dentist modifies dental record
        self.client.force_authenticate(user=self.dentist)
        patch_data = {"diagnosis": "Updated Calculus"}
        response = self.client.patch(f'/api/dental-records/{self.dental_record.id}/', patch_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Staff tries to modify dental record (Should be Denied)
        self.client.force_authenticate(user=self.staff)
        response_staff_edit = self.client.patch(f'/api/dental-records/{self.dental_record.id}/', patch_data)
        self.assertIn(response_staff_edit.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        
        # 3. Staff tries to issue Medical Certificate (Should be Allowed for administrative staff)
        cert_data = {
            "patient": self.patient.id,
            "status": "fit",
            "remarks": "Admin issuance",
            "issued_by": self.doctor.id # Staff issuing on behalf of doctor
        }
        response_staff_cert = self.client.post('/api/medical-certificates/', cert_data)
        self.assertEqual(response_staff_cert.status_code, status.HTTP_201_CREATED)
        
        print("[IT-04 PASS] RBAC Boundaries: Dentist and Staff permissions strictly enforced.")

    def test_consultation_boundary_empty_fields(self):
        """IT-05: Boundary testing: submit consultation with empty required fields."""
        self.client.force_authenticate(user=self.doctor)
        
        empty_data = {
            "patient": self.patient.id,
            "visit_date": "2026-04-24T10:00:00Z",
            "concern": "", # Missing required
            "diagnosis": "", # Missing required
            "treatment": ""
        }
        response = self.client.post('/api/medical-records/', empty_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        print("[IT-05 PASS] Boundary Testing: Empty required fields successfully rejected (400 Bad Request).")
