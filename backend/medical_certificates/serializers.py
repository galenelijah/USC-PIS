from rest_framework import serializers
from .models import MedicalCertificate, CertificateTemplate
from patients.serializers import PatientSerializer
from dateutil import parser as date_parser
from datetime import date

class CertificateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateTemplate
        fields = ['id', 'name', 'description', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class MedicalCertificateSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    issuing_doctor_name = serializers.CharField(source='issuing_doctor.get_full_name', read_only=True)

    fitness_status_display = serializers.SerializerMethodField()
    issuance_status_display = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True)

    def get_fitness_status_display(self, obj):
        return obj.get_fitness_status_display()

    def get_issuance_status_display(self, obj):
        return obj.get_issuance_status_display()

    class Meta:
        model = MedicalCertificate
        fields = [
            'id', 'patient', 'patient_details', 'template', 'template_name',
            'diagnosis', 'recommendations', 'valid_from', 'valid_until',
            'additional_notes', 'fitness_status', 'fitness_reason', 
            'issuance_status', 'created_by', 'created_by_name', 
            'issuing_doctor', 'issuing_doctor_name', 'created_at', 
            'updated_at', 'submitted_at', 'issued_at',
            'fitness_status_display', 'issuance_status_display'
        ]
        read_only_fields = [
            'created_by', 'issuing_doctor', 'created_at', 'updated_at',
            'submitted_at', 'issued_at', 'issuance_status'
        ]

    def to_internal_value(self, data):
        # Parse valid_from and valid_until with flexible formats
        for field in ['valid_from', 'valid_until']:
            value = data.get(field)
            if value and not isinstance(value, date):
                try:
                    parsed = date_parser.parse(value).date()
                    data[field] = parsed.isoformat()
                except Exception:
                    pass
        return super().to_internal_value(data)

    def validate(self, data):
        # 2. Permanent State Locking for Rejected Certificates
        if self.instance and self.instance.issuance_status == 'rejected':
            raise serializers.ValidationError("This medical certificate has been rejected and cannot be modified.")

        # 5. Date Trapping and Validation
        # Do not allow future dates for birthdays
        if data.get('patient'):
            patient = data['patient']
            if patient.date_of_birth and patient.date_of_birth > date.today():
                raise serializers.ValidationError({'patient': "Patient's date of birth cannot be in the future."})

        # Ensure valid_from does not precede consultation date
        # consultation_date is proxied by created_at.date() for existing, today() for new.
        consultation_date = self.instance.created_at.date() if self.instance else date.today()
        if data.get('valid_from') and data['valid_from'] < consultation_date:
            raise serializers.ValidationError({
                'valid_from': f"Valid from date ({data['valid_from']}) cannot precede the consultation date ({consultation_date})."
            })

        # Validate date range
        if data.get('valid_until') and data.get('valid_from'):
            if data['valid_until'] < data['valid_from']:
                raise serializers.ValidationError({
                    'valid_until': 'End date must be after start date.'
                })

        # 3. Exclusive Medical Clearance Status
        # Handled by Model choices (physically_fit vs physically_unfit)
        # Validate fitness reason requirement
        if data.get('fitness_status') == 'physically_unfit' and not data.get('fitness_reason'):
            raise serializers.ValidationError({
                'fitness_reason': 'Reason is required when fitness status is "Physically Unfit".'
            })

        return data 
 