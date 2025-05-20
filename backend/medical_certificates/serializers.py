from rest_framework import serializers
from .models import MedicalCertificate, CertificateTemplate
from patients.serializers import PatientSerializer

class CertificateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateTemplate
        fields = ['id', 'name', 'description', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class MedicalCertificateSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = MedicalCertificate
        fields = [
            'id', 'patient', 'patient_details', 'template', 'template_name',
            'diagnosis', 'recommendations', 'valid_from', 'valid_until',
            'additional_notes', 'status', 'status_display',
            'issued_by', 'issued_by_name', 'approved_by', 'approved_by_name',
            'created_at', 'updated_at', 'issued_at', 'approved_at'
        ]
        read_only_fields = [
            'issued_by', 'approved_by', 'created_at', 'updated_at',
            'issued_at', 'approved_at'
        ]

    def validate(self, data):
        if data.get('valid_until') and data.get('valid_from'):
            if data['valid_until'] < data['valid_from']:
                raise serializers.ValidationError({
                    'valid_until': 'End date must be after start date.'
                })
        return data 