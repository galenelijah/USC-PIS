from django.shortcuts import render
from django.utils import timezone
from django.template import Template, Context
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalCertificate, CertificateTemplate
from .serializers import MedicalCertificateSerializer, CertificateTemplateSerializer
from utils.email_service import EmailService
try:
    from xhtml2pdf import pisa
except ImportError:
    pisa = None
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
    """
    Permission to only allow staff with authority to manage templates/certs.
    Doctors have exclusive approval power; Nurses and Staff can only draft/view.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Clinical staff roles
        staff_roles = ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN', 'DENTIST']
        
        # All staff can view
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_staff or \
                   getattr(request.user, 'role', '') in staff_roles or \
                   getattr(request.user, 'role', '') in ['STUDENT', 'FACULTY']
                   
        # All staff can create (perform_create handles role-based logic)
        if request.method == 'POST':
            if getattr(request.user, 'role', '') in staff_roles:
                return True
            # Allow students to POST to detail actions (so get_object can handle 404)
            # but they remain blocked from 'create' action.
            return getattr(request.user, 'role', '') in ['STUDENT', 'FACULTY'] and \
                   getattr(view, 'action', '') != 'create'
                   
        # Only Doctor and Admin can Edit/Delete certificates or templates
        return request.user.is_staff or \
               getattr(request.user, 'role', '') in ['DOCTOR', 'ADMIN']

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]
    pagination_class = None  # Disable pagination to return data as array

class MedicalCertificateViewSet(viewsets.ModelViewSet):
    queryset = MedicalCertificate.objects.all()
    serializer_class = MedicalCertificateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # If student, only show their own certificates
        if hasattr(user, 'role') and user.role in ['STUDENT', 'FACULTY']:
            # Find the patient profile linked to the student user
            try:
                # Some models might use 'patient' or 'patient_profile'
                if hasattr(user, 'patient'):
                    patient = user.patient
                elif hasattr(user, 'patient_profile'):
                    patient = user.patient_profile
                else:
                    # Fallback to direct query
                    from patients.models import Patient
                    patient = Patient.objects.get(user=user)
                
                queryset = queryset.filter(patient=patient)
            except Exception:
                queryset = queryset.none()
        
        # Staff, doctor, nurse, admin, dentist see all certificates or filtered by patient
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
        # Admin, Doctor, Nurse, Dentist, and Staff can create certificates
        user = self.request.user
        allowed_roles = ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN', 'DENTIST']
        if not (user.is_staff or user.role in allowed_roles):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Insufficient permissions to create medical certificates.")

        # Certificates created by non-doctors are set to 'pending' by default
        # Check which status field exists
        model_fields = [field.name for field in MedicalCertificate._meta.get_fields()]
        
        status_to_set = 'draft' if user.role in ['STAFF', 'NURSE'] else 'pending'
        
        extra_data = {
            'issued_by': user,
            'issued_at': timezone.now()
        }
        
        if 'approval_status' in model_fields:
            extra_data['approval_status'] = status_to_set
        elif 'status' in model_fields:
            extra_data['status'] = status_to_set

        serializer.save(**extra_data)
        
        # Send email notification for certificate creation
        try:
            certificate = serializer.instance
            EmailService.send_medical_certificate_notification(certificate, 'created')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send certificate creation email: {e}")

    @action(detail=True, methods=['get'])
    def render(self, request, pk=None):
        certificate = self.get_object()
        
        # Get the template content
        template_content = certificate.template.content
        
        # Create context for template rendering
        from patients.utils import calculate_age
        age = calculate_age(certificate.patient.date_of_birth) if certificate.patient.date_of_birth else 'N/A'
        
        context = {
            'patient_name': f"{certificate.patient.first_name} {certificate.patient.last_name}",
            'patient_age': age,
            'patient': certificate.patient,
            'visit_date': certificate.created_at.strftime('%B %d, %Y'),
            'diagnosis': certificate.diagnosis,
            'recommendations': certificate.recommendations,
            'valid_from': certificate.valid_from.strftime('%B %d, %Y') if certificate.valid_from else '',
            'valid_until': certificate.valid_until.strftime('%B %d, %Y') if certificate.valid_until else '',
            'additional_notes': certificate.additional_notes,
            # New fitness status fields (with backward compatibility)
            'fitness_status': getattr(certificate, 'get_fitness_status_display', lambda: 'Fit')(),
            'fitness_reason': getattr(certificate, 'fitness_reason', ''),
            'is_fit': getattr(certificate, 'fitness_status', 'fit') == 'fit',
            'is_not_fit': getattr(certificate, 'fitness_status', 'fit') == 'not_fit',
            'doctor_name': f"{certificate.issued_by.get_full_name()}" if certificate.issued_by else 'Clinic Physician',
            'doctor_title': getattr(certificate.issued_by, 'title', None) or 'University Personnel',
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
        """Exclusive authority for Doctor role to approve certificates."""
        certificate = self.get_object()
        
        if get_certificate_status(certificate) not in ['pending', 'draft']:
            return Response(
                {'detail': 'Only pending or draft certificates can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.role == 'DOCTOR' or request.user.is_superuser):
            return Response(
                {'detail': 'Crucially, only the Doctor role holds the exclusive authority to approve medical certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        set_certificate_status(certificate, 'approved')
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        # Send approval email notification
        try:
            EmailService.send_medical_certificate_notification(certificate, 'approved')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send certificate approval email: {e}")
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Exclusive authority for Doctor role to reject certificates."""
        certificate = self.get_object()
        
        if get_certificate_status(certificate) not in ['pending', 'draft']:
            return Response(
                {'detail': 'Only pending or draft certificates can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.role == 'DOCTOR' or request.user.is_superuser):
            return Response(
                {'detail': 'Crucially, only the Doctor role holds the exclusive authority to reject medical certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        set_certificate_status(certificate, 'rejected')
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        # Send rejection email notification
        try:
            EmailService.send_medical_certificate_notification(certificate, 'rejected')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send certificate rejection email: {e}")
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Nurses and Staff submit certificates for Doctor approval."""
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
        """Allow doctors to assess fitness status."""
        certificate = self.get_object()
        
        if not (request.user.role == 'DOCTOR' or request.user.is_superuser):
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
        
        # Update certificate
        model_fields = [field.name for field in MedicalCertificate._meta.get_fields()]
        if 'fitness_status' in model_fields:
            certificate.fitness_status = fitness_status
            certificate.fitness_reason = fitness_reason
            
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def render_pdf(self, request, pk=None):
        certificate = self.get_object()
        patient = certificate.patient
        # Calculate age
        from patients.utils import calculate_age
        age = calculate_age(patient.date_of_birth) if patient.date_of_birth else 'N/A'
        
        # Prepare context
        from utils.usc_mappings import get_program_name, get_year_level_name
        
        course_and_year = "N/A"
        if hasattr(patient, 'user'):
            course_id = getattr(patient.user, 'course', '')
            year_id = getattr(patient.user, 'year_level', '')
            
            course_name = get_program_name(course_id)
            year_name = get_year_level_name(year_id)
            
            if course_name and year_name:
                course_and_year = f"{course_name} - {year_name}"
            elif course_name:
                course_and_year = course_name
            elif year_name:
                course_and_year = year_name

        context = {
            'patient_name': f"{patient.first_name} {patient.last_name}",
            'patient_age': age,
            'patient': patient,
            'course_and_year': course_and_year,
            'date': certificate.created_at.strftime('%B %d, %Y'),
            'visit_date': certificate.created_at.strftime('%B %d, %Y'),
            'diagnosis': certificate.diagnosis,
            'recommendations': certificate.recommendations,
            'valid_from': certificate.valid_from.strftime('%B %d, %Y') if certificate.valid_from else '',
            'valid_until': certificate.valid_until.strftime('%B %d, %Y') if certificate.valid_until else '',
            'additional_notes': certificate.additional_notes,
            'is_fit': getattr(certificate, 'fitness_status', 'fit') == 'fit',
            'is_not_fit': getattr(certificate, 'fitness_status', 'fit') == 'not_fit',
            'doctor_name': f"{certificate.issued_by.get_full_name()}" if certificate.issued_by else 'Clinic Physician',
            'doctor_title': getattr(certificate.issued_by, 'title', 'University Physician'),
            'doctor_license': getattr(certificate.issued_by, 'license_number', 'N/A'),
            'STATIC_URL': '/static/',
        }
        template_content = certificate.template.content or "<p>Certificate</p>"
        template = Template(template_content)
        rendered_html = template.render(Context(context))
        
        if not pisa:
            return HttpResponse('PDF Generation Service Unavailable', status=503)

        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(rendered_html.encode("UTF-8")), result)
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="medical_certificate_{certificate.id}.pdf"'
            return response
        else:
            return HttpResponse('Error generating PDF', status=500)

    def destroy(self, request, *args, **kwargs):
        """Only allow Admins and Doctors to delete medical certificates."""
        user = request.user
        if not (user.is_staff or user.role in ['ADMIN', 'DOCTOR']):
            return Response(
                {'detail': 'You do not have permission to delete medical certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
