"""
Management command to test email functionality
Usage: python manage.py test_email --email your@email.com
"""
from django.core.management.base import BaseCommand
from utils.email_service import EmailService
from authentication.models import User

class Command(BaseCommand):
    help = 'Test email functionality by sending a test email'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address to send test email to'
        )
        parser.add_argument(
            '--type',
            type=str,
            default='welcome',
            choices=['welcome', 'password_reset', 'test'],
            help='Type of email to send (default: welcome)'
        )
    
    def handle(self, *args, **options):
        email = options['email']
        email_type = options['type']
        
        self.stdout.write(f"Testing email functionality...")
        self.stdout.write(f"Recipient: {email}")
        self.stdout.write(f"Email type: {email_type}")
        
        try:
            if email_type == 'welcome':
                # Create a temporary user object for testing
                test_user = type('User', (), {
                    'email': email,
                    'first_name': 'Test',
                    'last_name': 'User'
                })()
                
                success = EmailService.send_welcome_email(test_user)
                
            elif email_type == 'test':
                # Send a basic test email
                success = EmailService.send_template_email(
                    template_name='welcome',  # Reuse welcome template for testing
                    context={
                        'user': {
                            'email': email,
                            'first_name': 'Test'
                        },
                        'site_url': 'https://usc-pis.herokuapp.com',
                        'support_email': 'support@usc-pis.herokuapp.com'
                    },
                    recipient_email=email,
                    subject='USC-PIS Email Test'
                )
                
            elif email_type == 'password_reset':
                test_user = type('User', (), {
                    'email': email,
                    'first_name': 'Test'
                })()
                
                success = EmailService.send_password_reset_email(
                    test_user,
                    'https://usc-pis.herokuapp.com/reset-password/test-token'
                )
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Test email sent successfully to {email}")
                )
                self.stdout.write("Check your inbox (and spam folder) for the test email.")
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ Failed to send test email to {email}")
                )
                self.stdout.write("Check your email configuration and SMTP settings.")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error sending test email: {str(e)}")
            )
            self.stdout.write("Check your email configuration in settings.py")
            
        # Show current email settings
        from django.conf import settings
        self.stdout.write("\n📧 Current Email Configuration:")
        self.stdout.write(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
        self.stdout.write(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
        self.stdout.write(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
        
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  You're using console email backend. "
                    "Emails will be printed to console instead of sent."
                )
            )