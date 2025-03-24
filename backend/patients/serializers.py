from rest_framework import serializers
from .models import Patient, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'visit_date', 'diagnosis', 'treatment', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class PatientSerializer(serializers.ModelSerializer):
    medical_records = MedicalRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'email', 'phone_number', 'address',
            'created_at', 'updated_at', 'medical_records'
        ]
        read_only_fields = ['created_at', 'updated_at'] 