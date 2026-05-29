from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from patients.models import Patient
from simple_history.models import HistoricalRecords

User = get_user_model()

class CertificateTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    content = models.TextField(help_text="HTML template with placeholders for certificate content")
    history = HistoricalRecords()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MedicalCertificate(models.Model):
    FITNESS_STATUS_CHOICES = [
        ('physically_fit', 'Physically Fit'),
        ('physically_unfit', 'Physically Unfit'),
    ]
    
    ISSUANCE_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Issuance'),
        ('issued', 'Issued'),
        ('rejected', 'Rejected'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='medical_certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.PROTECT)
    
    # Certificate Data
    diagnosis = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    valid_from = models.DateField()
    valid_until = models.DateField()
    additional_notes = models.TextField(blank=True)
    
    # Medical Fitness Assessment
    fitness_status = models.CharField(
        max_length=20, 
        choices=FITNESS_STATUS_CHOICES, 
        default='physically_fit',
        help_text="Medical fitness determination: Physically Fit or Physically Unfit"
    )
    fitness_reason = models.TextField(
        blank=True,
        help_text="Reason for fitness status, especially important for 'Physically Unfit' determinations"
    )
    
    # Issuance Workflow
    issuance_status = models.CharField(
        max_length=20, 
        choices=ISSUANCE_STATUS_CHOICES, 
        default='draft',
        help_text="Administrative issuance status for the certificate"
    )
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_certificates')
    issuing_doctor = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        related_name='issued_medical_certificates',
        null=True, 
        blank=True
    )
    
    # Timestamps
    history = HistoricalRecords()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Certificate for {self.patient} - {self.get_fitness_status_display()} ({self.get_issuance_status_display()})"
