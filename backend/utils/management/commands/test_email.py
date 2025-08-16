"""
Management command to test email functionality with AWS SES or other backends.
"""

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Test email functionality with current email backend'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address to send test email to (required)',
            required=True
        )
        parser.add_argument(
            '--subject',
            type=str,
            default='USC-PIS Email System Test',
            help='Subject line for test email'
        )

    def handle(self, *args, **options):
        email = options['email']
        subject = options['subject']
        
        # Get current email backend info
        backend = settings.EMAIL_BACKEND
        use_aws_ses = os.environ.get('USE_AWS_SES', 'False') == 'True'
        
        self.stdout.write(
            self.style.HTTP_INFO(f'Testing email with backend: {backend}')
        )
        
        if use_aws_ses:
            self.stdout.write(
                self.style.HTTP_INFO(f'AWS SES Region: {getattr(settings, "AWS_SES_REGION_NAME", "Not set")}')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'AWS Access Key: {getattr(settings, "AWS_ACCESS_KEY_ID", "Not set")[:10]}...')
            )
        
        # Test email content
        message = f"""
This is a test email from the USC Patient Information System.

Email Backend: {backend}
Environment: {'Production' if not settings.DEBUG else 'Development'}
From Email: {settings.DEFAULT_FROM_EMAIL}
AWS SES Enabled: {use_aws_ses}

If you received this email, the email system is working correctly!

---
USC-PIS Email System Test
"""

        try:
            # Send test email with USC branding
            self.stdout.write('Sending test email...')
            
            # Create professional display name and headers
            usc_display_name = f"USC Patient Information System <{settings.DEFAULT_FROM_EMAIL}>"
            
            from django.core.mail import EmailMultiAlternatives
            
            msg = EmailMultiAlternatives(
                subject=f"[USC-PIS] {subject}",
                body=message,
                from_email=usc_display_name,
                to=[email]
            )
            
            # Add USC headers
            msg.extra_headers = {
                'Reply-To': 'noreply@usc.edu.ph',
                'X-Mailer': 'USC Patient Information System',
                'Organization': 'University of Southern California'
            }
            
            msg.send()
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Email sent successfully to {email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'📧 From: {settings.DEFAULT_FROM_EMAIL}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'🔧 Backend: {backend}')
            )
            
            if use_aws_ses:
                self.stdout.write(
                    self.style.SUCCESS('☁️ Using AWS SES for delivery')
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Email sending failed: {str(e)}')
            )
            self.stdout.write(
                self.style.ERROR('Check your email configuration and try again.')
            )
            
            # Provide debugging info
            self.stdout.write('\n' + self.style.WARNING('Debugging Information:'))
            self.stdout.write(f'Backend: {backend}')
            self.stdout.write(f'From email: {settings.DEFAULT_FROM_EMAIL}')
            self.stdout.write(f'USE_AWS_SES: {use_aws_ses}')
            
            if use_aws_ses:
                self.stdout.write(f'AWS_ACCESS_KEY_ID: {"Set" if getattr(settings, "AWS_ACCESS_KEY_ID", None) else "Not set"}')
                self.stdout.write(f'AWS_SECRET_ACCESS_KEY: {"Set" if getattr(settings, "AWS_SECRET_ACCESS_KEY", None) else "Not set"}')
                self.stdout.write(f'AWS_SES_REGION_NAME: {getattr(settings, "AWS_SES_REGION_NAME", "Not set")}')