from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_default_admin(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    if not User.objects.filter(email='admin@usc-pis.local').exists():
        User.objects.create(
            email='admin@usc-pis.local',
            username='admin@usc-pis.local',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            password=make_password('admin123'),
            completeSetup=True,
        )

class Migration(migrations.Migration):
    dependencies = [
        ('authentication', '0002_alter_user_managers_user_address_permanent_and_more'),
    ]
    operations = [
        migrations.RunPython(create_default_admin),
    ] 