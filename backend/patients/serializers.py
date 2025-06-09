from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation
from authentication.validators import email_validator

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'patient_name', 'visit_date', 'diagnosis', 'treatment', 'notes', 
                 'vital_signs', 'physical_examination', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'patient_name']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ""

class ConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'date_time', 'chief_complaints', 'treatment_plan', 
                 'remarks', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class PatientSerializer(serializers.ModelSerializer):
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'email', 'phone_number', 'address',
            'created_at', 'updated_at', 'medical_records', 'consultations'
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