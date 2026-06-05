"""
Django signals for automated email notifications after medical visits
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import MedicalRecord, DentalRecord, Patient, Consultation
from file_uploads.models import PatientDocument
from django.conf import settings
from django.db import connection

# Import from other apps
from utils.email_service import EmailService
from notifications.models import Notification

# Initialize logger
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Patient)
def encrypt_patient_fields(sender, instance, **kwargs):
    if connection.vendor != 'postgresql': return
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key: return
    with connection.cursor() as cursor:
        if instance.first_name:
            cursor.execute("UPDATE patients_patient SET first_name_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.first_name, key, instance.id])
        if instance.last_name:
            cursor.execute("UPDATE patients_patient SET last_name_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.last_name, key, instance.id])

@receiver(post_save, sender=MedicalRecord)
def encrypt_medical_record_fields(sender, instance, **kwargs):
    if connection.vendor != 'postgresql': return
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key: return
    if instance.diagnosis:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE patients_medicalrecord SET diagnosis_enc = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s", [instance.diagnosis, key, instance.id])

@receiver(post_save, sender=MedicalRecord)
def update_patient_profile_vitals(sender, instance, created, **kwargs):
    """Update patient's user profile with latest weight, height, and BMI from medical records."""
    if instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        vitals = instance.vital_signs
        if vitals and isinstance(vitals, dict):
            user = instance.patient.user
            updated = False
            
            # Check if this is the most recent medical record
            latest_record = MedicalRecord.objects.filter(patient=instance.patient).order_by('-visit_date').first()
            if latest_record and latest_record.id != instance.id:
                # If we are saving an older record, don't update the profile
                return

            # Update weight if present
            if 'weight' in vitals and vitals['weight']:
                user.weight = str(vitals['weight'])
                updated = True
                
            # Update height if present
            if 'height' in vitals and vitals['height']:
                user.height = str(vitals['height'])
                updated = True
                
            # Update BMI if present
            if 'bmi' in vitals and vitals['bmi']:
                user.bmi = str(vitals['bmi'])
                updated = True
            
            if updated:
                user.save(update_fields=['weight', 'height', 'bmi'])
                logger.info(f"Updated profile vitals for patient {instance.patient.id}")

@receiver(post_save, sender=MedicalRecord)
def schedule_feedback_email_medical(sender, instance, created, **kwargs):
    """Immediately send feedback email and in-app notification for medical visits."""
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Send immediate feedback email
            sent = EmailService.send_feedback_request_email(instance)
            if sent:
                instance.feedback_email_sent = True
                instance.save(update_fields=['feedback_email_sent'])
            
            # Create immediate in-app notification
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='CLINIC_UPDATE',
                title='Medical Feedback Required',
                message=f'Please provide feedback for your recent medical visit on {instance.visit_date.strftime("%Y-%m-%d")}.',
                delivery_method='IN_APP',
                action_url=f'{settings.SITE_URL}/feedback/{instance.id}?type=medical',
                action_text='Leave Feedback'
            )
            
            logger.info(f"Immediate feedback sent for medical record {instance.id}")
        except Exception as e:
            logger.error(f"Error scheduling feedback for medical record {instance.id}: {e}")

@receiver(post_save, sender=DentalRecord)
def schedule_feedback_email_dental(sender, instance, created, **kwargs):
    """Immediately send feedback email and in-app notification for dental visits."""
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Send immediate feedback email using the generic method
            sent = EmailService.send_feedback_request_for_visit(
                patient=instance.patient,
                visit_date=instance.visit_date,
                visit_type='Dental Consultation'
            )
            if sent:
                instance.feedback_email_sent = True
                instance.save(update_fields=['feedback_email_sent'])
            
            # Create immediate in-app notification
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='CLINIC_UPDATE',
                title='Dental Feedback Required',
                message=f'Please provide feedback for your recent dental consultation on {instance.visit_date.strftime("%Y-%m-%d")}.',
                delivery_method='IN_APP',
                action_url=f'{settings.SITE_URL}/feedback/{instance.id}?type=dental',
                action_text='Leave Feedback'
            )
            
            logger.info(f"Immediate feedback sent for dental record {instance.id}")
        except Exception as e:
            logger.error(f"Error scheduling feedback for dental record {instance.id}: {e}")

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

@receiver(post_save, sender=MedicalRecord)
def notify_patient_medical_update(sender, instance, created, **kwargs):
    """Notify patient when their medical record is added or updated."""
    if instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            title = 'New Medical Record Added' if created else 'Medical Record Updated'
            message = f'A new medical record from your visit on {instance.visit_date.strftime("%Y-%m-%d")} has been added to your profile.'
            if not created:
                message = f'Your medical record from {instance.visit_date.strftime("%Y-%m-%d")} has been updated.'
            
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='MEDICAL_RECORD',
                title=title,
                message=message,
                delivery_method='IN_APP',
                action_url='/health-records'
            )
            logger.info(f"Notification created for medical record {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification for medical record {instance.id}: {e}")

@receiver(post_save, sender=DentalRecord)
def notify_patient_dental_update(sender, instance, created, **kwargs):
    """Notify patient when their dental record is added or updated."""
    if instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            title = 'New Dental Record Added' if created else 'Dental Record Updated'
            message = f'A new dental record for {instance.get_procedure_performed_display()} on {instance.visit_date.strftime("%Y-%m-%d")} has been added to your profile.'
            if not created:
                message = f'Your dental record from {instance.visit_date.strftime("%Y-%m-%d")} has been updated.'
            
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='DENTAL_RECORD',
                title=title,
                message=message,
                delivery_method='IN_APP',
                action_url='/health-records'
            )
            logger.info(f"Notification created for dental record {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification for dental record {instance.id}: {e}")

@receiver(post_save, sender=Consultation)
def notify_patient_consultation_update(sender, instance, created, **kwargs):
    """Notify patient when their consultation record is added or updated."""
    if instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            title = 'New Consultation Record Added' if created else 'Consultation Record Updated'
            message = f'A new consultation record from {instance.date_time.strftime("%Y-%m-%d")} has been added to your profile.'
            if not created:
                message = f'Your consultation record from {instance.date_time.strftime("%Y-%m-%d")} has been updated.'
            
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type='MEDICAL_RECORD',
                title=title,
                message=message,
                delivery_method='IN_APP',
                action_url='/health-records'
            )
            logger.info(f"Notification created for consultation record {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification for consultation record {instance.id}: {e}")

@receiver(post_save, sender=PatientDocument)
def notify_patient_document_upload(sender, instance, created, **kwargs):
    """Notify patient when a document (like lab results) is uploaded to their profile."""
    if created and instance.patient and hasattr(instance.patient, 'user') and instance.patient.user:
        try:
            # Map document types to notification types
            notification_type = 'MEDICAL_RECORD'
            if instance.document_type == 'LAB_RESULT':
                notification_type = 'LABORATORY_RESULT'
            elif instance.document_type == 'DENTAL_RECORD':
                notification_type = 'DENTAL_RECORD'
            
            title = f'New {instance.get_document_type_display()} Uploaded'
            message = f'A new {instance.get_document_type_display().lower()} has been added to your profile documents.'
            
            Notification.objects.create(
                recipient=instance.patient.user,
                patient=instance.patient,
                notification_type=notification_type,
                title=title,
                message=message,
                delivery_method='IN_APP',
                action_url='/health-records'
            )
            logger.info(f"Notification created for patient document {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification for patient document {instance.id}: {e}")
