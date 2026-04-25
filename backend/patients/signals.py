"""
Django signals for automated email notifications after medical visits
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import MedicalRecord, DentalRecord, Patient
from django.conf import settings
from django.db import connection

# Import from other apps
from utils.email_service import EmailService
from notifications.models import Notification

# Initialize logger
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Patient)
def encrypt_patient_fields(sender, instance, **kwargs):
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key: return
    with connection.cursor() as cursor:
        if instance.first_name:
            cursor.execute("UPDATE patients_patient SET first_name_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.first_name, key, instance.id])
        if instance.last_name:
            cursor.execute("UPDATE patients_patient SET last_name_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.last_name, key, instance.id])

@receiver(post_save, sender=MedicalRecord)
def encrypt_medical_record_fields(sender, instance, **kwargs):
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key: return
    if instance.diagnosis:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE patients_medicalrecord SET diagnosis_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.diagnosis, key, instance.id])

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
            # Send immediate feedback email using the generic method
            EmailService.send_feedback_request_for_visit(
                patient=instance.patient,
                visit_date=instance.visit_date,
                visit_type='Dental Consultation'
            )
            # Create in-app notification
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='FOLLOW_UP',
                title='Dental Feedback Required',
                message='Please provide feedback for your recent dental consultation.',
                priority='MEDIUM',
                delivery_method='IN_APP',
                action_url=f'https://usc-pis-5f030223f7a8.herokuapp.com/feedback?visit_id={instance.id}&type=dental',
                action_text='Leave Feedback'
            )
            logger.info(f"Feedback requested for dental record {instance.id}")
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
