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
