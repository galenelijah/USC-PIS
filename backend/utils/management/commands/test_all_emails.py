"""
Management command to test all automated email notifications
This command tests every email type in the system
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from authentication.models import User
from patients.models import Patient, MedicalRecord
from medical_certificates.models import MedicalCertificate, CertificateTemplate
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test all automated email notifications in the USC-PIS system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address to send test emails to'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what emails would be sent without actually sending them'
        )
        parser.add_argument(
            '--test-type',
            choices=['all', 'welcome', 'password-reset', 'certificates', 'feedback', 'health-alert'],
            default='all',
            help='Specify which type of email to test (default: all)'
        )

    def handle(self, *args, **options):
        test_email = options['email']
        dry_run = options['dry_run']
        test_type = options['test_type']
        
        self.stdout.write(f"Testing email notifications for: {test_email}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No emails will be sent"))
        
        results = {
            'sent': 0,
            'failed': 0,
            'skipped': 0
        }
        
        # Test 1: Welcome Email
        if test_type in ['all', 'welcome']:
            results.update(self._test_welcome_email(test_email, dry_run))
        
        # Test 2: Password Reset Email
        if test_type in ['all', 'password-reset']:
            results.update(self._test_password_reset_email(test_email, dry_run))
        
        # Test 3: Medical Certificate Emails
        if test_type in ['all', 'certificates']:
            results.update(self._test_certificate_emails(test_email, dry_run))
        
        # Test 4: Feedback Request Email
        if test_type in ['all', 'feedback']:
            results.update(self._test_feedback_email(test_email, dry_run))
        
        # Test 5: Health Alert Email
        if test_type in ['all', 'health-alert']:
            results.update(self._test_health_alert_email(test_email, dry_run))
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("EMAIL TEST SUMMARY")
        self.stdout.write("="*50)
        self.stdout.write(f"Sent: {results['sent']}")
        self.stdout.write(f"Failed: {results['failed']}")
        self.stdout.write(f"Skipped: {results['skipped']}")
        
        if results['failed'] > 0:
            self.stdout.write(self.style.ERROR(f"[WARNING] {results['failed']} email tests failed"))
        else:
            self.stdout.write(self.style.SUCCESS("[SUCCESS] All email tests completed successfully"))

    def _test_welcome_email(self, test_email, dry_run):
        """Test welcome email"""
        self.stdout.write("\nTesting Welcome Email...")
        
        try:
            # Create a test user object
            class TestUser:
                def __init__(self, email):
                    self.email = email
                    self.first_name = "Test"
                    self.last_name = "User"
                    self.get_full_name = lambda: f"{self.first_name} {self.last_name}"
            
            test_user = TestUser(test_email)
            
            if dry_run:
                self.stdout.write(f"  - Would send welcome email to {test_email}")
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            
            success = EmailService.send_welcome_email(test_user)
            
            if success:
                self.stdout.write(self.style.SUCCESS(f"  [OK] Welcome email sent to {test_email}"))
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            else:
                self.stdout.write(self.style.ERROR(f"  [FAIL] Failed to send welcome email to {test_email}"))
                return {'sent': 0, 'failed': 1, 'skipped': 0}
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  [ERROR] Welcome email test error: {str(e)}"))
            return {'sent': 0, 'failed': 1, 'skipped': 0}

    def _test_password_reset_email(self, test_email, dry_run):
        """Test password reset email"""
        self.stdout.write("\nTesting Password Reset Email...")
        
        try:
            # Create a test user object
            class TestUser:
                def __init__(self, email):
                    self.email = email
                    self.first_name = "Test"
                    self.last_name = "User"
                    self.get_full_name = lambda: f"{self.first_name} {self.last_name}"
            
            test_user = TestUser(test_email)
            reset_url = "https://usc-pis-5f030223f7a8.herokuapp.com/reset-password?token=test-token-123"
            
            if dry_run:
                self.stdout.write(f"  - Would send password reset email to {test_email}")
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            
            success = EmailService.send_password_reset_email(test_user, reset_url)
            
            if success:
                self.stdout.write(self.style.SUCCESS(f"  [OK] Password reset email sent to {test_email}"))
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            else:
                self.stdout.write(self.style.ERROR(f"  [FAIL] Failed to send password reset email to {test_email}"))
                return {'sent': 0, 'failed': 1, 'skipped': 0}
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  [ERROR] Password reset email test error: {str(e)}"))
            return {'sent': 0, 'failed': 1, 'skipped': 0}

    def _test_certificate_emails(self, test_email, dry_run):
        """Test medical certificate emails"""
        self.stdout.write("\nTesting Medical Certificate Emails...")
        
        results = {'sent': 0, 'failed': 0, 'skipped': 0}
        
        try:
            # Create mock objects for testing
            class TestPatient:
                def __init__(self, email):
                    self.first_name = "Test"
                    self.last_name = "Patient"
                    self.email = email
                    self.user = TestUser(email)
                    self.get_full_name = lambda: f"{self.first_name} {self.last_name}"
            
            class TestUser:
                def __init__(self, email):
                    self.email = email
                    self.first_name = "Test"
                    self.last_name = "User"
            
            class TestCertificate:
                def __init__(self, patient):
                    self.patient = patient
                    self.id = 999
                    self.purpose = "Testing Email System"
                    self.created_at = timezone.now()
            
            test_patient = TestPatient(test_email)
            test_certificate = TestCertificate(test_patient)
            
            # Test certificate creation email
            if dry_run:
                self.stdout.write(f"  - Would send certificate creation email to {test_email}")
                results['sent'] += 1
            else:
                try:
                    EmailService.send_medical_certificate_notification(test_certificate, 'created')
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Certificate creation email sent to {test_email}"))
                    results['sent'] += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [FAIL] Certificate creation email failed: {str(e)}"))
                    results['failed'] += 1
            
            # Test certificate approval email
            if dry_run:
                self.stdout.write(f"  - Would send certificate approval email to {test_email}")
                results['sent'] += 1
            else:
                try:
                    EmailService.send_medical_certificate_notification(test_certificate, 'approved')
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Certificate approval email sent to {test_email}"))
                    results['sent'] += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [FAIL] Certificate approval email failed: {str(e)}"))
                    results['failed'] += 1
            
            # Test certificate rejection email
            if dry_run:
                self.stdout.write(f"  - Would send certificate rejection email to {test_email}")
                results['sent'] += 1
            else:
                try:
                    EmailService.send_medical_certificate_notification(test_certificate, 'rejected')
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Certificate rejection email sent to {test_email}"))
                    results['sent'] += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [FAIL] Certificate rejection email failed: {str(e)}"))
                    results['failed'] += 1
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  [ERROR] Certificate email test error: {str(e)}"))
            results['failed'] += 1
        
        return results

    def _test_feedback_email(self, test_email, dry_run):
        """Test feedback request email"""
        self.stdout.write("\nTesting Feedback Request Email...")
        
        try:
            # Create mock objects for testing
            class TestPatient:
                def __init__(self, email):
                    self.first_name = "Test"
                    self.last_name = "Patient"
                    self.email = email
                    self.user = TestUser(email)
                    self.get_full_name = lambda: f"{self.first_name} {self.last_name}"
            
            class TestUser:
                def __init__(self, email):
                    self.email = email
                    self.first_name = "Test"
                    self.last_name = "User"
            
            class TestMedicalRecord:
                def __init__(self, patient):
                    self.patient = patient
                    self.id = 999
                    self.visit_date = timezone.now().date()
                    self.diagnosis = "Test diagnosis for email system"
                    self.treatment = "Test treatment for email system"
            
            test_patient = TestPatient(test_email)
            test_record = TestMedicalRecord(test_patient)
            
            if dry_run:
                self.stdout.write(f"  - Would send feedback request email to {test_email}")
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            
            success = EmailService.send_feedback_request_email(test_record)
            
            if success:
                self.stdout.write(self.style.SUCCESS(f"  [SUCCESS] Feedback request email sent to {test_email}"))
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            else:
                self.stdout.write(self.style.ERROR(f"  [FAILED] Failed to send feedback request email to {test_email}"))
                return {'sent': 0, 'failed': 1, 'skipped': 0}
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  [ERROR] Feedback email test error: {str(e)}"))
            return {'sent': 0, 'failed': 1, 'skipped': 0}

    def _test_health_alert_email(self, test_email, dry_run):
        """Test system health alert email"""
        self.stdout.write("\nTesting System Health Alert Email...")
        
        try:
            from django.core.management import call_command
            from io import StringIO
            
            # Test the health alert command with force-alert option
            if dry_run:
                self.stdout.write(f"  - Would send health alert email to {test_email}")
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            
            # Run the health check alert command with force-alert
            out = StringIO()
            call_command('health_check_alerts', '--force-alert', stdout=out)
            
            output = out.getvalue()
            if "Alert email sent" in output:
                self.stdout.write(self.style.SUCCESS(f"  [OK] Health alert email sent to administrators"))
                return {'sent': 1, 'failed': 0, 'skipped': 0}
            else:
                self.stdout.write(self.style.ERROR(f"  [FAIL] Health alert email may have failed"))
                return {'sent': 0, 'failed': 1, 'skipped': 0}
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  [ERROR] Health alert email test error: {str(e)}"))
            return {'sent': 0, 'failed': 1, 'skipped': 0}