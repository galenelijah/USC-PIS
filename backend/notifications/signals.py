from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from authentication.models import User
from patients.models import Patient, MedicalRecord, DentalRecord, Consultation
from medical_certificates.models import MedicalCertificate
from feedback.models import Feedback
from file_uploads.models import PatientDocument
from .models import NotificationPreference, NotificationTemplate
from .services import NotificationService, NotificationTemplateService


@receiver(post_save, sender=User)
def handle_user_updates(sender, instance, created, **kwargs):
    """Create preferences for new users and notify on profile completion/security updates"""
    if created:
        NotificationPreference.objects.get_or_create(
            user=instance,
            defaults={
                'email_enabled': True,
                'in_app_enabled': True,
                'health_campaigns': True,
                'clinic_updates': True,
                'follow_up_reminders': True,
                'dental_reminders': True,
                'desktop_notifications': True,
                'sound_enabled': False,
                'digest_frequency': 'IMMEDIATE',
                'language_preference': 'en',
                'timezone': 'UTC'
            }
        )
    else:
        # Check if we should skip notification (e.g., just a last_login update)
        update_fields = kwargs.get('update_fields')
        if update_fields:
            # If only last_login, is_verified, completeSetup or other non-security fields are updated, skip
            # These are technical updates rather than a user-initiated profile change
            ignored_fields = {'last_login', 'last_activity', 'is_verified', 'completeSetup'}
            if all(field in ignored_fields for field in update_fields):
                return

        # Security/Profile updates - Notify the user
        NotificationService.create_notification(
            recipient=instance,
            notification_type='SYSTEM_ALERT',
            title="Account Information Updated",
            message="Your account profile or security settings have been successfully updated.",
            priority='MEDIUM',
            delivery_method='IN_APP',
            metadata={'action': 'profile_update'}
        )

@receiver(post_save, sender=MedicalCertificate)
def medical_certificate_notification_central(sender, instance, created, **kwargs):
    """
    Centralized notifications for Medical Certificates.
    Notifies students on issuance/rejection and doctors on pending requests.
    """
    if created:
        # Notify patient when certificate is created (In-App only for draft/pending)
        if instance.patient.user:
            NotificationService.create_notification(
                recipient=instance.patient.user,
                title="Medical Certificate Created",
                message=f"A new medical certificate record has been created for you by {instance.created_by.get_full_name()}.",
                notification_type="MEDICAL_CERTIFICATE",
                delivery_method='IN_APP',
                metadata={'certificate_id': instance.id},
                patient=instance.patient
            )
            
    # Handle status-specific notifications
    if instance.issuance_status == 'issued' and instance.issuing_doctor:
        if instance.patient.user:
            # Check for duplicate issuance notifications
            from .models import Notification
            if not Notification.objects.filter(recipient=instance.patient.user, title="Medical Certificate Issued", metadata__certificate_id=instance.id).exists():
                NotificationService.create_notification(
                    recipient=instance.patient.user,
                    title="Medical Certificate Issued",
                    message=f"Your medical certificate is ready! Issued by {instance.issuing_doctor.get_full_name()}. It can now be claimed at the clinic or viewed in your health records.",
                    notification_type="MEDICAL_CERTIFICATE",
                    delivery_method='BOTH', # Push to email as well for issuance
                    priority='HIGH',
                    metadata={'certificate_id': instance.id},
                    action_url='/health-insights',
                    action_text='View Certificate',
                    patient=instance.patient
                )
    elif instance.issuance_status == 'rejected' and instance.issuing_doctor:
        if instance.patient.user:
            NotificationService.create_notification(
                recipient=instance.patient.user,
                title="Medical Certificate Rejected",
                message=f"Your medical certificate request has been rejected by {instance.issuing_doctor.get_full_name()}. Please contact the clinic for details.",
                notification_type="MEDICAL_CERTIFICATE",
                delivery_method='IN_APP',
                priority='MEDIUM',
                metadata={'certificate_id': instance.id},
                patient=instance.patient
            )
    elif instance.issuance_status == 'pending':
        # Notify doctors/staff when certificate is pending issuance
        doctors = User.objects.filter(role__in=['DOCTOR', 'ADMIN', 'NURSE']).exclude(id=instance.created_by_id)
        for doctor in doctors:
            NotificationService.create_notification(
                recipient=doctor,
                title="Certificate Pending Issuance",
                message=f"A medical certificate for {instance.patient.get_full_name()} requires review.",
                notification_type="MEDICAL_CERTIFICATE",
                delivery_method='IN_APP',
                priority='MEDIUM',
                metadata={'certificate_id': instance.id},
                action_url='/medical-certificates',
                action_text='Review',
                patient=instance.patient
            )

