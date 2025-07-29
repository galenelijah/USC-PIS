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
    issued_by_name = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    # Updated to use new field names with backward compatibility
    fitness_status_display = serializers.SerializerMethodField()
    approval_status_display = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    def get_fitness_status_display(self, obj):
        """Get fitness status display with backward compatibility"""
        if hasattr(obj, 'fitness_status'):
            return obj.get_fitness_status_display()
        return 'Fit'  # Default for backward compatibility
    
    def get_approval_status_display(self, obj):
        """Get approval status display with backward compatibility"""
        if hasattr(obj, 'approval_status'):
            return obj.get_approval_status_display()
        elif hasattr(obj, 'status'):
            # Fallback to old status field
            return dict(obj.STATUS_CHOICES).get(obj.status, obj.status)
        return 'Draft'  # Default for backward compatibility

    def get_field_names(self, declared_fields, info):
        """Dynamically include fields based on what exists in the model"""
        base_fields = [
            'id', 'patient', 'patient_details', 'template', 'template_name',
            'diagnosis', 'recommendations', 'valid_from', 'valid_until',
            'additional_notes', 'issued_by', 'issued_by_name', 
            'approved_by', 'approved_by_name', 'created_at', 'updated_at', 
            'issued_at', 'approved_at'
        ]
        
        # Add display fields (these are always available via SerializerMethodField)
        base_fields.extend(['fitness_status_display', 'approval_status_display'])
        
        # Add new fields if they exist in the model
        model_fields = [field.name for field in self.Meta.model._meta.get_fields()]
        
        if 'fitness_status' in model_fields:
            base_fields.extend(['fitness_status', 'fitness_reason'])
        
        if 'approval_status' in model_fields:
            base_fields.append('approval_status')
        elif 'status' in model_fields:
            # Fallback to old status field
            base_fields.append('status')
            
        return base_fields

    class Meta:
        model = MedicalCertificate
        fields = '__all__'  # Will be overridden by get_field_names
        read_only_fields = [
            'issued_by', 'approved_by', 'created_at', 'updated_at',
            'issued_at', 'approved_at'
        ]

    def to_internal_value(self, data):
        # Parse valid_from and valid_until with flexible formats
        for field in ['valid_from', 'valid_until']:
            value = data.get(field)
            if value and not isinstance(value, date):
                try:
                    # Try to parse using dateutil
                    parsed = date_parser.parse(value).date()
                    data[field] = parsed.isoformat()
                except Exception:
                    pass  # Let DRF handle the error if parsing fails
        return super().to_internal_value(data)

    def validate(self, data):
        # Validate date range
        if data.get('valid_until') and data.get('valid_from'):
            if data['valid_until'] < data['valid_from']:
                raise serializers.ValidationError({
                    'valid_until': 'End date must be after start date.'
                })
        
        # Validate fitness reason requirement (only if fitness_status field exists)
        model_fields = [field.name for field in self.Meta.model._meta.get_fields()]
        if 'fitness_status' in model_fields:
            if data.get('fitness_status') == 'not_fit' and not data.get('fitness_reason'):
                raise serializers.ValidationError({
                    'fitness_reason': 'Reason is required when fitness status is "Not Fit".'
                })
            
        return data 