from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
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


@receiver(post_save, sender=MedicalCertificate)
def medical_certificate_notification(sender, instance, created, **kwargs):
    """
    Send notifications when medical certificate status changes
    """
    from notifications.models import Notification
    
    if created:
        # Notify patient when certificate is created
        if instance.patient.user:
            Notification.objects.create(
                recipient=instance.patient.user,
                title="Medical Certificate Created",
                message=f"A new medical certificate has been created for you by {instance.issued_by.get_full_name()}.",
                notification_type="certificate_created"
            )
    else:
        # Check if status changed
        if instance.status == 'approved' and instance.approved_by:
            # Notify patient when certificate is approved
            if instance.patient.user:
                Notification.objects.create(
                    recipient=instance.patient.user,
                    title="Medical Certificate Approved",
                    message=f"Your medical certificate has been approved by {instance.approved_by.get_full_name()}. You can now download it.",
                    notification_type="certificate_approved"
                )
        elif instance.status == 'rejected' and instance.approved_by:
            # Notify patient when certificate is rejected
            if instance.patient.user:
                Notification.objects.create(
                    recipient=instance.patient.user,
                    title="Medical Certificate Rejected",
                    message=f"Your medical certificate has been rejected by {instance.approved_by.get_full_name()}. Please contact the clinic for more information.",
                    notification_type="certificate_rejected"
                )
        elif instance.status == 'pending':
            # Notify doctors when certificate is submitted for approval
            doctors = User.objects.filter(role__in=['DOCTOR', 'ADMIN'])
            for doctor in doctors:
                Notification.objects.create(
                    recipient=doctor,
                    title="Medical Certificate Pending Approval",
                    message=f"A medical certificate for {instance.patient.get_full_name()} is pending your approval.",
                    notification_type="certificate_pending"
                )
