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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Certificate for {self.patient} - {self.get_fitness_status_display()} ({self.get_issuance_status_display()})"


@receiver(post_save, sender=MedicalCertificate)
def medical_certificate_notification(sender, instance, created, **kwargs):
    """
    Send notifications when medical certificate status changes.
    Uses NotificationService to ensure full audit logging and multi-channel delivery.
    """
    from notifications.services import NotificationService
    
    if created:
        # Notify patient when certificate is created (In-App only for draft/pending)
        if instance.patient.user:
            NotificationService.create_notification(
                recipient=instance.patient.user,
                title="Medical Certificate Created",
                message=f"A new medical certificate has been created for you by {instance.created_by.get_full_name()}.",
                notification_type="MEDICAL_CERTIFICATE",
                delivery_method='IN_APP',
                metadata={'certificate_id': instance.id},
                patient=instance.patient
            )
            
    # Handle specific status notifications (for both creation and updates)
    # Check if issuance status is issued
    if instance.issuance_status == 'issued' and instance.issuing_doctor:
        # Notify patient when certificate is issued (In-App only, view handles Email)
        if instance.patient.user:
            from notifications.models import Notification
            exists = Notification.objects.filter(
                recipient=instance.patient.user,
                title="Medical Certificate Issued",
                metadata__certificate_id=instance.id
            ).exists()
            
            if not exists:
                fitness_info = f"Status: {instance.get_fitness_status_display()}"
                if instance.fitness_reason:
                    fitness_info += f" - {instance.fitness_reason}"
                
                NotificationService.create_notification(
                    recipient=instance.patient.user,
                    title="Medical Certificate Issued",
                    message=f"Your medical certificate has been issued by {instance.issuing_doctor.get_full_name()}. {fitness_info}. Medical Certificate is ready to be claimed.",
                    notification_type="MEDICAL_CERTIFICATE",
                    delivery_method='IN_APP',
                    metadata={'certificate_id': instance.id},
                    action_url='/health-insights',
                    action_text='View Certificate',
                    patient=instance.patient
                )
    elif instance.issuance_status == 'rejected' and instance.issuing_doctor:
        # Notify patient when certificate is rejected (In-App only, view handles Email)
        if instance.patient.user:
            from notifications.models import Notification
            exists = Notification.objects.filter(
                recipient=instance.patient.user,
                title="Medical Certificate Rejected",
                metadata__certificate_id=instance.id
            ).exists()
            
            if not exists:
                NotificationService.create_notification(
                    recipient=instance.patient.user,
                    title="Medical Certificate Rejected",
                    message=f"Your medical certificate has been rejected by {instance.issuing_doctor.get_full_name()}. Please contact the clinic for more information.",
                    notification_type="MEDICAL_CERTIFICATE",
                    delivery_method='IN_APP',
                    metadata={'certificate_id': instance.id},
                    patient=instance.patient
                )
    elif instance.issuance_status == 'pending':
        # Notify doctors when certificate is pending issuance (In-App only, view handles Email)
        doctors = User.objects.filter(role__in=['DOCTOR', 'ADMIN']).exclude(id=instance.created_by_id)
        for doctor in doctors:
            from notifications.models import Notification
            exists = Notification.objects.filter(
                recipient=doctor,
                title="Medical Certificate Pending Issuance",
                metadata__certificate_id=instance.id,
                status__in=['PENDING', 'DELIVERED', 'SENT']
            ).exists()
            
            if not exists:
                fitness_info = f"Fitness Status: {instance.get_fitness_status_display()}"
                if instance.fitness_reason:
                    fitness_info += f" - {instance.fitness_reason}"
                
                NotificationService.create_notification(
                    recipient=doctor,
                    title="Medical Certificate Pending Issuance",
                    message=f"A medical certificate for {instance.patient.get_full_name()} is pending your review and issuance. {fitness_info}",
                    notification_type="MEDICAL_CERTIFICATE",
                    delivery_method='IN_APP',
                    metadata={'certificate_id': instance.id},
                    action_url='/medical-certificates',
                    action_text='Review Certificate',
                    patient=instance.patient
                )