@receiver(post_save, sender=MedicalRecord)
def medical_record_notification(sender, instance, created, **kwargs):
    """Notify patient when medical record is created or updated"""
    if instance.patient.user:
        action = "created" if created else "updated"
        NotificationService.create_notification(
            recipient=instance.patient.user,
            notification_type='CLINIC_UPDATE',
            title=f"Medical Record {action.capitalize()}",
            message=f"A medical record for your visit on {instance.visit_date.strftime('%B %d, %Y')} has been {action}.",
            priority='MEDIUM',
            delivery_method='IN_APP',
            patient=instance.patient,
            metadata={'record_id': instance.id, 'type': 'MEDICAL'}
        )

@receiver(post_save, sender=DentalRecord)
def dental_record_notification(sender, instance, created, **kwargs):
    """Notify patient when dental record is created or updated"""
    if instance.patient.user:
        action = "created" if created else "updated"
        NotificationService.create_notification(
            recipient=instance.patient.user,
            notification_type='CLINIC_UPDATE',
            title=f"Dental Record {action.capitalize()}",
            message=f"A dental record for your visit on {instance.visit_date.strftime('%B %d, %Y')} has been {action}.",
            priority='MEDIUM',
            delivery_method='IN_APP',
            patient=instance.patient,
            metadata={'record_id': instance.id, 'type': 'DENTAL'}
        )

@receiver(post_save, sender=Consultation)
def consultation_notification(sender, instance, created, **kwargs):
    """Notify patient when consultation is created or updated"""
    if instance.patient.user:
        action = "created" if created else "updated"
        NotificationService.create_notification(
            recipient=instance.patient.user,
            notification_type='CLINIC_UPDATE',
            title=f"Consultation {action.capitalize()}",
            message=f"A consultation record from {instance.date_time.strftime('%B %d, %Y')} has been {action}.",
            priority='MEDIUM',
            delivery_method='IN_APP',
            patient=instance.patient,
            metadata={'consultation_id': instance.id}
        )

@receiver(post_save, sender=Feedback)
def feedback_notification(sender, instance, created, **kwargs):
    """Notify clinic staff when new feedback is submitted by a student/faculty"""
    if created:
        staff_users = User.objects.filter(role__in=['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'])
        for staff in staff_users:
            NotificationService.create_notification(
                recipient=staff,
                title="New Feedback Received",
                message=f"Patient {instance.patient.get_full_name()} submitted feedback (Rating: {instance.rating}/5).",
                notification_type='CLINIC_UPDATE',
                priority='LOW',
                delivery_method='IN_APP',
                metadata={'feedback_id': instance.id},
                action_url='/admin-feedback',
                action_text='View Feedback'
            )

@receiver(post_save, sender=PatientDocument)
def patient_document_notification(sender, instance, created, **kwargs):
    """Notify clinic staff when a document is uploaded, especially by a student"""
    if created:
        # Only notify if uploaded by someone other than staff (e.g., the student themselves)
        # Or if it's a critical document type like LAB_RESULT
        is_student_upload = instance.uploaded_by and instance.uploaded_by.role in ['STUDENT', 'FACULTY']
        is_critical = instance.document_type in ['LAB_RESULT', 'XRAY']
        
        if is_student_upload or is_critical:
            staff_users = User.objects.filter(role__in=['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'])
            for staff in staff_users:
                NotificationService.create_notification(
                    recipient=staff,
                    title="New Document Uploaded",
                    message=f"A new {instance.get_document_type_display()} has been uploaded for {instance.patient.get_full_name()}.",
                    notification_type='CLINIC_UPDATE',
                    priority='MEDIUM',
                    delivery_method='IN_APP',
                    metadata={'document_id': instance.id, 'patient_id': instance.patient.id},
                    action_url='/students',
                    action_text='View Records'
                )

