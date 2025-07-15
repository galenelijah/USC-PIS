from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import date, datetime
from patients.models import Patient, MedicalRecord, DentalRecord, Consultation

User = get_user_model()


class PatientModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@usc.edu.ph',
            password='testpass123',
            role='ADMIN'
        )
        
    def test_patient_creation(self):
        """Test creating a patient with valid data"""
        patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.user
        )
        
        self.assertEqual(patient.first_name, 'John')
        self.assertEqual(patient.last_name, 'Doe')
        self.assertEqual(patient.email, 'john.doe@usc.edu.ph')
        self.assertEqual(str(patient), 'John Doe')
        
    def test_patient_email_unique(self):
        """Test that patient email must be unique"""
        Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.user
        )
        
        with self.assertRaises(IntegrityError):
            Patient.objects.create(
                first_name='Jane',
                last_name='Smith',
                date_of_birth=date(1985, 5, 15),
                gender='F',
                email='john.doe@usc.edu.ph',  # Same email
                phone_number='098-765-4321',
                address='456 Oak Ave, City',
                created_by=self.user
            )
    
    def test_patient_user_relationship(self):
        """Test patient can be linked to a user"""
        student_user = User.objects.create_user(
            email='student@usc.edu.ph',
            password='testpass123',
            role='STUDENT'
        )
        
        patient = Patient.objects.create(
            user=student_user,
            first_name='Student',
            last_name='User',
            date_of_birth=date(1995, 3, 10),
            gender='M',
            email='student@usc.edu.ph',
            phone_number='111-222-3333',
            address='789 Campus Dr, City',
            created_by=self.user
        )
        
        self.assertEqual(patient.user, student_user)
        self.assertEqual(student_user.patient_profile, patient)


class MedicalRecordModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='john.doe@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Main St, City',
            created_by=self.user
        )
        
    def test_medical_record_creation(self):
        """Test creating a medical record"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            diagnosis='Common cold',
            treatment='Rest and fluids',
            notes='Patient recovering well',
            vital_signs={'temperature': 98.6, 'blood_pressure': '120/80'},
            created_by=self.user
        )
        
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.diagnosis, 'Common cold')
        self.assertEqual(record.treatment, 'Rest and fluids')
        self.assertEqual(record.vital_signs['temperature'], 98.6)
        self.assertEqual(str(record), f'{self.patient} - {date.today()}')
        
    def test_medical_record_relationship(self):
        """Test medical record relationship with patient"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            diagnosis='Headache',
            treatment='Aspirin',
            created_by=self.user
        )
        
        self.assertIn(record, self.patient.medical_records.all())
        
    def test_medical_record_ordering(self):
        """Test medical records are ordered by visit date descending"""
        record1 = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date(2023, 1, 1),
            diagnosis='Condition A',
            treatment='Treatment A',
            created_by=self.user
        )
        
        record2 = MedicalRecord.objects.create(
            patient=self.patient,
            visit_date=date(2023, 1, 15),
            diagnosis='Condition B',
            treatment='Treatment B',
            created_by=self.user
        )
        
        records = MedicalRecord.objects.all()
        self.assertEqual(records[0], record2)  # Most recent first
        self.assertEqual(records[1], record1)


class DentalRecordModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='dentist@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.patient = Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth=date(1985, 5, 15),
            gender='F',
            email='jane.smith@usc.edu.ph',
            phone_number='098-765-4321',
            address='456 Oak Ave, City',
            created_by=self.user
        )
        
    def test_dental_record_creation(self):
        """Test creating a dental record"""
        record = DentalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            procedure_performed='CLEANING',
            tooth_numbers='11,12,13',
            diagnosis='Gingivitis',
            treatment_performed='Scaling and root planing',
            oral_hygiene_status='FAIR',
            gum_condition='GINGIVITIS',
            created_by=self.user
        )
        
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.procedure_performed, 'CLEANING')
        self.assertEqual(record.tooth_numbers, '11,12,13')
        self.assertEqual(record.diagnosis, 'Gingivitis')
        self.assertEqual(record.oral_hygiene_status, 'FAIR')
        self.assertEqual(record.gum_condition, 'GINGIVITIS')
        
    def test_dental_record_tooth_display(self):
        """Test the get_affected_teeth_display method"""
        record = DentalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            procedure_performed='FILLING',
            tooth_numbers='11,12,21',
            diagnosis='Caries',
            treatment_performed='Composite filling',
            created_by=self.user
        )
        
        self.assertEqual(record.get_affected_teeth_display(), '11, 12, 21')
        
    def test_dental_record_no_teeth(self):
        """Test dental record with no tooth numbers"""
        record = DentalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            procedure_performed='CONSULTATION',
            diagnosis='Routine checkup',
            treatment_performed='Examination',
            created_by=self.user
        )
        
        self.assertEqual(record.get_affected_teeth_display(), 'N/A')
        
    def test_dental_record_procedure_choices(self):
        """Test dental record procedure choices are valid"""
        valid_procedures = [choice[0] for choice in DentalRecord.PROCEDURE_CHOICES]
        
        record = DentalRecord.objects.create(
            patient=self.patient,
            visit_date=date.today(),
            procedure_performed='EXTRACTION',
            diagnosis='Impacted tooth',
            treatment_performed='Tooth extraction',
            created_by=self.user
        )
        
        self.assertIn(record.procedure_performed, valid_procedures)


class ConsultationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='doctor@usc.edu.ph',
            password='testpass123',
            role='DOCTOR'
        )
        
        self.patient = Patient.objects.create(
            first_name='Test',
            last_name='Patient',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            email='test.patient@usc.edu.ph',
            phone_number='123-456-7890',
            address='123 Test St, City',
            created_by=self.user
        )
        
    def test_consultation_creation(self):
        """Test creating a consultation"""
        consultation_time = datetime.now()
        consultation = Consultation.objects.create(
            patient=self.patient,
            date_time=consultation_time,
            chief_complaints='Headache and fever',
            treatment_plan='Rest and medication',
            remarks='Follow up in one week',
            created_by=self.user
        )
        
        self.assertEqual(consultation.patient, self.patient)
        self.assertEqual(consultation.chief_complaints, 'Headache and fever')
        self.assertEqual(consultation.treatment_plan, 'Rest and medication')
        self.assertEqual(consultation.remarks, 'Follow up in one week')
        
    def test_consultation_ordering(self):
        """Test consultations are ordered by date_time descending"""
        consultation1 = Consultation.objects.create(
            patient=self.patient,
            date_time=datetime(2023, 1, 1, 10, 0),
            chief_complaints='Complaint A',
            treatment_plan='Plan A',
            created_by=self.user
        )
        
        consultation2 = Consultation.objects.create(
            patient=self.patient,
            date_time=datetime(2023, 1, 15, 14, 30),
            chief_complaints='Complaint B',
            treatment_plan='Plan B',
            created_by=self.user
        )
        
        consultations = Consultation.objects.all()
        self.assertEqual(consultations[0], consultation2)  # Most recent first
        self.assertEqual(consultations[1], consultation1)
        
    def test_consultation_relationship(self):
        """Test consultation relationship with patient"""
        consultation = Consultation.objects.create(
            patient=self.patient,
            date_time=datetime.now(),
            chief_complaints='Test complaint',
            treatment_plan='Test plan',
            created_by=self.user
        )
        
        self.assertIn(consultation, self.patient.consultations.all())