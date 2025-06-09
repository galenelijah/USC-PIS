import re
import datetime
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from typing import Optional, List, Dict, Tuple
import logging
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

class PatientDataValidator:
    """Comprehensive patient data validation with edge case handling."""
    
    @staticmethod
    def validate_patient_data(data: Dict) -> List[str]:
        """
        Validate patient data comprehensively.
        Returns list of validation errors.
        """
        errors = []
        
        # Name validation
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        if not first_name:
            errors.append("First name is required")
        elif len(first_name) < 2:
            errors.append("First name must be at least 2 characters")
        elif len(first_name) > 50:
            errors.append("First name cannot exceed 50 characters")
        elif not PatientDataValidator._is_valid_name(first_name):
            errors.append("First name contains invalid characters")
        
        if not last_name:
            errors.append("Last name is required")
        elif len(last_name) < 2:
            errors.append("Last name must be at least 2 characters")
        elif len(last_name) > 50:
            errors.append("Last name cannot exceed 50 characters")
        elif not PatientDataValidator._is_valid_name(last_name):
            errors.append("Last name contains invalid characters")
        
        # Date of birth validation
        dob = data.get('date_of_birth')
        if dob:
            dob_errors = PatientDataValidator._validate_date_of_birth(dob)
            errors.extend(dob_errors)
        else:
            errors.append("Date of birth is required")
        
        # Gender validation
        gender = data.get('gender', '').upper()
        valid_genders = ['M', 'F', 'O', 'MALE', 'FEMALE', 'OTHER']
        if gender and gender not in valid_genders:
            errors.append("Gender must be M (Male), F (Female), or O (Other)")
        
        # Email validation
        email = data.get('email', '').strip()
        if email:
            email_errors = PatientDataValidator._validate_email(email)
            errors.extend(email_errors)
        
        # Phone validation
        phone = data.get('phone_number', '').strip()
        if phone:
            phone_errors = PatientDataValidator._validate_phone(phone)
            errors.extend(phone_errors)
        
        # Address validation
        address = data.get('address', '').strip()
        if address:
            if len(address) > 500:
                errors.append("Address cannot exceed 500 characters")
            if len(address) < 10:
                errors.append("Address seems too short (minimum 10 characters)")
        
        return errors
    
    @staticmethod
    def _is_valid_name(name: str) -> bool:
        """Validate name contains only valid characters."""
        # Allow letters, spaces, hyphens, apostrophes, periods
        pattern = r"^[a-zA-Z\s\-'\.]+$"
        return bool(re.match(pattern, name))
    
    @staticmethod
    def _validate_date_of_birth(dob) -> List[str]:
        """Validate date of birth with comprehensive checks."""
        errors = []
        
        try:
            # Handle different date formats
            if isinstance(dob, str):
                # Try multiple date formats
                formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']
                parsed_date = None
                
                for fmt in formats:
                    try:
                        parsed_date = datetime.datetime.strptime(dob.split()[0], fmt).date()
                        break
                    except ValueError:
                        continue
                
                if not parsed_date:
                    errors.append("Invalid date format. Use YYYY-MM-DD")
                    return errors
                    
                dob = parsed_date
            
            elif hasattr(dob, 'date'):
                dob = dob.date()
            elif not isinstance(dob, datetime.date):
                errors.append("Invalid date format")
                return errors
            
            # Date range validation
            today = datetime.date.today()
            min_date = datetime.date(1900, 1, 1)
            
            if dob > today:
                errors.append("Date of birth cannot be in the future")
            elif dob < min_date:
                errors.append("Date of birth cannot be before 1900")
            else:
                # Age validation
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                if age > 150:
                    errors.append("Age seems unrealistic (over 150 years)")
                elif age < 0:
                    errors.append("Invalid date of birth")
            
        except Exception as e:
            logger.error(f"Date validation error: {e}")
            errors.append("Invalid date format")
        
        return errors
    
    @staticmethod
    def _validate_email(email: str) -> List[str]:
        """Validate email format."""
        errors = []
        
        # Basic email pattern
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            errors.append("Invalid email format")
        elif len(email) > 254:
            errors.append("Email address too long")
        elif '..' in email:
            errors.append("Email cannot contain consecutive dots")
        
        return errors
    
    @staticmethod
    def _validate_phone(phone: str) -> List[str]:
        """Validate phone number."""
        errors = []
        
        # Clean phone number
        clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Allow international format with +
        if clean_phone.startswith('+'):
            clean_phone = clean_phone[1:]
        
        if not clean_phone.isdigit():
            errors.append("Phone number can only contain digits, spaces, hyphens, and parentheses")
        elif len(clean_phone) < 10:
            errors.append("Phone number must be at least 10 digits")
        elif len(clean_phone) > 15:
            errors.append("Phone number cannot exceed 15 digits")
        
        return errors

