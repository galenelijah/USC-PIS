"""
Enhanced management command for automatically sending feedback request emails
Designed to be run daily via cron job or task scheduler
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from patients.models import MedicalRecord, DentalRecord
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Automatically send feedback request emails for recent medical visits'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Send feedback requests for visits from X hours ago (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview emails that would be sent without actually sending them'
        )
        parser.add_argument(
            '--immediate',
            action='store_true',
            help='Send feedback emails for visits from the last hour (for testing)'
        )

    def handle(self, *args, **options):
        hours_ago = options['hours']
        dry_run = options['dry_run']
        immediate = options['immediate']
        
        if immediate:
            hours_ago = 1  # Send for visits from last hour
        
        # Calculate the cutoff time (records created older than this)
        cutoff_time = timezone.now() - timedelta(hours=hours_ago)
        # Add an upper bound (don't go back more than 14 days) to avoid spamming very old records
        max_age_time = timezone.now() - timedelta(days=14)
        
        self.stdout.write(f"Looking for records created between {max_age_time} and {cutoff_time} that haven't received feedback reminders")
        
        # Get medical records that need feedback reminders
        # We check feedback_reminder_sent and also ensure no feedback has been submitted yet
        medical_visits = MedicalRecord.objects.filter(
            created_at__gte=max_age_time,
            created_at__lte=cutoff_time,
            patient__user__isnull=False,      # Only patients with user accounts
            feedback_reminder_sent=False,     # Haven't sent reminder yet
            feedbacks__isnull=True            # Exclude if feedback already provided
        ).select_related('patient', 'patient__user')
        
        # Get dental records that need feedback reminders
        dental_visits = DentalRecord.objects.filter(
            created_at__gte=max_age_time,
            created_at__lte=cutoff_time,
            patient__user__isnull=False,      # Only patients with user accounts
            feedback_reminder_sent=False,     # Haven't sent reminder yet
            feedbacks__isnull=True            # Exclude if feedback already provided
        ).select_related('patient', 'patient__user')
        
        total_visits = medical_visits.count() + dental_visits.count()
        
        if total_visits == 0:
            self.stdout.write(
                self.style.WARNING(f'No records found requiring reminders in the specified time window.')
            )
            return
        
        self.stdout.write(f"Found {medical_visits.count()} medical records and {dental_visits.count()} dental records requiring reminders")
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No emails will be sent'))
        
        sent_count = 0
        error_count = 0
        
        # Process medical visits
        for visit in medical_visits:
            try:
                patient_email = visit.patient.user.email
                self.stdout.write(f"Sending 24h reminder for medical visit {visit.id} to {patient_email}")
                
                if dry_run:
                    self.stdout.write(self.style.SUCCESS(f'  - Would send reminder to {patient_email}'))
                    sent_count += 1
                else:
                    # Use a slightly different subject for the reminder
                    success = EmailService.send_template_email(
                        template_name='feedback_request',
                        context={
                            'patient': visit.patient,
                            'medical_record': visit,
                            'feedback_url': f'{settings.SITE_URL}/feedback/{visit.id}?type=medical',
                            'is_reminder': True
                        },
                        recipient_email=patient_email,
                        subject='Reminder: We value your feedback - USC-PIS'
                    )
                    
                    if success:
                        visit.feedback_reminder_sent = True
                        visit.save(update_fields=['feedback_reminder_sent'])
                        sent_count += 1
                        self.stdout.write(self.style.SUCCESS(f'  - Reminder sent successfully'))
                    else:
                        error_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  - Error: {str(e)}'))
                error_count += 1

        # Process dental visits
        for visit in dental_visits:
            try:
                patient_email = visit.patient.user.email
                self.stdout.write(f"Sending 24h reminder for dental visit {visit.id} to {patient_email}")
                
                if dry_run:
                    self.stdout.write(self.style.SUCCESS(f'  - Would send reminder to {patient_email}'))
                    sent_count += 1
                else:
                    success = EmailService.send_template_email(
                        template_name='feedback_request',
                        context={
                            'patient': visit.patient,
                            'medical_record': visit,
                            'feedback_url': f'{settings.SITE_URL}/feedback/{visit.id}?type=dental',
                            'is_reminder': True
                        },
                        recipient_email=patient_email,
                        subject='Reminder: Share your experience - USC-PIS'
                    )
                    
                    if success:
                        visit.feedback_reminder_sent = True
                        visit.save(update_fields=['feedback_reminder_sent'])
                        sent_count += 1
                        self.stdout.write(self.style.SUCCESS(f'  - Reminder sent successfully'))
                    else:
                        error_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  - Error: {str(e)}'))
                error_count += 1
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'\nDRY RUN COMPLETE: Would have sent {sent_count} emails')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nCOMPLETE: Sent {sent_count} feedback emails')
            )
        
        if error_count > 0:
            self.stdout.write(
                self.style.ERROR(f'Errors encountered: {error_count}')
            )
        
        # Log the results
        logger.info(f"Feedback email job completed: {sent_count} sent, {error_count} errors")