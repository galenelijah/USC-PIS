from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0008_update_patient_user_cascade_and_cleanup'),
    ]

    operations = [
        migrations.AlterField(
            model_name='medicalrecord',
            name='visit_date',
            field=models.DateTimeField(),
        ),
        migrations.AlterField(
            model_name='dentalrecord',
            name='visit_date',
            field=models.DateTimeField(),
        ),
    ]