class DuplicatePatientDetector:
    """Detect potential duplicate patients using fuzzy matching."""
    
    SIMILARITY_THRESHOLD = 0.85  # 85% similarity threshold
    
    @staticmethod
    def find_potential_duplicates(patient_data: Dict, exclude_id: Optional[int] = None) -> List[Dict]:
        """
        Find potential duplicate patients based on fuzzy matching.
        Returns list of potential matches with similarity scores.
        """
        from .models import Patient
        
        potential_duplicates = []
        
        # Get existing patients
        queryset = Patient.objects.all()
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        
        first_name = patient_data.get('first_name', '').lower().strip()
        last_name = patient_data.get('last_name', '').lower().strip()
        dob = patient_data.get('date_of_birth')
        email = patient_data.get('email', '').lower().strip()
        phone = patient_data.get('phone_number', '').strip()
        
        for existing_patient in queryset:
            similarity_score = DuplicatePatientDetector._calculate_similarity(
                {
                    'first_name': first_name,
                    'last_name': last_name,
                    'date_of_birth': dob,
                    'email': email,
                    'phone_number': phone
                },
                {
                    'first_name': existing_patient.first_name.lower(),
                    'last_name': existing_patient.last_name.lower(),
                    'date_of_birth': existing_patient.date_of_birth,
                    'email': existing_patient.email.lower(),
                    'phone_number': existing_patient.phone_number
                }
            )
            
            if similarity_score >= DuplicatePatientDetector.SIMILARITY_THRESHOLD:
                potential_duplicates.append({
                    'patient': existing_patient,
                    'similarity_score': similarity_score,
                    'matching_fields': DuplicatePatientDetector._get_matching_fields(
                        patient_data, existing_patient
                    )
                })
        
        # Sort by similarity score (highest first)
        potential_duplicates.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return potential_duplicates
    
    @staticmethod
    def _calculate_similarity(data1: Dict, data2: Dict) -> float:
        """Calculate similarity score between two patient records."""
        scores = []
        weights = {
            'first_name': 0.25,
            'last_name': 0.25,
            'date_of_birth': 0.3,
            'email': 0.15,
            'phone_number': 0.05
        }
        
        # Name similarity
        name1_similarity = SequenceMatcher(None, 
            data1.get('first_name', ''), 
            data2.get('first_name', '')
        ).ratio()
        
        name2_similarity = SequenceMatcher(None, 
            data1.get('last_name', ''), 
            data2.get('last_name', '')
        ).ratio()
        
        # Date of birth exact match
        dob_similarity = 1.0 if data1.get('date_of_birth') == data2.get('date_of_birth') else 0.0
        
        # Email exact match (case insensitive)
        email_similarity = 1.0 if (data1.get('email', '').lower() == data2.get('email', '').lower() 
                                  and data1.get('email')) else 0.0
        
        # Phone similarity (allowing for formatting differences)
        phone1 = re.sub(r'[\s\-\(\)]', '', data1.get('phone_number', ''))
        phone2 = re.sub(r'[\s\-\(\)]', '', data2.get('phone_number', ''))
        phone_similarity = 1.0 if phone1 and phone2 and phone1 == phone2 else 0.0
        
        # Calculate weighted average
        total_score = (
            name1_similarity * weights['first_name'] +
            name2_similarity * weights['last_name'] +
            dob_similarity * weights['date_of_birth'] +
            email_similarity * weights['email'] +
            phone_similarity * weights['phone_number']
        )
        
        return total_score
    
    @staticmethod
    def _get_matching_fields(data1: Dict, existing_patient) -> List[str]:
        """Get list of fields that match between records."""
        matching_fields = []
        
        # Check exact matches
        if data1.get('first_name', '').lower() == existing_patient.first_name.lower():
            matching_fields.append('first_name')
        
        if data1.get('last_name', '').lower() == existing_patient.last_name.lower():
            matching_fields.append('last_name')
        
        if data1.get('date_of_birth') == existing_patient.date_of_birth:
            matching_fields.append('date_of_birth')
        
        if data1.get('email', '').lower() == existing_patient.email.lower():
            matching_fields.append('email')
        
        # Phone number (clean comparison)
        phone1 = re.sub(r'[\s\-\(\)]', '', data1.get('phone_number', ''))
        phone2 = re.sub(r'[\s\-\(\)]', '', existing_patient.phone_number)
        if phone1 and phone2 and phone1 == phone2:
            matching_fields.append('phone_number')
        
        return matching_fields

