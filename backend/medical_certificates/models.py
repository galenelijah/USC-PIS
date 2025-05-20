from django.db import models
from django.contrib.auth import get_user_model
from patients.models import Patient

User = get_user_model()

class CertificateTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    content = models.TextField(help_text="HTML template with placeholders for certificate content")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MedicalCertificate(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='medical_certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.PROTECT)
    
    # Certificate Data
    diagnosis = models.TextField()
    recommendations = models.TextField()
    valid_from = models.DateField()
    valid_until = models.DateField()
    additional_notes = models.TextField(blank=True)
    
    # Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issued_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='issued_certificates')
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        related_name='approved_certificates',
        null=True, 
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Certificate for {self.patient} - {self.get_status_display()}"
