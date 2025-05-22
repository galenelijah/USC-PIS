from django.core.management.base import BaseCommand
from medical_certificates.models import CertificateTemplate
import os

class Command(BaseCommand):
    help = 'Creates the default medical certificate template'

    def handle(self, *args, **kwargs):
        # Check if default template already exists
        if CertificateTemplate.objects.filter(name='Default Medical Certificate').exists():
            self.stdout.write(self.style.WARNING('Default template already exists'))
            return

        # Read the template file
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'templates',
            'default_template.html'
        )

        try:
            with open(template_path, 'r', encoding='utf-8') as file:
                template_content = file.read()
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Template file not found at {template_path}'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading template file: {str(e)}'))
            return

        # Create the template
        try:
            template = CertificateTemplate.objects.create(
                name='Default Medical Certificate',
                description='Standard medical certificate template for USC Health Services Department',
                content=template_content
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created default template (ID: {template.id})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating template: {str(e)}')) 