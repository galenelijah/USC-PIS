import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from patients.models import Patient, MedicalRecord, DentalRecord
from authentication.models import User
from .services import ReportDataService

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Patient)
@receiver(post_delete, sender=Patient)
def invalidate_report_cache_on_patient_change(sender, instance, **kwargs):
    """Invalidate report cache when a patient is created, updated, or deleted."""
    ReportDataService.invalidate_cache()

@receiver(post_save, sender=MedicalRecord)
@receiver(post_delete, sender=MedicalRecord)
def invalidate_report_cache_on_medical_change(sender, instance, **kwargs):
    """Invalidate report cache when a medical record is created, updated, or deleted."""
    ReportDataService.invalidate_cache()

@receiver(post_save, sender=DentalRecord)
@receiver(post_delete, sender=DentalRecord)
def invalidate_report_cache_on_dental_change(sender, instance, **kwargs):
    """Invalidate report cache when a dental record is created, updated, or deleted."""
    ReportDataService.invalidate_cache()

@receiver(post_save, sender=User)
@receiver(post_delete, sender=User)
def invalidate_report_cache_on_user_change(sender, instance, **kwargs):
    """Invalidate report cache when a user (verified status/role) is changed or deleted."""
    # We only care about fields that affect reports: is_verified, role, school, course, etc.
    # For simplicity, we invalidate on any save/delete of a user.
    ReportDataService.invalidate_cache()
