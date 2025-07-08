from django.core.management.base import BaseCommand
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Create required directories for the application'

    def handle(self, *args, **options):
        directories_to_create = [
            settings.MEDIA_ROOT,
            settings.STATIC_ROOT,
            getattr(settings, 'FILE_UPLOAD_TEMP_DIR', os.path.join(settings.BASE_DIR, 'temp_uploads')),
        ]

        for directory in directories_to_create:
            if directory and not os.path.exists(directory):
                try:
                    os.makedirs(directory, exist_ok=True)
                    self.stdout.write(
                        self.style.SUCCESS(f'Created directory: {directory}')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to create directory {directory}: {e}')
                    )
            elif directory and os.path.exists(directory):
                self.stdout.write(
                    self.style.SUCCESS(f'Directory already exists: {directory}')
                )

        self.stdout.write(
            self.style.SUCCESS('Directory setup completed')
        ) 