# Generated manually for fitness status fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical_certificates', '0001_initial'),
    ]

    operations = [
        # Add fitness status field
        migrations.AddField(
            model_name='medicalcertificate',
            name='fitness_status',
            field=models.CharField(
                choices=[('fit', 'Fit'), ('not_fit', 'Not Fit')],
                default='fit',
                help_text='Medical fitness determination: Fit or Not Fit',
                max_length=20
            ),
        ),
        # Add fitness reason field
        migrations.AddField(
            model_name='medicalcertificate',
            name='fitness_reason',
            field=models.TextField(
                blank=True,
                help_text='Reason for fitness status, especially important for Not Fit determinations'
            ),
        ),
        # Rename status to approval_status
        migrations.RenameField(
            model_name='medicalcertificate',
            old_name='status',
            new_name='approval_status',
        ),
        # Update the approval_status field help text
        migrations.AlterField(
            model_name='medicalcertificate',
            name='approval_status',
            field=models.CharField(
                choices=[('draft', 'Draft'), ('pending', 'Pending Approval'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                default='draft',
                help_text='Administrative approval status for the certificate',
                max_length=20
            ),
        ),
    ]