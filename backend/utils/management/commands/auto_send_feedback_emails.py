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
        
        # Calculate the time window
        cutoff_time = timezone.now() - timedelta(hours=hours_ago)
        end_time = timezone.now() - timedelta(hours=hours_ago-1) if not immediate else timezone.now()
        
        self.stdout.write(f"Looking for visits between {cutoff_time} and {end_time}")
        
        # Get medical visits that need feedback emails
        medical_visits = MedicalRecord.objects.filter(
            visit_date__gte=cutoff_time.date(),
            visit_date__lte=end_time.date(),
            patient__user__isnull=False  # Only patients with user accounts
        ).select_related('patient', 'patient__user')
        
        # Get dental visits that need feedback emails
        dental_visits = DentalRecord.objects.filter(
            visit_date__gte=cutoff_time.date(),
            visit_date__lte=end_time.date(),
            patient__user__isnull=False  # Only patients with user accounts
        ).select_related('patient', 'patient__user')
        
        total_visits = medical_visits.count() + dental_visits.count()
        
        if total_visits == 0:
            self.stdout.write(
                self.style.WARNING(f'No visits found in the specified time window.')
            )
            return
        
        self.stdout.write(f"Found {medical_visits.count()} medical visits and {dental_visits.count()} dental visits")
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No emails will be sent'))
        
        sent_count = 0
        error_count = 0
        
        # Process medical visits
        for visit in medical_visits:
            try:
                patient_email = visit.patient.user.email
                self.stdout.write(f"Processing medical visit for {visit.patient.get_full_name()} ({patient_email})")
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'  - Would send feedback email to {patient_email}')
                    )
                    sent_count += 1
                else:
                    # Send the feedback request email
                    success = EmailService.send_feedback_request_email(visit)
                    
                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(f'  - Sent feedback email to {patient_email}')
                        )
                        sent_count += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'  - Failed to send email to {patient_email}')
                        )
                        error_count += 1
                        
            except Exception as e:
                error_msg = f"Error processing medical visit {visit.id}: {str(e)}"
                self.stdout.write(self.style.ERROR(f'  - {error_msg}'))
                logger.error(error_msg)
                error_count += 1
        
        # Process dental visits
        for visit in dental_visits:
            try:
                patient_email = visit.patient.user.email
                self.stdout.write(f"Processing dental visit for {visit.patient.get_full_name()} ({patient_email})")
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'  - Would send feedback email to {patient_email}')
                    )
                    sent_count += 1
                else:
                    # Create a mock medical record for dental visits (EmailService expects MedicalRecord)
                    # We'll enhance the EmailService to handle dental records too
                    class DentalVisitAdapter:
                        def __init__(self, dental_record):
                            self.patient = dental_record.patient
                            self.visit_date = dental_record.visit_date
                            self.id = dental_record.id
                            self.diagnosis = dental_record.diagnosis
                            self.treatment = dental_record.treatment_performed
                    
                    adapted_visit = DentalVisitAdapter(visit)
                    success = EmailService.send_feedback_request_email(adapted_visit)
                    
                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(f'  - Sent feedback email to {patient_email}')
                        )
                        sent_count += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'  - Failed to send email to {patient_email}')
                        )
                        error_count += 1
                        
            except Exception as e:
                error_msg = f"Error processing dental visit {visit.id}: {str(e)}"
                self.stdout.write(self.style.ERROR(f'  - {error_msg}'))
                logger.error(error_msg)
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