from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'visit_date', 'diagnosis', 'treatment', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

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