from django.test import TestCase
from django.db import connection
from rest_framework.exceptions import ValidationError
from authentication.models import User, SafeEmail
from authentication.serializers import UserRegistrationSerializer

class USCPISAuthExtractionTests(TestCase):
    
    def setUp(self):
        self.serializer = UserRegistrationSerializer()

    def test_id_extraction_student(self):
        """Test that student ID is correctly extracted from email prefix."""
        email = "21100727@usc.edu.ph"
        extracted_id = self.serializer._extract_id_from_email(email)
        self.assertEqual(extracted_id, "21100727")

    def test_id_extraction_long_id(self):
        """Test extraction for different length IDs."""
        email = "6090146@usc.edu.ph"
        extracted_id = self.serializer._extract_id_from_email(email)
        self.assertEqual(extracted_id, "6090146")

    def test_id_extraction_professional(self):
        """Test that non-numeric prefixes do not return an ID number."""
        email = "j.doe@usc.edu.ph"
        extracted_id = self.serializer._extract_id_from_email(email)
        self.assertIsNone(extracted_id)

    def test_registration_automated_id_assignment(self):
        """Test that id_number is automatically assigned during user creation."""
        data = {
            "email": "21100727@usc.edu.ph",
            "first_name": "Test",
            "last_name": "Student",
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!"
        }
        
        # We simulate the serializer create call
        user = self.serializer.create(data)
        
        self.assertEqual(user.id_number, "21100727")
        self.assertEqual(user.role, User.Role.STUDENT)
        
    def test_id_number_lockout_during_creation(self):
        """Test that manually passed id_number is ignored."""
        data = {
            "email": "21100727@usc.edu.ph",
            "id_number": "9999999", # Malicious attempt to override
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!"
        }
        
        user = self.serializer.create(data)
        self.assertEqual(user.id_number, "21100727") # Should stay as extracted value
        self.assertNotEqual(user.id_number, "9999999")
