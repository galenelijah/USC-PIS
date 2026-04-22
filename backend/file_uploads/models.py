from django.db import models
from django.conf import settings
import os
from patients.models import Patient

class UploadedFile(models.Model):
    """Stores files uploaded by users."""
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Keep file even if user is deleted, but set uploader to NULL
        null=True,
        related_name='uploaded_files'
    )
    file = models.FileField(upload_to='user_uploads/') # Files will be stored in MEDIA_ROOT/user_uploads/
    original_filename = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    content_type = models.CharField(max_length=100, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True) # Size in bytes
    checksum = models.CharField(max_length=64, blank=True, null=True, help_text="SHA-256 checksum for duplicate detection")

    def save(self, *args, **kwargs):
        # Automatically set original_filename if not provided
        if not self.original_filename and self.file:
            self.original_filename = os.path.basename(self.file.name)
        
        # Automatically set file_size if not provided
        if self.file and self.file_size is None:
            try:
                self.file_size = self.file.size
            except Exception as e:
                # Handle cases where file size cannot be determined (e.g., before saving to storage)
                print(f"Could not determine file size for {self.original_filename}: {e}")
                self.file_size = 0 # Or None if you prefer

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_filename} (Uploaded by: {self.uploaded_by.email if self.uploaded_by else 'Unknown'})"

    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['uploaded_by', '-upload_date']),
            models.Index(fields=['checksum']),
        ]

class PatientDocument(models.Model):
    """Stores documents specifically linked to a patient profile."""
    DOCUMENT_TYPES = [
        ('CONSULTATION', 'Scanned Consultation'),
        ('MEDICAL_RECORD', 'Medical Record'),
        ('DENTAL_RECORD', 'Dental Record'),
        ('LAB_RESULT', 'Laboratory Result'),
        ('PRESCRIPTION', 'Prescription'),
        ('XRAY', 'X-Ray'),
        ('OTHER', 'Other'),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    # Optional links to specific records
    medical_record = models.ForeignKey(
        'patients.MedicalRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attachments'
    )
    dental_record = models.ForeignKey(
        'patients.DentalRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attachments'
    )
    file = models.FileField(upload_to='patient_documents/')
    original_filename = models.CharField(max_length=255, blank=True)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='OTHER')
    other_type = models.CharField(max_length=100, blank=True, null=True, help_text="Custom document type if 'Other' is selected")
    description = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_patient_documents'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.original_filename and self.file:
            self.original_filename = os.path.basename(self.file.name)
        if self.file and self.file_size is None:
            try:
                self.file_size = self.file.size
            except:
                self.file_size = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.get_document_type_display()} ({self.uploaded_at.strftime('%Y-%m-%d')})"

    class Meta:
        ordering = ['-uploaded_at']
