"""
Django signals for automated email notifications after medical visits
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import MedicalRecord, DentalRecord
from utils.email_service import EmailService
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=MedicalRecord)
def schedule_feedback_email_medical(sender, instance, created, **kwargs):
    """Immediately send feedback email and in-app notification for medical visits."""
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Send immediate feedback email
            EmailService.send_feedback_request_email(instance)
            # Create in-app notification
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='FOLLOW_UP',
                title='Feedback Required',
                message='Please provide feedback for your recent medical visit.',
                priority='MEDIUM',
                delivery_method='IN_APP',
                action_url='https://usc-pis-5f030223f7a8.herokuapp.com/feedback',
                action_text='Leave Feedback'
            )
        except Exception as e:
            logger.error(f"Error scheduling feedback email for medical record {instance.id}: {e}")

@receiver(post_save, sender=DentalRecord)
def schedule_feedback_email_dental(sender, instance, created, **kwargs):
    """Immediately send feedback email and in-app notification for dental visits."""
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Send immediate email for dental visit
            EmailService.send_feedback_request_for_visit(
                patient=instance.patient,
                visit_date=instance.visit_date,
                visit_type='Dental Visit'
            )
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='FOLLOW_UP',
                title='Feedback Required',
                message='Please provide feedback for your recent dental visit.',
                priority='MEDIUM',
                delivery_method='IN_APP',
                action_url='https://usc-pis-5f030223f7a8.herokuapp.com/feedback',
                action_text='Leave Feedback'
            )
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
