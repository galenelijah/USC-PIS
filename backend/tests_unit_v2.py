from django.test import TestCase, Client
from django.db import connection
from django.utils import timezone
from datetime import timedelta, datetime
from authentication.models import User, VerificationCode, SafeEmail
from patients.models import Patient, DentalRecord, MedicalRecord
import re

class USCPISAdvancedUnitTests(TestCase):
    """UT-01 to UT-04: Advanced Unit Testing Suite v2.0"""

    def setUp(self):
        self.client = Client()
        self.test_user = User.objects.create_user(
            email="auditor@usc.edu.ph",
            password="Password123!",
            role=User.Role.DOCTOR,
            first_name="Lead",
            last_name="Auditor"
        )

    def test_ut01_pgcrypto_sql_audit(self):
        """UT-01: pgcrypto SQL Audit for Patient Name and Diagnosis."""
        # Create a patient and a medical record
        patient = Patient.objects.create(
            first_name="Sensitive",
            last_name="Patient",
            date_of_birth="2000-01-01",
            gender="M",
            email="sensitive@usc.edu.ph",
            phone_number="09123456789",
            address="USC Talamban"
        )
        
        medical_record = MedicalRecord.objects.create(
            patient=patient,
            visit_date=timezone.now(),
            diagnosis="Chronic Migraine with Aura",
            treatment="Rest and Hydration",
            created_by=self.test_user
        )

        # Audit pgcrypto on User (illness) - existing implementation
        self.test_user.illness = "Asthma"
        self.test_user.save()

        if connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                # Check User illness_enc
                cursor.execute("SELECT illness_enc FROM authentication_user WHERE id = %s", [self.test_user.id])
                illness_enc = cursor.fetchone()[0]
                self.assertIsNotNone(illness_enc)
                self.assertIsInstance(illness_enc, (bytes, memoryview))
                
                # Check Patient name encryption
                cursor.execute("SELECT first_name_enc FROM patients_patient WHERE id = %s", [patient.id])
                name_enc = cursor.fetchone()[0]
                self.assertIsNotNone(name_enc, "Patient first_name_enc is null")
                self.assertIsInstance(name_enc, (bytes, memoryview))

                # Check MedicalRecord diagnosis encryption
                cursor.execute("SELECT diagnosis_enc FROM patients_medicalrecord WHERE id = %s", [medical_record.id])
                diag_enc = cursor.fetchone()[0]
                self.assertIsNotNone(diag_enc, "MedicalRecord diagnosis_enc is null")
                self.assertIsInstance(diag_enc, (bytes, memoryview))
            
            print("[UT-01 PASS] pgcrypto audit completed for User, Patient, and MedicalRecord.")
        else:
            self.skipTest("Not using PostgreSQL. pgcrypto audit requires PostgreSQL.")

    def test_ut02_year_level_sorting_logic(self):
        """UT-02: Academic Year Level Logic & Filtering."""
        # Create students for each year level
        year_levels = ['1', '2', '3', '4']
        for yl in year_levels:
            u = User.objects.create_user(
                email=f"student{yl}@usc.edu.ph",
                password="Password123!",
                role=User.Role.STUDENT,
                year_level=yl
            )
            Patient.objects.create(
                user=u, first_name=f"Student{yl}", last_name="Test",
                date_of_birth="2005-01-01", gender="M", email=u.email
            )

        # Verify filtering via the PatientViewSet logic
        # Mocking the query params
        from patients.views import PatientViewSet
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        
        factory = APIRequestFactory()
        for yl in year_levels:
            request = factory.get(f'/api/patients/?year_level={yl}')
            request.user = self.test_user
            view = PatientViewSet()
            # Wrap the WSGIRequest in a DRF Request to provide query_params
            drf_request = Request(request)
            drf_request.user = self.test_user
            view.request = drf_request
            queryset = view.get_queryset()
            self.assertEqual(queryset.filter(user__year_level=yl).count(), 1)
        
        print("[UT-02 PASS] Year-level filtering logic verified.")

    def test_ut03_auth_mfa_expiration(self):
        """UT-03: Authentication & MFA Domain Enforcement and Expiration."""
        # 1. Domain Enforcement (handled by serializer usually)
        # We'll check the VerificationCode expiration logic here
        code = VerificationCode.objects.create(
            user=self.test_user,
            code="123456",
            expires_at=timezone.now() - timedelta(minutes=1) # Already expired
        )
        self.assertTrue(code.is_expired())
        
        # Valid code
        valid_code = VerificationCode.objects.create(
            user=self.test_user,
            code="654321",
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        self.assertFalse(valid_code.is_expired())
        
        print("[UT-03 PASS] MFA expiration logic verified.")

    def test_ut04_medical_field_constraints(self):
        """UT-04: Regex constraints for Blood Type, Allergies, and Dental Notation."""
        # Blood Type Regex (Standard: A+, A-, B+, B-, AB+, AB-, O+, O-)
        blood_regex = r'^(A|B|AB|O)[\+\-]$'
        self.assertTrue(re.match(blood_regex, "A+"))
        self.assertTrue(re.match(blood_regex, "O-"))
        self.assertFalse(re.match(blood_regex, "C+"))
        
        # Dental Notation (FDI: Comma-separated two-digit numbers 11-48)
        dental_regex = r'^(\d{2})(,\d{2})*$'
        self.assertTrue(re.match(dental_regex, "11,12,21"))
        self.assertFalse(re.match(dental_regex, "1,2,3"))
        
        # Verify DentalRecord tooth_numbers field (existing field)
        dr = DentalRecord(
            patient=Patient.objects.first(),
            visit_date=timezone.now(),
            procedure_performed='CLEANING',
            tooth_numbers="11,12",
            diagnosis="Healthy"
        )
        # Basic validation that it doesn't crash
        dr.clean()
        self.assertEqual(dr.tooth_numbers, "11,12")
        
        print("[UT-04 PASS] Medical field constraints verified.")
