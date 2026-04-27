from django.core.management.base import BaseCommand
from medical_certificates.models import CertificateTemplate
import os

class Command(BaseCommand):
    help = 'Seeds the Tours & Off-Campus medical certificate template'

    def handle(self, *args, **options):
        # Path relative to this file's directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        template_path = os.path.join(base_dir, 'templates', 'tours_off_campus.html')
        
        if not os.path.exists(template_path):
            # Fallback for different execution contexts
            template_path = 'medical_certificates/templates/tours_off_campus.html'
            if not os.path.exists(template_path):
                template_path = 'backend/medical_certificates/templates/tours_off_campus.html'
        
        if not os.path.exists(template_path):
            self.stdout.write(self.style.ERROR(f'Template file not found at {template_path}'))
            return

        with open(template_path, 'r') as f:
            content = f.read()

        name = 'USC Clinic Template'
        description = 'Standard medical certificate for tours and off-campus activities (USC Form ACA-HSD-04F)'

        template, created = CertificateTemplate.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'content': content
            }
        )

        if not created:
            template.description = description
            template.content = content
            template.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated template: {name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully created template: {name}'))
