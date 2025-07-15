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
            issued_by=self.doctor
        )
        
        self.assertEqual(certificate.patient, self.patient)
        self.assertEqual(certificate.template, self.template)
        self.assertEqual(certificate.diagnosis, 'Common cold')
        self.assertEqual(certificate.status, 'draft')
        self.assertEqual(certificate.issued_by, self.doctor)
        self.assertIsNone(certificate.approved_by)
        
    def test_certificate_string_representation(self):
        """Test certificate string representation"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Flu',
            recommendations='Rest',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=3),
            issued_by=self.doctor
        )
        
        expected_str = f"Certificate for {self.patient} - Draft"
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
            issued_by=self.doctor
        )
        
        # Test all valid status choices
        valid_statuses = ['draft', 'pending', 'approved', 'rejected']
        for status_choice in valid_statuses:
            certificate.status = status_choice
            certificate.save()
            self.assertEqual(certificate.status, status_choice)
            
    def test_certificate_notification_on_creation(self):
        """Test notification is sent when certificate is created"""
        # Clear any existing notifications
        Notification.objects.all().delete()
        
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test diagnosis',
            recommendations='Test recommendations',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=5),
            issued_by=self.doctor
        )
        
        # Check notification was created
        notifications = Notification.objects.filter(
            user=self.patient_user,
            notification_type='certificate_created'
        )
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.title, 'Medical Certificate Created')
        self.assertIn('new medical certificate has been created', notification.message)
        
    def test_certificate_notification_on_approval(self):
        """Test notification is sent when certificate is approved"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test diagnosis',
            recommendations='Test recommendations',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=5),
            issued_by=self.doctor,
            status='pending'
        )
        
        # Clear notifications from creation
        Notification.objects.all().delete()
        
        # Approve the certificate
        certificate.status = 'approved'
        certificate.approved_by = self.doctor
        certificate.save()
        
        # Check notification was created
        notifications = Notification.objects.filter(
            user=self.patient_user,
            notification_type='certificate_approved'
        )
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.title, 'Medical Certificate Approved')
        self.assertIn('has been approved', notification.message)
        
    def test_certificate_notification_on_rejection(self):
        """Test notification is sent when certificate is rejected"""
        certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Test diagnosis',
            recommendations='Test recommendations',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=5),
            issued_by=self.doctor,
            status='pending'
        )
        
        # Clear notifications from creation
        Notification.objects.all().delete()
        
        # Reject the certificate
        certificate.status = 'rejected'
        certificate.approved_by = self.doctor
        certificate.save()
        
        # Check notification was created
        notifications = Notification.objects.filter(
            user=self.patient_user,
            notification_type='certificate_rejected'
        )
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.title, 'Medical Certificate Rejected')
        self.assertIn('has been rejected', notification.message)


class MedicalCertificateViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.doctor = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.student = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        self.admin = User.objects.create_user(
            email='admin@usc.edu.ph',
            password='testpass123',
            role='ADMIN'
        )
        
        # Create tokens
        self.doctor_token = Token.objects.create(user=self.doctor)
        self.student_token = Token.objects.create(user=self.student)
        self.admin_token = Token.objects.create(user=self.admin)
        
        # Create patient
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
        
        # Create template
        self.template = CertificateTemplate.objects.create(
            name='Test Template',
            description='Test template',
            content='<p>Certificate for {{patient_name}}</p>'
        )
        
        # Create certificate
        self.certificate = MedicalCertificate.objects.create(
            patient=self.patient,
            template=self.template,
            diagnosis='Common cold',
            recommendations='Rest and fluids',
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=7),
            issued_by=self.doctor
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
            'additional_notes': 'Follow up if symptoms persist'
        }
        
        response = self.client.post('/api/medical-certificates/certificates/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalCertificate.objects.count(), 2)
        
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
        
    def test_doctor_can_approve_certificate(self):
        """Test doctor can approve certificate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        # First submit for approval
        self.certificate.status = 'pending'
        self.certificate.save()
        
        response = self.client.post(f'/api/medical-certificates/certificates/{self.certificate.id}/approve/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.certificate.refresh_from_db()
        self.assertEqual(self.certificate.status, 'approved')
        self.assertEqual(self.certificate.approved_by, self.doctor)
        
    def test_doctor_can_reject_certificate(self):
        """Test doctor can reject certificate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        # First submit for approval
        self.certificate.status = 'pending'
        self.certificate.save()
        
        response = self.client.post(f'/api/medical-certificates/certificates/{self.certificate.id}/reject/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.certificate.refresh_from_db()
        self.assertEqual(self.certificate.status, 'rejected')
        self.assertEqual(self.certificate.approved_by, self.doctor)
        
    def test_student_can_view_own_certificates(self):
        """Test student can view only their own certificates"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.student_token.key}')
        
        response = self.client.get('/api/medical-certificates/certificates/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['patient'], self.patient.id)
        
    def test_doctor_can_view_all_certificates(self):
        """Test doctor can view all certificates"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        response = self.client.get('/api/medical-certificates/certificates/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
    def test_certificate_pdf_generation(self):
        """Test certificate PDF generation"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doctor_token.key}')
        
        # Approve certificate first
        self.certificate.status = 'approved'
        self.certificate.approved_by = self.doctor
        self.certificate.save()
        
        response = self.client.get(f'/api/medical-certificates/certificates/{self.certificate.id}/render_pdf/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        
    def test_unauthenticated_access_denied(self):
        """Test unauthenticated access is denied"""
        response = self.client.get('/api/medical-certificates/certificates/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CertificateTemplateTest(TestCase):
    def test_template_creation(self):
        """Test creating a certificate template"""
        template = CertificateTemplate.objects.create(
            name='Test Template',
            description='A test template',
            content='<p>This is a test template for {{patient_name}}</p>'
        )
        
        self.assertEqual(template.name, 'Test Template')
        self.assertEqual(template.description, 'A test template')
        self.assertIn('{{patient_name}}', template.content)
        self.assertEqual(str(template), 'Test Template')
        
    def test_template_string_representation(self):
        """Test template string representation"""
        template = CertificateTemplate.objects.create(
            name='Medical Certificate Template',
            content='<p>Template content</p>'
        )
        
        self.assertEqual(str(template), 'Medical Certificate Template')