"""
Django signals for automated email notifications after medical visits
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import MedicalRecord, DentalRecord
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=MedicalRecord)
def schedule_feedback_email_medical(sender, instance, created, **kwargs):
    """
    Schedule feedback request email 24 hours after medical visit is created
    """
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Create a delayed task to send feedback email after 24 hours
            # For now, we'll use Django's built-in management command approach
            # In production, you might want to use Celery for better scheduling
            
            logger.info(f"Medical record created for patient {instance.patient.id}. Feedback email will be triggered by management command.")
            
            # Note: The actual email will be sent by the management command 
            # `python manage.py send_feedback_emails --hours 24`
            # which should be run daily via cron job or scheduler
            
        except Exception as e:
            logger.error(f"Error scheduling feedback email for medical record {instance.id}: {e}")

@receiver(post_save, sender=DentalRecord)
def schedule_feedback_email_dental(sender, instance, created, **kwargs):
    """
    Schedule feedback request email 24 hours after dental visit is created
    """
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            logger.info(f"Dental record created for patient {instance.patient.id}. Feedback email will be triggered by management command.")
            
            # Note: The actual email will be sent by the management command 
            # `python manage.py send_feedback_emails --hours 24`
            # which should be run daily via cron job or scheduler
            
        except Exception as e:
            logger.error(f"Error scheduling feedback email for dental record {instance.id}: {e}")

def send_immediate_feedback_email(medical_record):
    """
    Send feedback email immediately (for testing or immediate feedback requests)
    """
    try:
        if medical_record.patient and hasattr(medical_record.patient, 'user') and medical_record.patient.user:
            success = EmailService.send_feedback_request_email(medical_record)
            if success:
                logger.info(f"Immediate feedback email sent for medical record {medical_record.id}")
                return True
            else:
                logger.error(f"Failed to send immediate feedback email for medical record {medical_record.id}")
                return False
        else:
            logger.warning(f"Cannot send feedback email for medical record {medical_record.id}: patient has no linked user account")
            return False
    except Exception as e:
        logger.error(f"Error sending immediate feedback email for medical record {medical_record.id}: {e}")
        return False