# Generated manually to migrate existing data

from django.db import migrations


def migrate_existing_certificates(apps, schema_editor):
    """
    Migrate existing medical certificates to use new fitness status system.
    Set all existing certificates to 'fit' status by default.
    """
    MedicalCertificate = apps.get_model('medical_certificates', 'MedicalCertificate')
    
    # Update all existing certificates to have fitness_status = 'fit'
    # Since we can't determine the fitness status from existing data,
    # we'll default to 'fit' and let doctors update as needed
    MedicalCertificate.objects.filter(fitness_status__isnull=True).update(
        fitness_status='fit'
    )


def reverse_migrate_existing_certificates(apps, schema_editor):
    """
    Reverse migration - no action needed as we're just setting defaults
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('medical_certificates', '0002_add_fitness_status_fields'),
    ]

    operations = [
        migrations.RunPython(
            migrate_existing_certificates,
            reverse_migrate_existing_certificates
        ),
    ]