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
from authentication.tasks import log_activity_task
from authentication.middleware import get_current_ip, get_current_user_agent


def get_certificate_status(certificate):
    """Get certificate issuance status."""
    return certificate.issuance_status


def set_certificate_status(certificate, status_value):
    """Set certificate issuance status."""
    certificate.issuance_status = status_value

# Create your views here.

class IsStaffOrMedicalPersonnel(permissions.BasePermission):
    """
    Permission to only allow staff with authority to manage templates/certs.
    Doctors have exclusive issuance power; Nurses and Staff can only draft/view.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Clinical staff roles
        staff_roles = ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN', 'DENTIST']
        
        # All authenticated users can view (students/faculty see only their own via queryset)
        if request.method in permissions.SAFE_METHODS:
            return True
                   
        # Only staff can create (perform_create handles role-based logic)
        if request.method == 'POST':
            return getattr(request.user, 'role', '') in staff_roles
                   
        # Only Doctor and Admin can Edit/Delete certificates or templates
        return request.user.is_staff or \
               getattr(request.user, 'role', '') in ['DOCTOR', 'ADMIN']

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]
    pagination_class = None

class MedicalCertificateViewSet(viewsets.ModelViewSet):
    queryset = MedicalCertificate.objects.all()
    serializer_class = MedicalCertificateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # If student or faculty, only show their own certificates
        if hasattr(user, 'role') and user.role in ['STUDENT', 'FACULTY']:
            try:
                from patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except Exception:
                queryset = queryset.none()
        
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
            
        status_param = self.request.query_params.get('status', None) or self.request.query_params.get('issuance_status', None)
        if status_param:
            queryset = queryset.filter(issuance_status=status_param)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        staff_roles = ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN', 'DENTIST']
        
        if not (user.is_staff or user.role in staff_roles):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Insufficient permissions to create medical certificates.")

        status_to_set = 'draft' if user.role in ['STAFF', 'NURSE'] else 'pending'
        extra_data = {
            'created_by': user,
            'issuance_status': status_to_set
        }

        instance = serializer.save(**extra_data)
        
        # Audit Log: Certificate Created
        try:
            log_activity_task.delay(
                user.id, 'CERTIFICATE_CREATED', 'MedicalCertificate', instance.id,
                {'status': instance.issuance_status, 'patient': str(instance.patient)},
                get_current_ip(), get_current_user_agent()
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log certificate creation: {e}")

        if instance.issuance_status == 'pending':
            instance.submitted_at = timezone.now()
            instance.save()
            try:
                EmailService.send_medical_certificate_notification(instance, 'created')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send certificate creation email: {e}")

    def _get_certificate_context(self, certificate):
        """Consolidated context builder for certificate rendering."""
        from patients.utils import calculate_age
        from utils.usc_mappings import get_program_name, get_year_level_name
        
        patient = certificate.patient
        age = calculate_age(patient.date_of_birth) if patient.date_of_birth else 'N/A'
        
        course_and_year = "N/A"
        if patient.user:
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

        return {
            'patient_name': f"{patient.first_name} {patient.last_name}",
            'patient_age': age,
            'patient': patient,
            'course_and_year': course_and_year,
            'date': certificate.created_at.strftime('%B %d, %Y'),
            'visit_date': certificate.created_at.strftime('%B %d, %Y'),
            'diagnosis': certificate.diagnosis,
            'requirement_reason': certificate.diagnosis,
            'recommendations': certificate.recommendations,
            'valid_from': certificate.valid_from.strftime('%B %d, %Y') if certificate.valid_from else '',
            'valid_until': certificate.valid_until.strftime('%B %d, %Y') if certificate.valid_until else '',
            'additional_notes': certificate.additional_notes,
            'fitness_status': certificate.get_fitness_status_display(),
            'fitness_reason': certificate.fitness_reason,
            'is_fit': certificate.fitness_status == 'physically_fit',
            'is_not_fit': certificate.fitness_status == 'physically_unfit',
            'doctor_name': f"{certificate.issuing_doctor.get_full_name()}" if certificate.issuing_doctor else 'Clinic Physician',
            'doctor_title': getattr(certificate.issuing_doctor, 'title', 'University Physician') if certificate.issuing_doctor else 'University Physician',
            'doctor_license': getattr(certificate.issuing_doctor, 'license_number', 'N/A') if certificate.issuing_doctor else 'N/A',
            'STATIC_URL': '/static/',
        }

    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        """Exclusive authority for Doctor role to issue certificates."""
        certificate = self.get_object()
        
        if get_certificate_status(certificate) not in ['pending', 'draft']:
            return Response(
                {'detail': 'Only pending or draft certificates can be issued.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.role == 'DOCTOR' or request.user.is_superuser):
            return Response(
                {'detail': 'Crucially, only the Doctor role holds the exclusive authority to issue medical certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        set_certificate_status(certificate, 'issued')
        certificate.issuing_doctor = request.user
        certificate.issued_at = timezone.now()
        certificate.save()

        # Audit Log: Certificate Issued
        try:
            log_activity_task.delay(
                request.user.id, 'CERTIFICATE_ISSUED', 'MedicalCertificate', certificate.id,
                {'status': 'issued', 'doctor': request.user.get_full_name()},
                get_current_ip(), get_current_user_agent()
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log certificate issuance: {e}")

        try:
            EmailService.send_medical_certificate_notification(certificate, 'approved')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send certificate issuance email: {e}")
        
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
        certificate.issuing_doctor = request.user
        certificate.issued_at = timezone.now()
        certificate.save()

        # Audit Log: Certificate Rejected
        try:
            log_activity_task.delay(
                request.user.id, 'CERTIFICATE_REJECTED', 'MedicalCertificate', certificate.id,
                {'status': 'rejected', 'doctor': request.user.get_full_name()},
                get_current_ip(), get_current_user_agent()
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log certificate rejection: {e}")

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
        """Nurses and Staff submit certificates for Doctor review."""
        certificate = self.get_object()
        
        if get_certificate_status(certificate) != 'draft':
            return Response(
                {'detail': 'Only draft certificates can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        set_certificate_status(certificate, 'pending')
        certificate.submitted_at = timezone.now()
        certificate.save()

        # Audit Log: Certificate Submitted
        try:
            log_activity_task.delay(
                request.user.id, 'CERTIFICATE_SUBMITTED', 'MedicalCertificate', certificate.id,
                {'status': 'pending', 'submitted_by': request.user.get_full_name()},
                get_current_ip(), get_current_user_agent()
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log certificate submission: {e}")

        try:
            EmailService.send_medical_certificate_notification(certificate, 'created')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send certificate submission email: {e}")
        
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

        fitness_status = request.data.get('fitness_status')
        fitness_reason = request.data.get('fitness_reason', '')
        
        if not fitness_status or fitness_status not in ['physically_fit', 'physically_unfit']:
            return Response(
                {'detail': 'Valid fitness_status (physically_fit/physically_unfit) is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        certificate.fitness_status = fitness_status
        certificate.fitness_reason = fitness_reason
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def render_pdf(self, request, pk=None):
        certificate = self.get_object()
        context = self._get_certificate_context(certificate)
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

    @action(detail=True, methods=['get'])
    def render(self, request, pk=None):
        certificate = self.get_object()
        template_content = certificate.template.content
        context = self._get_certificate_context(certificate)
        try:
            template = Template(template_content)
            rendered_html = template.render(Context(context))
            return Response({'html': rendered_html})
        except Exception as e:
            return Response(
                {'error': f'Error rendering certificate: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_staff or user.role in ['ADMIN', 'DOCTOR']):
            return Response(
                {'detail': 'You do not have permission to delete medical certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
