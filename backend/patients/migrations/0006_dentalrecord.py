# Generated by Django 5.0.2 on 2025-07-04 13:36

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0005_medicalrecord_physical_examination_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DentalRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('visit_date', models.DateField()),
                ('procedure_performed', models.CharField(choices=[('CLEANING', 'Dental Cleaning'), ('FILLING', 'Dental Filling'), ('EXTRACTION', 'Tooth Extraction'), ('ROOT_CANAL', 'Root Canal Treatment'), ('CROWN', 'Crown Placement'), ('BRIDGE', 'Bridge Work'), ('IMPLANT', 'Dental Implant'), ('ORTHODONTIC', 'Orthodontic Treatment'), ('PERIODONTAL', 'Periodontal Treatment'), ('PROPHYLAXIS', 'Prophylaxis'), ('FLUORIDE', 'Fluoride Treatment'), ('SEALANT', 'Dental Sealant'), ('WHITENING', 'Teeth Whitening'), ('CONSULTATION', 'Dental Consultation'), ('XRAY', 'Dental X-Ray'), ('OTHER', 'Other Procedure')], max_length=20)),
                ('tooth_numbers', models.CharField(blank=True, help_text='Comma-separated tooth numbers (e.g., 11,12,21)', max_length=200)),
                ('diagnosis', models.TextField(help_text='Dental diagnosis and findings')),
                ('treatment_performed', models.TextField(help_text='Treatment performed during this visit')),
                ('treatment_plan', models.TextField(blank=True, help_text='Future treatment plan')),
                ('oral_hygiene_status', models.CharField(blank=True, choices=[('EXCELLENT', 'Excellent'), ('GOOD', 'Good'), ('FAIR', 'Fair'), ('POOR', 'Poor')], max_length=50)),
                ('gum_condition', models.CharField(blank=True, choices=[('HEALTHY', 'Healthy'), ('GINGIVITIS', 'Gingivitis'), ('PERIODONTITIS', 'Periodontitis'), ('INFLAMMATION', 'Inflammation')], max_length=50)),
                ('tooth_chart', models.JSONField(blank=True, default=dict, help_text='Detailed tooth chart with individual tooth conditions')),
                ('clinical_notes', models.TextField(blank=True, help_text='Additional clinical observations')),
                ('pain_level', models.IntegerField(blank=True, help_text='Pain level on scale of 1-10', null=True)),
                ('anesthesia_used', models.BooleanField(default=False)),
                ('anesthesia_type', models.CharField(blank=True, max_length=100)),
                ('materials_used', models.TextField(blank=True, help_text='Materials and medications used')),
                ('next_appointment_recommended', models.DateField(blank=True, null=True)),
                ('home_care_instructions', models.TextField(blank=True)),
                ('priority', models.CharField(choices=[('LOW', 'Low Priority'), ('MEDIUM', 'Medium Priority'), ('HIGH', 'High Priority'), ('URGENT', 'Urgent')], default='LOW', max_length=10)),
                ('xray_images', models.JSONField(blank=True, default=list, help_text='List of X-ray image URLs')),
                ('photos', models.JSONField(blank=True, default=list, help_text='List of dental photo URLs')),
                ('documents', models.JSONField(blank=True, default=list, help_text='List of related document URLs')),
                ('cost', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('insurance_covered', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dental_records', to='patients.patient')),
            ],
            options={
                'ordering': ['-visit_date'],
            },
        ),
    ]
