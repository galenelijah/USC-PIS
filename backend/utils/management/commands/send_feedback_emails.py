"""
Management command to send automated feedback request emails
Usage: python manage.py send_feedback_emails
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from patients.models import MedicalRecord
from feedback.models import Feedback
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send automated feedback request emails for recent medical visits'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Send emails for visits from X hours ago (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what emails would be sent without actually sending them'
        )
    
    def handle(self, *args, **options):
        hours_ago = options['hours']
        dry_run = options['dry_run']
        
        # Calculate the time range (e.g., 24 hours ago)
        cutoff_time = timezone.now() - timedelta(hours=hours_ago)
        check_time = timezone.now() - timedelta(hours=hours_ago + 1)
        
        # Find medical records from the specified time range
        recent_visits = MedicalRecord.objects.filter(
            visit_date__gte=check_time,
            visit_date__lte=cutoff_time,
            patient__user__isnull=False  # Ensure patient has a user account
        ).select_related('patient', 'patient__user')
        
        self.stdout.write(
            f"Looking for visits between {check_time} and {cutoff_time}"
        )
        self.stdout.write(f"Found {recent_visits.count()} recent visits")
        
        emails_sent = 0
        emails_skipped = 0
        
        for visit in recent_visits:
            try:
                # Check if feedback already exists for this visit
                existing_feedback = Feedback.objects.filter(
                    # You may need to adjust this based on your Feedback model
                    # Assuming you have a way to link feedback to medical records
                    created_at__gte=visit.visit_date,
                    # Add appropriate filtering logic here
                ).exists()
                
                if existing_feedback:
                    self.stdout.write(f"Skipping {visit.patient.user.email} - feedback already provided")
                    emails_skipped += 1
                    continue
                
                if dry_run:
                    self.stdout.write(
                        f"Would send feedback email to: {visit.patient.user.email} "
                        f"for visit on {visit.visit_date}"
                    )
                else:
                    # Send the feedback request email
                    success = EmailService.send_feedback_request_email(visit)
                    
                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Sent feedback email to {visit.patient.user.email}"
                            )
                        )
                        emails_sent += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f"Failed to send email to {visit.patient.user.email}"
                            )
                        )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing visit for {visit.patient.user.email}: {str(e)}"
                    )
                )
                logger.error(f"Error in send_feedback_emails command: {str(e)}")
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run complete. Would send {recent_visits.count() - emails_skipped} emails, "
                    f"skip {emails_skipped} (already have feedback)"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Feedback email campaign complete! "
                    f"Sent: {emails_sent}, Skipped: {emails_skipped}"
                )
            )