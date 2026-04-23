from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0009_update_visit_date_to_datetime'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalrecord',
            name='concern',
            field=models.TextField(default='', help_text='Reason for visit / Chief complaint'),
        ),
    ]
