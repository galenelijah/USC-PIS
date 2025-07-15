from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from datetime import date
from patients.models import Patient, MedicalRecord, DentalRecord
import json

User = get_user_model()


class PatientViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@usc.edu.ph',
            password='testpass123',
            role='ADMIN'
        )
        
        self.doctor_user = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.student_user = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        # Create tokens
        self.admin_token = Token.objects.create(user=self.admin_user)
        self.doctor_token = Token.objects.create(user=self.doctor_user)
        self.student_token = Token.objects.create(user=self.student_user)
        
        # Create a patient
        self.patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.admin_user
        )
        
        # Create a patient linked to student
        self.student_patient = Patient.objects.create(
            user=self.student_user,
            first_name='Student',
            last_name='User',
            date_of_birth=date(1995, 3, 10),
            gender='M',
            email='student@usc.edu.ph',
            phone_number='111-222-3333',
            address='789 Campus Dr, City',
            created_by=self.admin_user
        )
        
    def test_admin_can_list_all_patients(self):
        """Test that admin can view all patients"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        response = self.client.get('/api/patients/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
    def test_doctor_can_list_all_patients(self):
        """Test that doctor can view all patients"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        response = self.client.get('/api/patients/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
    def test_student_can_only_view_own_patient_record(self):
        """Test that student can only view their own patient record"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        response = self.client.get('/api/patients/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'student@usc.edu.ph')
        
    def test_admin_can_create_patient(self):
        """Test that admin can create a new patient"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        patient_data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'date_of_birth': '1985-05-15',
            'gender': 'F',
            'email': 'jane.smith@usc.edu.ph',
            'phone_number': '098-765-4321',
            'address': '456 Oak Ave, City'
        }
        
        response = self.client.post('/api/patients/patients/', patient_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Patient.objects.count(), 3)
        
    def test_student_cannot_create_patient(self):
        """Test that student cannot create patients"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        patient_data = {
            'first_name': 'Test',
            'last_name': 'Patient',
            'date_of_birth': '1990-01-01',
            'gender': 'M',
            'email': 'test.patient@usc.edu.ph',
            'phone_number': '123-456-7890',
            'address': '123 Test St, City'
        }
        
        response = self.client.post('/api/patients/patients/', patient_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_patient_search_functionality(self):
        """Test patient search functionality"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        response = self.client.get('/api/patients/patients/?search=John')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['first_name'], 'John')
        
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access patients"""
        response = self.client.get('/api/patients/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MedicalRecordViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.doctor_user = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.student_user = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        self.doctor_token = Token.objects.create(user=self.doctor_user)
        self.student_token = Token.objects.create(user=self.student_user)
        
        self.patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.doctor_user
        )
        
        self.student_patient = Patient.objects.create(
            user=self.student_user,
            first_name='Student',
            last_name='User',
            date_of_birth=date(1995, 3, 10),
            gender='M',
            email='student@usc.edu.ph',
            phone_number='111-222-3333',
            address='789 Campus Dr, City',
            created_by=self.doctor_user
        )
        
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            diagnosis='Common cold',
            treatment='Rest and fluids',
            created_by=self.doctor_user
        )
        
    def test_doctor_can_create_medical_record(self):
        """Test that doctor can create medical records"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        record_data = {
            'patient': self.patient.id,
            'visit_date': '2023-12-01',
            'diagnosis': 'Headache',
            'treatment': 'Aspirin',
            'notes': 'Patient feeling better'
        }
        
        response = self.client.post('/api/patients/medical-records/', record_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalRecord.objects.count(), 2)
        
    def test_student_cannot_create_medical_record(self):
        """Test that student cannot create medical records"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        record_data = {
            'patient': self.patient.id,
            'visit_date': '2023-12-01',
            'diagnosis': 'Headache',
            'treatment': 'Aspirin'
        }
        
        response = self.client.post('/api/patients/medical-records/', record_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_student_can_view_own_medical_records(self):
        """Test that student can view their own medical records"""
        # Create a medical record for the student
        student_record = MedicalRecord.objects.create(
            patient=self.student_patient,
            visit_date=date.today(),
            diagnosis='Flu',
            treatment='Rest',
            created_by=self.doctor_user
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        response = self.client.get('/api/patients/medical-records/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['diagnosis'], 'Flu')
        
    def test_doctor_can_view_all_medical_records(self):
        """Test that doctor can view all medical records"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        response = self.client.get('/api/patients/medical-records/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class DashboardStatsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            email='admin@usc.edu.ph',
            password='testpass123',
            role='ADMIN'
        )
        
        self.student_user = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        self.admin_token = Token.objects.create(user=self.admin_user)
        self.student_token = Token.objects.create(user=self.student_user)
        
        # Create test data
        self.patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.admin_user
        )
        
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            diagnosis='Common cold',
            treatment='Rest and fluids',
            created_by=self.admin_user
        )
        
    def test_admin_dashboard_stats(self):
        """Test dashboard stats for admin user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        response = self.client.get('/api/patients/dashboard-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_patients', response.data)
        self.assertIn('total_records', response.data)
        self.assertIn('recent_patients', response.data)
        self.assertEqual(response.data['total_patients'], 1)
        self.assertEqual(response.data['total_records'], 1)
        
    def test_student_dashboard_stats(self):
        """Test dashboard stats for student user"""
        # Create patient profile for student
        student_patient = Patient.objects.create(
            user=self.student_user,
            first_name='Student',
            last_name='User',
            date_of_birth=date(1995, 3, 10),
            gender='M',
            email='student@usc.edu.ph',
            phone_number='111-222-3333',
            address='789 Campus Dr, City',
            created_by=self.admin_user
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        response = self.client.get('/api/patients/dashboard-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_completion', response.data)
        self.assertIn('patient_id', response.data)
        self.assertEqual(response.data['patient_id'], student_patient.id)
        
    def test_dashboard_stats_authentication_required(self):
        """Test that dashboard stats require authentication"""
        response = self.client.get('/api/patients/dashboard-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)