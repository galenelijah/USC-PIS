import django.core.validators
from django.db import migrations, models

def get_storage():
    try:
        import cloudinary_storage.storage
        return cloudinary_storage.storage.RawMediaCloudinaryStorage()
    except (ImportError, Exception):
        return None

class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0004_alter_reporttemplate_report_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='generatedreport',
            name='file_path',
            field=models.FileField(blank=True, max_length=255, null=True, storage=get_storage(), upload_to='reports/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['pdf', 'xlsx', 'csv', 'json', 'html'])]),
        ),
    ]
