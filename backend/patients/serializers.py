from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation, DentalRecord
from authentication.validators import email_validator

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_usc_id = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'patient_name', 'patient_usc_id', 'visit_date', 'diagnosis', 'treatment', 'notes', 'vital_signs', 'physical_examination', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'patient_name', 'patient_usc_id']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def get_patient_usc_id(self, obj):
        """Get USC ID number from the related user"""
        return obj.patient.user.id_number if obj.patient.user and obj.patient.user.id_number else None

class DentalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    procedure_performed_display = serializers.CharField(source='get_procedure_performed_display', read_only=True)
    affected_teeth_display = serializers.CharField(source='get_affected_teeth_display', read_only=True)
    
    class Meta:
        model = DentalRecord
        fields = [
            'id', 'patient', 'patient_name', 'visit_date', 'procedure_performed', 
            'procedure_performed_display', 'tooth_numbers', 'affected_teeth_display',
            'diagnosis', 'treatment_performed', 'treatment_plan', 'oral_hygiene_status',
            'gum_condition', 'tooth_chart', 'clinical_notes', 'pain_level',
            'anesthesia_used', 'anesthesia_type', 'materials_used',
            'next_appointment_recommended', 'home_care_instructions', 'priority',
            'xray_images', 'photos', 'documents', 'cost', 'insurance_covered',
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'patient_name', 'procedure_performed_display', 'affected_teeth_display']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def validate_tooth_numbers(self, value):
        """Validate tooth numbers format"""
        if value:
            # Remove spaces and split by comma
            tooth_nums = [num.strip() for num in value.split(',') if num.strip()]
            for num in tooth_nums:
                try:
                    tooth_num = int(num)
                    if tooth_num < 11 or tooth_num > 48:
                        raise serializers.ValidationError(
                            f"Invalid tooth number: {num}. Must be between 11-48 (FDI notation)."
                        )
                except ValueError:
                    raise serializers.ValidationError(
                        f"Invalid tooth number format: {num}. Must be numeric."
                    )
        return value

    def validate_pain_level(self, value):
        """Validate pain level is between 1-10"""
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Pain level must be between 1 and 10.")
        return value

class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_usc_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'patient_name', 'patient_usc_id', 'date_time', 'chief_complaints', 'treatment_plan', 'remarks', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'patient_name', 'patient_usc_id']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def get_patient_usc_id(self, obj):
        """Get USC ID number from the related user"""
        return obj.patient.user.id_number if obj.patient.user and obj.patient.user.id_number else None

class PatientSerializer(serializers.ModelSerializer):
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    dental_records = DentalRecordSerializer(many=True, read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)
    
    # Fields from User model
    usc_id = serializers.ReadOnlyField(source='user.id_number')
    middle_name = serializers.ReadOnlyField(source='user.middle_name')
    course = serializers.ReadOnlyField(source='user.course')
    year_level = serializers.ReadOnlyField(source='user.year_level')
    school = serializers.ReadOnlyField(source='user.school')
    civil_status = serializers.ReadOnlyField(source='user.civil_status')
    nationality = serializers.ReadOnlyField(source='user.nationality')
    religion = serializers.ReadOnlyField(source='user.religion')
    address_permanent = serializers.ReadOnlyField(source='user.address_permanent')
    phone = serializers.ReadOnlyField(source='user.phone')
    weight = serializers.ReadOnlyField(source='user.weight')
    height = serializers.ReadOnlyField(source='user.height')
    bmi = serializers.ReadOnlyField(source='user.bmi')
    father_name = serializers.ReadOnlyField(source='user.father_name')
    mother_name = serializers.ReadOnlyField(source='user.mother_name')
    emergency_contact = serializers.ReadOnlyField(source='user.emergency_contact')
    emergency_contact_number = serializers.ReadOnlyField(source='user.emergency_contact_number')
    illness = serializers.ReadOnlyField(source='user.illness')
    childhood_diseases = serializers.ReadOnlyField(source='user.childhood_diseases')
    special_needs = serializers.ReadOnlyField(source='user.special_needs')
    existing_medical_condition = serializers.ReadOnlyField(source='user.existing_medical_condition')
    medications = serializers.ReadOnlyField(source='user.medications')
    allergies = serializers.ReadOnlyField(source='user.allergies')
    hospitalization_history = serializers.ReadOnlyField(source='user.hospitalization_history')
    surgical_procedures = serializers.ReadOnlyField(source='user.surgical_procedures')

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'usc_id', 'first_name', 'middle_name', 'last_name', 
            'date_of_birth', 'gender', 'email', 'phone_number', 'address',
            'course', 'year_level', 'school', 'civil_status', 'nationality', 
            'religion', 'address_permanent', 'phone', 'weight', 'height', 'bmi',
            'father_name', 'mother_name', 'emergency_contact', 'emergency_contact_number',
            'illness', 'childhood_diseases', 'special_needs', 'existing_medical_condition',
            'medications', 'allergies', 'hospitalization_history', 'surgical_procedures',
            'created_at', 'updated_at', 'medical_records', 'dental_records', 'consultations'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_email(self, value):
        """Validate email with USC domain requirement."""
        if not value:
            raise serializers.ValidationError("Email is required")
        
        # Use enhanced email validator
        error_message = email_validator(value)
        if error_message:
            raise serializers.ValidationError(error_message)
        
        return value.lower().strip() 