@receiver(post_save, sender=Patient)
def send_welcome_notification(sender, instance, created, **kwargs):
    """Send welcome notification to new patients"""
    if created and instance.user:
        # Get or create welcome template
        template, _ = NotificationTemplate.objects.get_or_create(
            template_type='CLINIC_UPDATE',
            name='Patient Welcome Message',
            defaults={
                'subject_template': 'Welcome to USC Health Services, {{patient_first_name}}!',
                'body_template': '''Dear {{patient_first_name}} {{patient_last_name}},

Welcome to USC Health Services Patient Information System!

Your patient profile has been successfully created. Here are your details:
- Name: {{patient_name}}
- Email: {{patient_email}}
- Phone: {{patient_phone}}
- Registration Date: {{current_date}}

Through our patient portal, you can:
- View your medical records
- Access dental records
- Receive important health notifications
- Update your contact information

If you have any questions or need assistance, please contact us at {{clinic_email}} or call {{clinic_phone}}.

Thank you for choosing USC Health Services for your healthcare needs.

Best regards,
USC Health Services Team''',
                'available_variables': {
                    'patient_name': 'Full patient name',
                    'patient_first_name': 'Patient first name',
                    'patient_last_name': 'Patient last name',
                    'patient_email': 'Patient email address',
                    'patient_phone': 'Patient phone number',
                    'current_date': 'Current date',
                    'clinic_name': 'Clinic name',
                    'clinic_email': 'Clinic email',
                    'clinic_phone': 'Clinic phone'
                },
                'is_active': True
            }
        )
        
        # Create context for template
        user = instance.user
        first_name = getattr(user, 'first_name', '') or 'Student'
        last_name = getattr(user, 'last_name', '') or ''
        
        context_data = NotificationTemplateService.get_default_context(
            user=user,
            patient=instance
        )
        # Ensure name variables are populated even if user profile is incomplete
        context_data.update({
            'patient_first_name': first_name,
            'patient_last_name': last_name,
            'patient_name': f"{first_name} {last_name}".strip()
        })
        
        # Create welcome notification
        NotificationService.create_from_template(
            template=template,
            recipient=instance.user,
            context_data=context_data,
            priority='MEDIUM',
            delivery_method='BOTH',
            patient=instance
        )


# Example signals for appointments (these would be implemented when appointment models exist)
"""
@receiver(post_save, sender=Appointment)
def send_appointment_confirmation(sender, instance, created, **kwargs):
    '''Send appointment confirmation notification'''
    if created:
        # Get appointment confirmation template
        template = NotificationTemplate.objects.filter(
            template_type='APPOINTMENT_REMINDER',
            name__icontains='confirmation',
            is_active=True
        ).first()
        
        if template:
            context_data = NotificationTemplateService.get_default_context(
                user=instance.patient.user,
                patient=instance.patient
            )
            context_data.update({
                'appointment_date': instance.appointment_date.strftime('%B %d, %Y'),
                'appointment_time': instance.appointment_time.strftime('%I:%M %p'),
                'doctor_name': instance.doctor.get_full_name(),
                'appointment_type': instance.appointment_type,
                'location': instance.location or 'USC Health Services'
            })
            
            NotificationService.create_from_template(
                template=template,
                recipient=instance.patient.user,
                context_data=context_data,
                priority='HIGH',
                delivery_method='BOTH',
                patient=instance.patient,
                action_url=f'/appointments/{instance.id}',
                action_text='View Appointment'
            )


@receiver(pre_save, sender=Appointment)
def schedule_appointment_reminder(sender, instance, **kwargs):
    '''Schedule appointment reminder notification'''
    # Only for new appointments or date changes
    if instance.pk:
        try:
            old_instance = Appointment.objects.get(pk=instance.pk)
            if old_instance.appointment_date == instance.appointment_date:
                return  # No date change, skip
        except Appointment.DoesNotExist:
            pass
    
    # Get appointment reminder template
    template = NotificationTemplate.objects.filter(
        template_type='APPOINTMENT_REMINDER',
        name__icontains='reminder',
        is_active=True
    ).first()
    
    if template:
        # Schedule reminder 24 hours before appointment
        reminder_time = timezone.make_aware(
            timezone.datetime.combine(
                instance.appointment_date,
                instance.appointment_time
            )
        ) - timedelta(hours=24)
        
        context_data = NotificationTemplateService.get_default_context(
            user=instance.patient.user,
            patient=instance.patient
        )
        context_data.update({
            'appointment_date': instance.appointment_date.strftime('%B %d, %Y'),
            'appointment_time': instance.appointment_time.strftime('%I:%M %p'),
            'doctor_name': instance.doctor.get_full_name(),
            'appointment_type': instance.appointment_type,
            'location': instance.location or 'USC Health Services'
        })
        
        NotificationService.create_from_template(
            template=template,
            recipient=instance.patient.user,
            context_data=context_data,
            priority='HIGH',
            delivery_method='BOTH',
            scheduled_at=reminder_time,
            patient=instance.patient,
            action_url=f'/appointments/{instance.id}',
            action_text='View Appointment'
        )
"""


