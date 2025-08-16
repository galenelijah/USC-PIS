"""
Email service utilities for USC-PIS
Handles email templates, sending, and notifications
"""
from django.core.mail import send_mail, EmailMultiAlternatives
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
        
        Args:
            template_name (str): Template file name without extension
            context (dict): Context data for the template
            recipient_email (str): Recipient email address
            subject (str): Email subject
            from_email (str, optional): Sender email address
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            if from_email is None:
                from_email = settings.DEFAULT_FROM_EMAIL
            
            # Create professional USC-PIS display name
            usc_display_name = f"USC Patient Information System <{from_email}>"
            
            # Render HTML template
            html_content = render_to_string(f'emails/{template_name}.html', context)
            
            # Create plain text version
            text_content = strip_tags(html_content)
            
            # Create email message with USC branding
            msg = EmailMultiAlternatives(
                subject=f"[USC-PIS] {subject}",
                body=text_content,
                from_email=usc_display_name,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            # Add USC reply-to and headers
            msg.extra_headers = {
                'Reply-To': 'noreply@usc.edu.ph',
                'X-Mailer': 'USC Patient Information System',
                'X-Priority': '3',
                'Organization': 'University of Southern California'
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
    def send_welcome_email(user):
        """Send welcome email to new users"""
        context = {
            'user': user,
            'site_url': 'https://usc-pis.herokuapp.com',
            'support_email': 'support@usc-pis.herokuapp.com'
        }
        
        return EmailService.send_template_email(
            template_name='welcome',
            context=context,
            recipient_email=user.email,
            subject='Welcome to USC-PIS Healthcare System'
        )
    
    @staticmethod
    def send_password_reset_email(user, reset_url):
        """Send password reset email"""
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_url': 'https://usc-pis.herokuapp.com'
        }
        
        return EmailService.send_template_email(
            template_name='password_reset',
            context=context,
            recipient_email=user.email,
            subject='USC-PIS Password Reset Request'
        )
    
    @staticmethod
    def send_medical_certificate_notification(certificate, notification_type):
        """
        Send medical certificate notifications
        
        Args:
            certificate: MedicalCertificate instance
            notification_type: 'created', 'approved', 'rejected'
        """
        if notification_type == 'created':
            # Notify student about certificate creation
            context = {
                'certificate': certificate,
                'patient': certificate.patient,
                'site_url': 'https://usc-pis.herokuapp.com'
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
                'site_url': 'https://usc-pis.herokuapp.com'
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
                'site_url': 'https://usc-pis.herokuapp.com'
            }
            
            EmailService.send_template_email(
                template_name='certificate_rejected',
                context=context,
                recipient_email=certificate.patient.user.email,
                subject='Medical Certificate Update Required'
            )
    
    @staticmethod
    def send_feedback_request_email(medical_record):
        """Send automated feedback request after medical visit"""
        context = {
            'patient': medical_record.patient,
            'medical_record': medical_record,
            'feedback_url': f'https://usc-pis.herokuapp.com/feedback?visit_id={medical_record.id}',
            'site_url': 'https://usc-pis.herokuapp.com'
        }
        
        return EmailService.send_template_email(
            template_name='feedback_request',
            context=context,
            recipient_email=medical_record.patient.user.email,
            subject='Share Your Healthcare Experience - USC-PIS'
        )
    
    @staticmethod
    def send_appointment_reminder(appointment):
        """Send appointment reminder email"""
        context = {
            'appointment': appointment,
            'patient': appointment.patient,
            'site_url': 'https://usc-pis.herokuapp.com'
        }
        
        return EmailService.send_template_email(
            template_name='appointment_reminder',
            context=context,
            recipient_email=appointment.patient.user.email,
            subject=f'Appointment Reminder - {appointment.date}'
        )