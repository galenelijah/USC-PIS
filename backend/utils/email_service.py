"""
Email service utilities for USC-PIS
Handles email templates, sending, and notifications
"""
from django.core.mail import send_mail, EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Centralized email service for USC-PIS"""
    
    @staticmethod
    def send_template_email(template_name, context, recipient_email, subject, from_email=None):
        """
        Send an email using a template with USC-PIS branding
        """
        try:
            # Check global master switch
            from notifications.models import GlobalEmailSettings
            if not GlobalEmailSettings.get_settings().is_emails_enabled:
                # Bypass global switch for critical security emails if needed
                # but following the "Master Switch" requirement strictly here
                if template_name not in ['verification_code', 'password_reset']:
                    logger.info(f"Email system globally disabled. Skipping email to {recipient_email}: {subject}")
                    return False
                else:
                    logger.info(f"Bypassing global switch for security email: {template_name}")

            if from_email is None:
                from_email = settings.DEFAULT_FROM_EMAIL
            
            # Ensure support_email and site_url are in context
            if 'support_email' not in context:
                context['support_email'] = settings.SUPPORT_EMAIL
            if 'site_url' not in context:
                context['site_url'] = settings.SITE_URL
            
            # FORCE GMAIL API BACKEND (Now handled globally in settings, but keeping for clarity)
            logger.info(f"EMAIL_DEBUG: Sending via {settings.EMAIL_BACKEND}")
            
            # Create professional USC-PIS display name
            usc_display_name = f"USC Patient Information System <{from_email}>"
            
            # Render HTML template
            html_content = render_to_string(f'emails/{template_name}.html', context)
            
            # Create plain text version
            text_content = strip_tags(html_content)
            
            # Create email message
            msg = EmailMultiAlternatives(
                subject=f"[USC-PIS] {subject}",
                body=text_content,
                from_email=from_email,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            # Add USC branding in headers
            msg.extra_headers = {
                'Reply-To': f"USC-PIS <{from_email}>",
                'X-Mailer': 'USC Patient Information System',
                'X-Priority': '3',
                'Organization': 'University of San Carlos'
            }
            
            # Send email
            result = msg.send()
            
            if result:
                logger.info(f"Email sent successfully to {recipient_email}: {subject}")
                return True
            else:
                logger.error(f"Failed to send email to {recipient_email}: {subject}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {recipient_email}: {str(e)}")
            return False
    
    @staticmethod
    def _create_in_app_notification(user, title, message, notification_type='SYSTEM', action_url=None):
        """Helper to create an in-app notification record to sync with emails"""
        try:
            from notifications.services import NotificationService
            NotificationService.create_notification(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                delivery_method='IN_APP',
                action_url=action_url
            )
            logger.info(f"Actual in-app notification created via NotificationService for {user.email}: {title}")
        except Exception as e:
            logger.error(f"Failed to create in-app notification: {e}")

    @staticmethod
    def send_verification_email(user, code):
        """Send 6-digit verification code to user's USC email"""
        context = {
            'user': user,
            'code': code,
            'expires_in': '15 minutes',
            'site_url': settings.SITE_URL
        }
        
        # We generally don't send verification codes as in-app notifications 
        # for security (MFA) and practical reasons (user might not be logged in).
        
        return EmailService.send_template_email(
            template_name='verification_code',
            context=context,
            recipient_email=user.email,
            subject='Your USC-PIS Verification Code'
        )

    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        context = {
            'user': user,
            'site_url': settings.SITE_URL,
            'support_email': settings.SUPPORT_EMAIL
        }
        
        success = EmailService.send_template_email(
            template_name='welcome',
            context=context,
            recipient_email=user.email,
            subject='Welcome to USC-PIS Healthcare System'
        )
        
        if success:
            EmailService._create_in_app_notification(
                user=user,
                title='Welcome to USC-PIS',
                message='Welcome to the USC Patient Information System! Your account is now active and ready to use.',
                notification_type='CLINIC_UPDATE',
                action_url='/profile-setup'
            )
            
        return success
    
    @staticmethod
    def send_password_reset_email(user, reset_url):
        """Send password reset email"""
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_url': settings.SITE_URL
        }
        
        success = EmailService.send_template_email(
            template_name='password_reset',
            context=context,
            recipient_email=user.email,
            subject='USC-PIS Password Reset Request'
        )
        
        if success:
            EmailService._create_in_app_notification(
                user=user,
                title='Password Reset Requested',
                message='A password reset link has been sent to your email. If you did not request this, please secure your account.',
                notification_type='SYSTEM',
                priority='HIGH'
            )
            
        return success
    
    @staticmethod
    def send_medical_certificate_notification(certificate, notification_type):
        """
        Send medical certificate notifications
        Note: In-app notifications for certificates are already handled by signals 
        in medical_certificates/models.py to avoid duplication.
        """
        if notification_type == 'created':
            # ... rest of method ...
            # Notify student about certificate creation
            context = {
                'certificate': certificate,
                'patient': certificate.patient,
                'site_url': settings.SITE_URL
            }
            
            EmailService.send_template_email(
                template_name='certificate_created',
                context=context,
                recipient_email=certificate.patient.user.email,
                subject='Medical Certificate Request Submitted'
            )
            
            # Notify doctors about pending approval
            from authentication.models import User
            doctors = User.objects.filter(role='DOCTOR')
            for doctor in doctors:
                context['doctor'] = doctor
                EmailService.send_template_email(
                    template_name='certificate_pending_approval',
                    context=context,
                    recipient_email=doctor.email,
                    subject='Medical Certificate Approval Required'
                )
        
        elif notification_type == 'approved':
            context = {
                'certificate': certificate,
                'patient': certificate.patient,
                'site_url': settings.SITE_URL
            }
            
            EmailService.send_template_email(
                template_name='certificate_approved',
                context=context,
                recipient_email=certificate.patient.user.email,
                subject='Medical Certificate Approved'
            )
        
        elif notification_type == 'rejected':
            context = {
                'certificate': certificate,
                'patient': certificate.patient,
                'site_url': settings.SITE_URL
            }
            
            EmailService.send_template_email(
                template_name='certificate_rejected',
                context=context,
                recipient_email=certificate.patient.user.email,
                subject='Medical Certificate Update Required'
            )
    
    @staticmethod
    def send_feedback_request_email(visit_record):
        """Send automated feedback request after medical or dental visit"""
        is_medical = hasattr(visit_record, 'diagnosis') and not hasattr(visit_record, 'procedure_performed')
        visit_type = "Medical Consultation" if is_medical else "Dental Procedure"
        
        # Add visit_type to the record object temporarily for the template if it doesn't have it
        if not hasattr(visit_record, 'visit_type'):
            visit_record.visit_type = visit_type

        context = {
            'patient': visit_record.patient,
            'medical_record': visit_record, # The template uses medical_record as the variable name
            'feedback_url': f'{settings.SITE_URL}/feedback/{visit_record.id}?type={"medical" if is_medical else "dental"}',
            'site_url': settings.SITE_URL,
            'login_url': f'{settings.SITE_URL}/login'
        }
        
        return EmailService.send_template_email(
            template_name='feedback_request',
            context=context,
            recipient_email=visit_record.patient.user.email,
            subject='Share Your Healthcare Experience - USC-PIS'
        )

    @staticmethod
    def send_feedback_request_for_visit(patient, visit_date, visit_type='Medical Consultation'):
        """Send feedback request for a generic visit (medical or dental)."""
        try:
            # Minimal object to satisfy template fields
            class VisitObj:
                def __init__(self, visit_date, visit_type):
                    self.visit_date = visit_date
                    self.visit_type = visit_type

            visit = VisitObj(visit_date, visit_type)
            context = {
                'patient': patient,
                'medical_record': visit,  # reusing template variable
                'feedback_url': f'{settings.SITE_URL}/feedback',
                'site_url': settings.SITE_URL,
                'login_url': f'{settings.SITE_URL}/login'
            }

            return EmailService.send_template_email(
                template_name='feedback_request',
                context=context,
                recipient_email=patient.user.email,
                subject='We value your feedback - USC-PIS'
            )
        except Exception as e:
            logger.error(f"Error sending generic feedback email: {e}")
            return False
    
    @staticmethod
    def send_appointment_reminder(appointment):
        """Send appointment reminder email"""
        context = {
            'appointment': appointment,
            'patient': appointment.patient,
            'site_url': settings.SITE_URL
        }
        
        success = EmailService.send_template_email(
            template_name='appointment_reminder',
            context=context,
            recipient_email=appointment.patient.user.email,
            subject=f'Appointment Reminder - {appointment.date}'
        )
        
        if success:
            EmailService._create_in_app_notification(
                user=appointment.patient.user,
                title='Appointment Reminder',
                message=f'Reminder: You have a scheduled appointment on {appointment.date}.',
                notification_type='APPOINTMENT_REMINDER',
                action_url='/appointments'
            )
            
        return success
