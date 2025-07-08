from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from authentication.models import User
from patients.models import Patient
from .models import NotificationPreference, NotificationTemplate
from .services import NotificationService, NotificationTemplateService


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """Create default notification preferences for new users"""
    if created:
        NotificationPreference.objects.get_or_create(
            user=instance,
            defaults={
                'email_enabled': True,
                'in_app_enabled': True,
                'appointment_reminders': True,
                'medication_reminders': True,
                'health_campaigns': True,
                'clinic_updates': True,
                'follow_up_reminders': True,
                'vaccination_reminders': True,
                'dental_reminders': True,
                'desktop_notifications': True,
                'sound_enabled': False,
                'digest_frequency': 'IMMEDIATE',
                'language_preference': 'en',
                'timezone': 'UTC'
            }
        )


@receiver(post_save, sender=Patient)
def send_welcome_notification(sender, instance, created, **kwargs):
    """Send welcome notification to new patients"""
    if created:
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
- Schedule appointments
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
        context_data = NotificationTemplateService.get_default_context(
            user=instance.user,
            patient=instance
        )
        
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
            'name': 'Appointment Reminder - 24 Hours',
            'template_type': 'APPOINTMENT_REMINDER',
            'subject_template': 'Appointment Reminder: {{appointment_date}} at {{appointment_time}}',
            'body_template': '''Dear {{patient_first_name}},

This is a reminder that you have an appointment scheduled:

Date: {{appointment_date}}
Time: {{appointment_time}}
Doctor: {{doctor_name}}
Type: {{appointment_type}}
Location: {{location}}

Please arrive 15 minutes early for check-in. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Contact Information:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

Thank you,
{{clinic_name}}''',
            'available_variables': {
                'patient_first_name': 'Patient first name',
                'appointment_date': 'Appointment date',
                'appointment_time': 'Appointment time',
                'doctor_name': 'Doctor name',
                'appointment_type': 'Type of appointment',
                'location': 'Appointment location',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email'
            }
        },
        {
            'name': 'Medication Reminder',
            'template_type': 'MEDICATION_REMINDER',
            'subject_template': 'Medication Reminder: {{medication_name}}',
            'body_template': '''Dear {{patient_first_name}},

This is a reminder to take your medication:

Medication: {{medication_name}}
Dosage: {{dosage}}
Time: {{scheduled_time}}
Instructions: {{instructions}}

Important: Please follow your prescribed medication schedule. If you have any questions or concerns, contact your healthcare provider.

Contact Information:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

{{clinic_name}}''',
            'available_variables': {
                'patient_first_name': 'Patient first name',
                'medication_name': 'Name of medication',
                'dosage': 'Medication dosage',
                'scheduled_time': 'Scheduled time',
                'instructions': 'Special instructions',
                'clinic_name': 'Clinic name',
                'clinic_phone': 'Clinic phone',
                'clinic_email': 'Clinic email'
            }
        },
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
            'name': 'Vaccination Reminder',
            'template_type': 'VACCINATION_REMINDER',
            'subject_template': 'Vaccination Reminder: {{vaccine_name}}',
            'body_template': '''Dear {{patient_first_name}},

This is a reminder that you are due for a vaccination:

Vaccine: {{vaccine_name}}
Due Date: {{due_date}}
Previous Vaccination: {{previous_vaccination_date}}

Staying up-to-date with vaccinations is important for your health and the health of our community.

To schedule your vaccination appointment:
Phone: {{clinic_phone}}
Email: {{clinic_email}}

{{clinic_name}}''',
            'available_variables': {
                'patient_first_name': 'Patient first name',
                'vaccine_name': 'Name of vaccine',
                'due_date': 'Vaccination due date',
                'previous_vaccination_date': 'Previous vaccination date',
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