from django.core.management.base import BaseCommand
from django.db import connection
from medical_certificates.models import MedicalCertificate


class Command(BaseCommand):
    help = 'Migrate medical certificates to use new fitness status system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check if migration is needed, don\'t apply changes',
        )

    def handle(self, *args, **options):
        check_only = options['check_only']
        
        self.stdout.write('Checking medical certificate model structure...')
        
        # Check if the new fields exist in the database
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'medical_certificates_medicalcertificate'
                AND column_name IN ('fitness_status', 'fitness_reason', 'approval_status')
            """)
            existing_columns = [row[0] for row in cursor.fetchall()]
        
        if len(existing_columns) == 3:
            self.stdout.write(
                self.style.SUCCESS('✓ New fitness status fields already exist in database')
            )
            
            # Check for any certificates that need fitness status defaults
            certificates_without_fitness = MedicalCertificate.objects.filter(
                fitness_status__isnull=True
            ).count()
            
            if certificates_without_fitness > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'Found {certificates_without_fitness} certificates without fitness status'
                    )
                )
                if not check_only:
                    MedicalCertificate.objects.filter(
                        fitness_status__isnull=True
                    ).update(fitness_status='fit')
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Updated {certificates_without_fitness} certificates to default fitness status'
                        )
                    )
            else:
                self.stdout.write(
                    self.style.SUCCESS('✓ All certificates have fitness status assigned')
                )
                
        else:
            missing_fields = set(['fitness_status', 'fitness_reason', 'approval_status']) - set(existing_columns)
            self.stdout.write(
                self.style.ERROR(
                    f'✗ Missing database fields: {", ".join(missing_fields)}'
                )
            )
            self.stdout.write(
                self.style.WARNING('Please run: python manage.py migrate medical_certificates')
            )
            
        if check_only:
            self.stdout.write('Check complete. Use without --check-only to apply changes.')