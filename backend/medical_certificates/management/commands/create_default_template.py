from django.core.management.base import BaseCommand
from medical_certificates.models import CertificateTemplate
import os

class Command(BaseCommand):
    help = 'Creates the default medical certificate template'

    def handle(self, *args, **kwargs):
        # Path relative to this file's directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        template_path = os.path.join(base_dir, 'templates', 'default_template.html')

        if not os.path.exists(template_path):
            # Fallback for different execution contexts
            template_path = 'medical_certificates/templates/default_template.html'
            if not os.path.exists(template_path):
                template_path = 'backend/medical_certificates/templates/default_template.html'

        try:
            with open(template_path, 'r', encoding='utf-8') as file:
                template_content = file.read()
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Template file not found at {template_path}'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading template file: {str(e)}'))
            return

        # Create or update the template
        try:
            name = 'Default Medical Certificate'
            description = 'Standard medical certificate template for USC Health Services Department'

            template, created = CertificateTemplate.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'content': template_content
                }
            )

            if not created:
                template.content = template_content
                template.save()
                self.stdout.write(self.style.SUCCESS(f'Successfully updated default template (ID: {template.id})'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Successfully created default template (ID: {template.id})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error saving template: {str(e)}')) 
 