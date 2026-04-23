from django.db import migrations, models

def rename_teacher_to_faculty(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    SafeEmail = apps.get_model('authentication', 'SafeEmail')
    
    # Update Users
    User.objects.filter(role='TEACHER').update(role='FACULTY')
    User.objects.filter(requested_role='TEACHER').update(requested_role='FACULTY')
    
    # Update SafeEmails
    SafeEmail.objects.filter(role='TEACHER').update(role='FACULTY')

def reverse_rename(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    SafeEmail = apps.get_model('authentication', 'SafeEmail')
    
    # Revert Users
    User.objects.filter(role='FACULTY').update(role='TEACHER')
    User.objects.filter(requested_role='FACULTY').update(requested_role='TEACHER')
    
    # Revert SafeEmails
    SafeEmail.objects.filter(role='FACULTY').update(role='TEACHER')

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0009_safeemail_role_user_requested_role'),
    ]

    operations = [
        # Data migration to update existing records
        migrations.RunPython(rename_teacher_to_faculty, reverse_rename),
        
        # Update field definitions (choices labels and database values)
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('ADMIN', 'Admin'), ('DOCTOR', 'Doctor'), ('DENTIST', 'Dentist'), ('NURSE', 'Nurse'), ('STAFF', 'Staff'), ('STUDENT', 'Student'), ('FACULTY', 'Faculty')], default='STUDENT', max_length=10),
        ),
        migrations.AlterField(
            model_name='user',
            name='requested_role',
            field=models.CharField(blank=True, choices=[('ADMIN', 'Admin'), ('DOCTOR', 'Doctor'), ('DENTIST', 'Dentist'), ('NURSE', 'Nurse'), ('STAFF', 'Staff'), ('STUDENT', 'Student'), ('FACULTY', 'Faculty')], max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='safeemail',
            name='role',
            field=models.CharField(choices=[('ADMIN', 'Admin'), ('DOCTOR', 'Doctor'), ('DENTIST', 'Dentist'), ('NURSE', 'Nurse'), ('STAFF', 'Staff'), ('STUDENT', 'Student'), ('FACULTY', 'Faculty')], default='STUDENT', help_text='Role to automatically assign when this user registers', max_length=10),
        ),
    ]
