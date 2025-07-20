from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation, DentalRecord
from authentication.validators import email_validator

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'visit_date', 'diagnosis', 'treatment', 'notes', 'vital_signs', 'physical_examination', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by']

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
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'date_time', 'chief_complaints', 'treatment_plan', 'remarks', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by']

class PatientSerializer(serializers.ModelSerializer):
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    dental_records = DentalRecordSerializer(many=True, read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)
    usc_id = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'usc_id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'email', 'phone_number', 'address',
            'created_at', 'updated_at', 'medical_records', 'dental_records', 'consultations'
        ]
        read_only_fields = ['created_at', 'updated_at', 'usc_id']
    
    def get_usc_id(self, obj):
        """Get USC ID number from the related user"""
        return obj.user.id_number if obj.user and obj.user.id_number else None
    
    def validate_email(self, value):
        """Validate email with USC domain requirement."""
        if not value:
            raise serializers.ValidationError("Email is required")
        
        # Use enhanced email validator
        error_message = email_validator(value)
        if error_message:
            raise serializers.ValidationError(error_message)
        
        return value.lower().strip() 