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

class MedicalCertificateViewSet(viewsets.ModelViewSet):
    queryset = MedicalCertificate.objects.all()
    serializer_class = MedicalCertificateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by patient if specified
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        # Filter by status if specified
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            issued_by=self.request.user,
            issued_at=timezone.now() if serializer.validated_data.get('status') == 'pending' else None
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
            'doctor_name': f"Dr. {certificate.issued_by.get_full_name()}",
            'doctor_title': certificate.issued_by.title or 'University Physician',
            'doctor_license': certificate.issued_by.license_number or 'N/A',
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
        
        if certificate.status != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.is_staff or request.user.role == 'DOCTOR'):
            return Response(
                {'detail': 'Only doctors can approve certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        certificate.status = 'approved'
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        certificate = self.get_object()
        
        if certificate.status != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.is_staff or request.user.role == 'DOCTOR'):
            return Response(
                {'detail': 'Only doctors can reject certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        certificate.status = 'rejected'
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        certificate = self.get_object()
        
        if certificate.status != 'draft':
            return Response(
                {'detail': 'Only draft certificates can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = 'pending'
        certificate.issued_at = timezone.now()
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