class MedicalRecordValidator:
    """Validate medical records with comprehensive edge case handling."""
    
    @staticmethod
    def validate_medical_record(data: Dict) -> List[str]:
        """Validate medical record data."""
        errors = []
        
        # Visit date validation
        visit_date = data.get('visit_date')
        if visit_date:
            date_errors = MedicalRecordValidator._validate_visit_date(visit_date)
            errors.extend(date_errors)
        else:
            errors.append("Visit date is required")
        
        # Diagnosis validation
        diagnosis = data.get('diagnosis', '').strip()
        if not diagnosis:
            errors.append("Diagnosis is required")
        elif len(diagnosis) < 5:
            errors.append("Diagnosis must be at least 5 characters")
        elif len(diagnosis) > 1000:
            errors.append("Diagnosis cannot exceed 1000 characters")
        
        # Treatment validation
        treatment = data.get('treatment', '').strip()
        if not treatment:
            errors.append("Treatment is required")
        elif len(treatment) < 5:
            errors.append("Treatment must be at least 5 characters")
        elif len(treatment) > 1000:
            errors.append("Treatment cannot exceed 1000 characters")
        
        # Notes validation (optional but if provided, validate)
        notes = data.get('notes', '').strip()
        if notes and len(notes) > 2000:
            errors.append("Notes cannot exceed 2000 characters")
        
        # Patient reference validation
        patient_id = data.get('patient')
        if not patient_id:
            errors.append("Patient reference is required")
        
        return errors
    
    @staticmethod
    def _validate_visit_date(visit_date) -> List[str]:
        """Validate visit date."""
        errors = []
        
        try:
            # Handle different date formats
            if isinstance(visit_date, str):
                try:
                    parsed_date = datetime.datetime.strptime(visit_date, '%Y-%m-%d').date()
                except ValueError:
                    errors.append("Visit date must be in YYYY-MM-DD format")
                    return errors
                visit_date = parsed_date
            elif hasattr(visit_date, 'date'):
                visit_date = visit_date.date()
            elif not isinstance(visit_date, datetime.date):
                errors.append("Invalid visit date format")
                return errors
            
            # Date range validation
            today = datetime.date.today()
            
            if visit_date > today:
                errors.append("Visit date cannot be in the future")
            elif visit_date < datetime.date(2000, 1, 1):
                errors.append("Visit date seems too old")
            
        except Exception as e:
            logger.error(f"Visit date validation error: {e}")
            errors.append("Invalid visit date")
        
        return errors
    
    @staticmethod
    def check_record_consistency(patient, medical_records_data: List[Dict]) -> List[str]:
        """Check consistency across multiple medical records for a patient."""
        errors = []
        
        if not medical_records_data:
            return errors
        
        # Check for duplicate visit dates
        visit_dates = []
        for record in medical_records_data:
            visit_date = record.get('visit_date')
            if visit_date in visit_dates:
                errors.append(f"Duplicate visit date found: {visit_date}")
            visit_dates.append(visit_date)
        
        # Check chronological order
        sorted_dates = sorted([record.get('visit_date') for record in medical_records_data])
        if visit_dates != sorted_dates:
            errors.append("Medical records should be in chronological order")
        
        # Check for suspicious patterns
        if len(medical_records_data) > 10:
            # Check for too many records in a short period
            recent_records = [r for r in medical_records_data 
                            if r.get('visit_date') and 
                            (datetime.date.today() - r['visit_date']).days <= 30]
            
            if len(recent_records) > 5:
                errors.append("Unusually high number of recent visits (possible data entry error)")
        
        return errors

class DataConsistencyChecker:
    """Check data consistency between User and Patient records."""
    
    @staticmethod
    def check_user_patient_consistency(user, patient_data: Dict) -> List[str]:
        """Check consistency between User and Patient data."""
        errors = []
        
        # Email consistency
        user_email = user.email.lower()
        patient_email = patient_data.get('email', '').lower()
        
        if patient_email and patient_email != user_email:
            # Allow different emails but warn
            logger.warning(f"Email mismatch: User({user_email}) vs Patient({patient_email})")
        
        # Name consistency (if user has names filled)
        if user.first_name and user.last_name:
            user_first = user.first_name.lower().strip()
            user_last = user.last_name.lower().strip()
            patient_first = patient_data.get('first_name', '').lower().strip()
            patient_last = patient_data.get('last_name', '').lower().strip()
            
            if user_first != patient_first:
                errors.append("First name mismatch between user and patient records")
            
            if user_last != patient_last:
                errors.append("Last name mismatch between user and patient records")
        
        # Role consistency
        if user.role != 'STUDENT' and patient_data:
            logger.warning(f"Non-student user {user.email} has patient record")
        
        return errors

# Validator instances
patient_validator = PatientDataValidator()
duplicate_detector = DuplicatePatientDetector()
record_validator = MedicalRecordValidator()
consistency_checker = DataConsistencyChecker() 