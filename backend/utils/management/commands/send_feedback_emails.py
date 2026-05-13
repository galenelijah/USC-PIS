"""
Management command to send automated feedback request emails
Usage: python manage.py send_feedback_emails
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from patients.models import MedicalRecord, DentalRecord
from feedback.models import Feedback
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send automated feedback request emails for recent medical and dental visits'

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

        self.stdout.write(f"Looking for visits between {check_time} and {cutoff_time}")

        # 1. Medical Records
        medical_visits = MedicalRecord.objects.filter(
            visit_date__gte=check_time,
            visit_date__lte=cutoff_time,
            patient__user__isnull=False,
            feedbacks__isnull=True
        ).select_related('patient', 'patient__user')

        self.stdout.write(f"Found {medical_visits.count()} recent medical visits")
        self._process_visits(medical_visits, 'medical', dry_run)

        # 2. Dental Records
        dental_visits = DentalRecord.objects.filter(
            visit_date__gte=check_time,
            visit_date__lte=cutoff_time,
            patient__user__isnull=False,
            feedbacks__isnull=True
        ).select_related('patient', 'patient__user')

        self.stdout.write(f"Found {dental_visits.count()} recent dental visits")
        self._process_visits(dental_visits, 'dental', dry_run)

    def _process_visits(self, visits, visit_type, dry_run):
        emails_sent = 0
        emails_skipped = 0

        for visit in visits:
            try:
                patient_email = visit.patient.user.email
                if dry_run:
                    self.stdout.write(f"Would send {visit_type} feedback email to: {patient_email}")
                    emails_sent += 1
                else:
                    success = EmailService.send_feedback_request_email(visit)
                    if success:
                        self.stdout.write(self.style.SUCCESS(f"Sent {visit_type} feedback email to {patient_email}"))
                        emails_sent += 1
                    else:
                        self.stdout.write(self.style.ERROR(f"Failed to send {visit_type} email to {patient_email}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing {visit_type} visit for {visit.patient.user.email}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Finished {visit_type}. Sent: {emails_sent}"))