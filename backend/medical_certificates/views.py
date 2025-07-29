from django.shortcuts import render
from django.utils import timezone
from django.template import Template, Context
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalCertificate, CertificateTemplate
from .serializers import MedicalCertificateSerializer, CertificateTemplateSerializer
from xhtml2pdf import pisa
from io import BytesIO
from django.http import HttpResponse
from datetime import date
from rest_framework.permissions import IsAuthenticated


def get_certificate_status(certificate, field='approval_status'):
    """Get certificate status with backward compatibility"""
    if hasattr(certificate, 'approval_status'):
        return getattr(certificate, field) if field == 'approval_status' else certificate.approval_status
    elif hasattr(certificate, 'status'):
        return certificate.status
    return 'draft'


def set_certificate_status(certificate, status_value):
    """Set certificate status with backward compatibility"""
    if hasattr(certificate, 'approval_status'):
        certificate.approval_status = status_value
    elif hasattr(certificate, 'status'):
        certificate.status = status_value

# Create your views here.

class IsStaffOrMedicalPersonnel(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role in ['DOCTOR', 'NURSE', 'STAFF']
        )

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]
    pagination_class = None  # Disable pagination to return data as array

class MedicalCertificateViewSet(viewsets.ModelViewSet):
    queryset = MedicalCertificate.objects.all()
    serializer_class = MedicalCertificateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        # If student, only show their own certificates
        if hasattr(user, 'role') and user.role == 'STUDENT':
            # Find the patient profile linked to the student user
            try:
                patient = user.patient_profile
                queryset = queryset.filter(patient=patient)
            except Exception:
                queryset = queryset.none()
        # Staff, doctor, nurse, admin see all certificates
        # Optionally, filter by patient or status if provided
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        # Support both old 'status' and new 'approval_status' parameters for backward compatibility
        status_param = self.request.query_params.get('status', None) or self.request.query_params.get('approval_status', None)
        if status_param:
            # Check which field exists in the model
            model_fields = [field.name for field in MedicalCertificate._meta.get_fields()]
            if 'approval_status' in model_fields:
                queryset = queryset.filter(approval_status=status_param)
            elif 'status' in model_fields:
                queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        # Auto-submit certificates for approval when created by admin/staff
        # Only doctors can set fitness status, others create pending certificates
        user = self.request.user
        
        # Check which status field exists
        model_fields = [field.name for field in MedicalCertificate._meta.get_fields()]
        
        if user.role == 'DOCTOR':
            # Doctors can create and immediately assess fitness
            serializer.save(
                issued_by=user,
                issued_at=timezone.now()
            )
        else:
            # Admin/Staff create certificates that need doctor approval
            certificate_data = serializer.validated_data.copy()
            
            # Set default fitness status for non-doctors
            if 'fitness_status' in model_fields:
                certificate_data['fitness_status'] = 'fit'  # Default, doctor will assess
            
            # Set approval status to pending
            if 'approval_status' in model_fields:
                certificate_data['approval_status'] = 'pending'
            elif 'status' in model_fields:
                certificate_data['status'] = 'pending'
            
            serializer.save(
                issued_by=user,
                issued_at=timezone.now(),
                **certificate_data
            )

    @action(detail=True, methods=['get'])
    def render(self, request, pk=None):
        certificate = self.get_object()
        
        # Get the template content
        template_content = certificate.template.content
        
        # Create context for template rendering
        context = {
            'patient_name': f"{certificate.patient.first_name} {certificate.patient.last_name}",
            'patient_age': certificate.patient.age,
            'patient': certificate.patient,
            'visit_date': certificate.created_at.strftime('%B %d, %Y'),
            'diagnosis': certificate.diagnosis,
            'recommendations': certificate.recommendations,
            'valid_from': certificate.valid_from.strftime('%B %d, %Y'),
            'valid_until': certificate.valid_until.strftime('%B %d, %Y'),
            'additional_notes': certificate.additional_notes,
            # New fitness status fields (with backward compatibility)
            'fitness_status': getattr(certificate, 'get_fitness_status_display', lambda: 'Fit')(),
            'fitness_reason': getattr(certificate, 'fitness_reason', ''),
            'is_fit': getattr(certificate, 'fitness_status', 'fit') == 'fit',
            'is_not_fit': getattr(certificate, 'fitness_status', 'fit') == 'not_fit',
            'doctor_name': f"Dr. {certificate.issued_by.get_full_name()}",
            'doctor_title': getattr(certificate.issued_by, 'title', None) or 'University Physician',
            'doctor_license': getattr(certificate.issued_by, 'license_number', None) or 'N/A',
            'STATIC_URL': '/static/',
        }
        
        # Render the template
        try:
            template = Template(template_content)
            rendered_html = template.render(Context(context))
            return Response({'html': rendered_html})
        except Exception as e:
            return Response(
                {'error': f'Error rendering certificate: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        certificate = self.get_object()
        
        if get_certificate_status(certificate) != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.user.role == 'DOCTOR':
            return Response(
                {'detail': 'Only doctors can approve certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        set_certificate_status(certificate, 'approved')
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        certificate = self.get_object()
        
        if get_certificate_status(certificate) != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.user.role == 'DOCTOR':
            return Response(
                {'detail': 'Only doctors can reject certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        set_certificate_status(certificate, 'rejected')
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        certificate = self.get_object()
        
        if get_certificate_status(certificate) != 'draft':
            return Response(
                {'detail': 'Only draft certificates can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        set_certificate_status(certificate, 'pending')
        certificate.issued_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assess_fitness(self, request, pk=None):
        """Allow doctors to assess fitness and approve/reject certificates"""
        certificate = self.get_object()
        
        if not request.user.role == 'DOCTOR':
            return Response(
                {'detail': 'Only doctors can assess fitness status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get fitness assessment data
        fitness_status = request.data.get('fitness_status')
        fitness_reason = request.data.get('fitness_reason', '')
        
        if not fitness_status or fitness_status not in ['fit', 'not_fit']:
            return Response(
                {'detail': 'Valid fitness_status (fit/not_fit) is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate fitness reason for not_fit status
        if fitness_status == 'not_fit' and not fitness_reason.strip():
            return Response(
                {'detail': 'Fitness reason is required when status is "not_fit".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update certificate with doctor's assessment
        model_fields = [field.name for field in MedicalCertificate._meta.get_fields()]
        
        if 'fitness_status' in model_fields:
            certificate.fitness_status = fitness_status
            certificate.fitness_reason = fitness_reason
        
        # Set approval status based on fitness assessment
        if 'approval_status' in model_fields:
            certificate.approval_status = 'approved'
        elif 'status' in model_fields:
            certificate.status = 'approved'
            
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def render_pdf(self, request, pk=None):
        certificate = self.get_object()
        patient = certificate.patient
        # Calculate age from date_of_birth
        age = ''
        if hasattr(patient, 'date_of_birth') and patient.date_of_birth:
            age = calculate_age(patient.date_of_birth)
        # Prepare context
        context = {
            'patient_name': f"{patient.first_name} {patient.last_name}",
            'patient_age': age,
            'patient': patient,
            'visit_date': certificate.created_at.strftime('%B %d, %Y'),
            'diagnosis': certificate.diagnosis,
            'recommendations': certificate.recommendations,
            'valid_from': certificate.valid_from.strftime('%B %d, %Y'),
            'valid_until': certificate.valid_until.strftime('%B %d, %Y'),
            'additional_notes': certificate.additional_notes,
            'doctor_name': f"Dr. {certificate.issued_by.get_full_name()}",
            'doctor_title': getattr(certificate.issued_by, 'title', 'University Physician'),
            'doctor_license': getattr(certificate.issued_by, 'license_number', 'N/A'),
            'STATIC_URL': '/static/',
        }
        template_content = certificate.template.content
        template = Template(template_content)
        rendered_html = template.render(Context(context))
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(rendered_html.encode("UTF-8")), result)
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="medical_certificate_{certificate.id}.pdf"'
            return response
        else:
            return HttpResponse('Error generating PDF', status=500)

# Helper function to calculate age from date_of_birth

def calculate_age(born):
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
