from django.db import migrations, models
from django.conf import settings
import os


def enable_pgcrypto(apps, schema_editor):
    # Enable pgcrypto extension if available (Postgres)
    try:
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    except Exception:
        # On non-Postgres (e.g., SQLite dev), just ignore
        pass


def encrypt_existing(apps, schema_editor):
    # Best-effort encrypt existing plaintext into *_enc columns
    key = os.environ.get('PGP_ENCRYPTION_KEY') or getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key:
        return  # No key provided; skip
    try:
        with schema_editor.connection.cursor() as cursor:
            # illness
            cursor.execute("""
                UPDATE authentication_user
                SET illness_enc = pgp_sym_encrypt(illness::text, %s)::bytea
                WHERE illness IS NOT NULL AND length(illness) > 0;
            """, [key])
            # existing_medical_condition
            cursor.execute("""
                UPDATE authentication_user
                SET existing_medical_condition_enc = pgp_sym_encrypt(existing_medical_condition::text, %s)::bytea
                WHERE existing_medical_condition IS NOT NULL AND length(existing_medical_condition) > 0;
            """, [key])
            # medications
            cursor.execute("""
                UPDATE authentication_user
                SET medications_enc = pgp_sym_encrypt(medications::text, %s)::bytea
                WHERE medications IS NOT NULL AND length(medications) > 0;
            """, [key])
            # allergies
            cursor.execute("""
                UPDATE authentication_user
                SET allergies_enc = pgp_sym_encrypt(allergies::text, %s)::bytea
                WHERE allergies IS NOT NULL AND length(allergies) > 0;
            """, [key])
            # emergency_contact_number
            cursor.execute("""
                UPDATE authentication_user
                SET emergency_contact_number_enc = pgp_sym_encrypt(emergency_contact_number::text, %s)::bytea
                WHERE emergency_contact_number IS NOT NULL AND length(emergency_contact_number) > 0;
            """, [key])
    except Exception:
        # Skip on non-Postgres or if extension not available
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_create_default_admin'),
    ]

    operations = [
        migrations.RunPython(enable_pgcrypto, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=10,
                choices=[('ADMIN','Admin'),('DOCTOR','Doctor'),('DENTIST','Dentist'),('NURSE','Nurse'),('STAFF','Staff'),('STUDENT','Student')],
                default='STUDENT'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='illness_enc',
            field=models.BinaryField(null=True, blank=True, editable=False),
        ),
        migrations.AddField(
            model_name='user',
            name='existing_medical_condition_enc',
            field=models.BinaryField(null=True, blank=True, editable=False),
        ),
        migrations.AddField(
            model_name='user',
            name='medications_enc',
            field=models.BinaryField(null=True, blank=True, editable=False),
        ),
        migrations.AddField(
            model_name='user',
            name='allergies_enc',
            field=models.BinaryField(null=True, blank=True, editable=False),
        ),
        migrations.AddField(
            model_name='user',
            name='emergency_contact_number_enc',
            field=models.BinaryField(null=True, blank=True, editable=False),
        ),
        migrations.RunPython(encrypt_existing, migrations.RunPython.noop),
    ]

