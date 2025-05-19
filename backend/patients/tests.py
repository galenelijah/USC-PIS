from django.test import TestCase
from .models import Patient
from django.contrib.auth import get_user_model

# Create your tests here.

class PatientModelTest(TestCase):
    def test_create_patient(self):
        user = get_user_model().objects.create_user(email='test@example.com', password='testpass')
        patient = Patient.objects.create(
            user=user,
            first_name='John',
            last_name='Doe',
            date_of_birth='2000-01-01',
            gender='M',
            email='john.doe@example.com',
            phone_number='1234567890',
            address='123 Main St'
        )
        self.assertEqual(patient.first_name, 'John')
        self.assertEqual(patient.last_name, 'Doe')
        self.assertEqual(patient.user.email, 'test@example.com')
