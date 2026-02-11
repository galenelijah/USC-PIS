from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

def delete_orphaned_patients(apps, schema_editor):
    """
    Deletes Patient records that were previously linked to a User but now have user=NULL
    because the User was deleted while on_delete was SET_NULL.
    """
    Patient = apps.get_model('patients', 'Patient')
    # We target patients with user=None. 
    # Note: Only students typically have users, but if an admin deleted a student
    # previously, the patient remains with user_id IS NULL.
    # We delete them to clean up the 'Patients' page.
    orphaned_count = Patient.objects.filter(user__isnull=True).delete()[0]
    print(f"Cleaned up {orphaned_count} orphaned patient records.")

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0007_add_performance_indexes'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Clean up existing orphaned records first
        migrations.RunPython(delete_orphaned_patients, migrations.RunPython.noop),
        
        # 2. Update the field to use CASCADE for future deletions
        migrations.AlterField(
            model_name='patient',
            name='user',
            field=models.OneToOneField(
                blank=True, 
                null=True, 
                on_delete=django.db.models.deletion.CASCADE, 
                related_name='patient_profile', 
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
