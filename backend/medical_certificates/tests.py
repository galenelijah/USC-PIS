from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from datetime import date, timedelta
from patients.models import Patient
from notifications.models import Notification
from medical_certificates.models import MedicalCertificate, CertificateTemplate
import json

User = get_user_model()


class MedicalCertificateModelTest(TestCase):
    def setUp(self):
        self.doctor = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.patient_user = User.objects.create_user(
            email='patient@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        self.patient = Patient.objects.create(
            user=self.patient_user,
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='patient@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.doctor
        )
        
        self.template = CertificateTemplate.objects.create(
            name='Test Template',
            description='Test medical certificate template',
            content='<p>Certificate for {{patient_name}}</p>'
        )
        
    def test_medical_certificate_creation(self):
        """Test creating a medical certificate"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Common cold',
            recommendations='Rest and fluids',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=7),
            additional_notes='Follow up in one week',
            created_by=self.doctor
        )
        
        self.assertEqual(certificate.patient, self.patient)
        self.assertEqual(certificate.template, self.template)
        self.assertEqual(certificate.diagnosis, 'Common cold')
        self.assertEqual(certificate.issuance_status, 'draft')
        self.assertEqual(certificate.created_by, self.doctor)
        self.assertIsNone(certificate.issuing_doctor)
        
    def test_certificate_string_representation(self):
        """Test certificate string representation"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Flu',
            recommendations='Rest',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=3),
            created_by=self.doctor
        )
        
        expected_str = f"Certificate for {self.patient} - Physically Fit (Draft)"
        self.assertEqual(str(certificate), expected_str)
        
    def test_certificate_status_choices(self):
        """Test certificate status choices"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test',
            recommendations='Test',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=1),
            created_by=self.doctor
        )
        
        # Test all valid status choices
        valid_statuses = ['draft', 'pending', 'issued', 'rejected']
        for status_choice in valid_statuses:
            certificate.issuance_status = status_choice
            certificate.save()
            self.assertEqual(certificate.issuance_status, status_choice)
            
    def test_certificate_notification_on_creation(self):
        """Test notification is sent when certificate is created"""
        Notification.objects.all().delete()
        
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test diagnosis',
            recommendations='Test recommendations',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=5),
            created_by=self.doctor
        )
        
        notifications = Notification.objects.filter(
            recipient=self.patient_user,
            notification_type='MEDICAL_CERTIFICATE'
        )
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.title, 'Medical Certificate Created')
        
    def test_certificate_notification_on_issuance(self):
        """Test notification is sent when certificate is issued"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test diagnosis',
            recommendations='Test recommendations',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=5),
            created_by=self.doctor,
            issuance_status='pending'
        )
        
        Notification.objects.all().delete()
        
        # Issue the certificate
        certificate.issuance_status = 'issued'
        certificate.issuing_doctor = self.doctor
        certificate.issued_at = date.today()
        certificate.save()
        
        notifications = Notification.objects.filter(
            recipient=self.patient_user,
            notification_type='MEDICAL_CERTIFICATE'
        )
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.title, 'Medical Certificate Issued')
        self.assertIn('Medical Certificate is ready to be claimed', notification.message)


class MedicalCertificateViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.doctor = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR',
            first_name='Doctor',
            last_name='Who'
        )
        
        self.student = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT',
            first_name='Student',
            last_name='One'
        )
        
        self.doctor_token = Token.objects.create(user=self.doctor)
        self.student_token = Token.objects.create(user=self.student)
        
        self.patient = Patient.objects.create(
            user=self.student,
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='student@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.doctor
        )
        
        self.template = CertificateTemplate.objects.create(
            name='Test Template',
            description='Test template',
            content='<p>Certificate for {{patient_name}}</p>'
        )
        
        self.certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Common cold',
            recommendations='Rest and fluids',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=7),
            created_by=self.doctor
        )
        
    def test_doctor_can_create_certificate(self):
        """Test doctor can create medical certificate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        data = {
            'patient': self.patient.id,
            'template': self.template.id,
            'diagnosis': 'Headache',
            'recommendations': 'Rest and pain medication',
            'valid_from': date.today().isoformat(),
            'valid_until': (date.today() + timedelta(days=3)).isoformat(),
            'additional_notes': 'Follow up if symptoms persist',
            'fitness_status': 'physically_fit'
        }
        
        response = self.client.post('/api/medical-certificates/certificates/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    def test_doctor_can_issue_certificate(self):
        """Test doctor can issue certificate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        self.certificate.issuance_status = 'pending'
        self.certificate.save()
        
        response = self.client.post(f'/api/medical-certificates/certificates/{self.certificate.id}/issue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.certificate.refresh_from_db()
        self.assertEqual(self.certificate.issuance_status, 'issued')
        self.assertEqual(self.certificate.issuing_doctor, self.doctor)
        
    def test_student_cannot_create_certificate(self):
        """Test student cannot create medical certificate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        data = {
            'patient': self.patient.id,
            'template': self.template.id,
            'diagnosis': 'Test',
            'recommendations': 'Test',
            'valid_from': date.today().isoformat(),
            'valid_until': (date.today() + timedelta(days=1)).isoformat()
        }
        
        response = self.client.post('/api/medical-certificates/certificates/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejected_certificate_is_locked(self):
        """Test rejected certificate cannot be modified"""
        self.certificate.issuance_status = 'rejected'
        self.certificate.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        data = {'diagnosis': 'New Diagnosis'}
        response = self.client.patch(f'/api/medical-certificates/certificates/{self.certificate.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rejected and cannot be modified', str(response.data))

    def test_date_trapping_future_birthday(self):
        """Test date trapping for future birthdays"""
        self.patient.date_of_birth = date.today() + timedelta(days=1)
        self.patient.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        data = {
            'patient': self.patient.id,
            'template': self.template.id,
            'valid_from': date.today().isoformat(),
            'valid_until': (date.today() + timedelta(days=1)).isoformat()
        }
        response = self.client.post('/api/medical-certificates/certificates/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date of birth cannot be in the future', str(response.data))

    def test_date_trapping_preceding_consultation(self):
        """Test valid_from cannot precede consultation date"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        data = {
            'patient': self.patient.id,
            'template': self.template.id,
            'valid_from': (date.today() - timedelta(days=5)).isoformat(),
            'valid_until': date.today().isoformat()
        }
        response = self.client.post('/api/medical-certificates/certificates/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot precede the consultation date', str(response.data))