# Signal for creating default notification templates
@receiver(post_save, sender=NotificationTemplate)
def log_template_creation(sender, instance, created, **kwargs):
    """Log when new templates are created"""
    if created:
        print(f"New notification template created: {instance.name} ({instance.template_type})")


def create_default_templates():
    """Create default notification templates"""
    
    default_templates = [
        {
            'name': 'Health Campaign Notification',
            'template_type': 'HEALTH_CAMPAIGN',
            'subject_template': 'Health Campaign: {{campaign_title}}',
            'body_template': '''Dear {{user_first_name}},

{{clinic_name}} is pleased to announce our latest health campaign:

{{campaign_title}}

{{campaign_description}}

Campaign Details:
- Start Date: {{campaign_start_date}}
- End Date: {{campaign_end_date}}
- Eligibility: {{eligibility_criteria}}

To participate or learn more, please contact us or visit our clinic.

Contact Information:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

Stay healthy!
{{clinic_name}} Team''',
            'available_variables': {
                'user_first_name': 'User first name',
                'campaign_title': 'Campaign title',
                'campaign_description': 'Campaign description',
                'campaign_start_date': 'Campaign start date',
                'campaign_end_date': 'Campaign end date',
                'eligibility_criteria': 'Eligibility criteria',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email'
            }
        },
        {
            'name': 'Clinic Update Notification',
            'template_type': 'CLINIC_UPDATE',
            'subject_template': 'Important Update from {{clinic_name}}',
            'body_template': '''Dear {{user_first_name}},

We have an important update to share with you:

{{update_title}}

{{update_content}}

This update is effective immediately. If you have any questions or concerns, please don't hesitate to contact us.

Contact Information:
Phone: {{clinic_phone}}
Email: {{clinic_email}}
Website: {{clinic_website}}

Thank you for your attention.

{{clinic_name}} Team''',
            'available_variables': {
                'user_first_name': 'User first name',
                'update_title': 'Update title',
                'update_content': 'Update content',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email',
                'clinic_website': 'Clinic website'
            }
        },
        {
            'name': 'Follow-up Reminder',
            'template_type': 'FOLLOW_UP',
            'subject_template': 'Follow-up Reminder: {{follow_up_type}}',
            'body_template': '''Dear {{patient_first_name}},

This is a reminder about your scheduled follow-up:

Follow-up Type: {{follow_up_type}}
Recommended Date: {{recommended_date}}
Previous Visit: {{previous_visit_date}}
Doctor: {{doctor_name}}

Please schedule your follow-up appointment at your earliest convenience. Early detection and regular monitoring are key to maintaining good health.

To schedule your appointment:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

{{clinic_name}}''',
            'available_variables': {
                'patient_first_name': 'Patient first name',
                'follow_up_type': 'Type of follow-up',
                'recommended_date': 'Recommended follow-up date',
                'previous_visit_date': 'Previous visit date',
                'doctor_name': 'Doctor name',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email'
            }
        },
        {
            'name': 'Dental Checkup Reminder',
            'template_type': 'DENTAL_REMINDER',
            'subject_template': 'Dental Checkup Reminder',
            'body_template': '''Dear {{patient_first_name}},

It's time for your regular dental checkup!

Last Dental Visit: {{last_dental_visit}}
Recommended Next Visit: {{recommended_date}}

Regular dental checkups are essential for maintaining good oral health and preventing dental problems.

Our dental services include:
- Routine cleanings
- Dental examinations
- X-rays
- Preventive care

To schedule your dental appointment:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

{{clinic_name}} Dental Services''',
            'available_variables': {
                'patient_first_name': 'Patient first name',
                'last_dental_visit': 'Last dental visit date',
                'recommended_date': 'Recommended next visit date',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email'
            }
        }
    ]
    
    created_count = 0
    for template_data in default_templates:
        template, created = NotificationTemplate.objects.get_or_create(
            name=template_data['name'],
            template_type=template_data['template_type'],
            defaults=template_data
        )
        if created:
            created_count += 1
    
    return created_count