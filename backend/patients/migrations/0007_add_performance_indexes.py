from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0006_dentalrecord'),
    ]

    operations = [
        # Index for patient email lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_patient_email ON patients_patient(email);",
            reverse_sql="DROP INDEX IF EXISTS idx_patient_email;"
        ),
        
        # Index for patient user relationship
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_patient_user ON patients_patient(user_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_patient_user;"
        ),
        
        # Index for patient created_by relationship
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_patient_created_by ON patients_patient(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_patient_created_by;"
        ),
        
        # Index for medical record patient and date lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_medical_patient_date ON patients_medicalrecord(patient_id, visit_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_medical_patient_date;"
        ),
        
        # Index for medical record created_by relationship
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_medical_created_by ON patients_medicalrecord(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_medical_created_by;"
        ),
        
        # Index for dental record patient and date lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_dental_patient_date ON patients_dentalrecord(patient_id, visit_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_dental_patient_date;"
        ),
        
        # Index for dental record created_by relationship
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_dental_created_by ON patients_dentalrecord(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_dental_created_by;"
        ),
        
        # Index for dental record procedure lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_dental_procedure ON patients_dentalrecord(procedure_performed);",
            reverse_sql="DROP INDEX IF EXISTS idx_dental_procedure;"
        ),
        
        # Index for dental record priority lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_dental_priority ON patients_dentalrecord(priority);",
            reverse_sql="DROP INDEX IF EXISTS idx_dental_priority;"
        ),
        
        # Index for consultation patient and date lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consultation_patient_date ON patients_consultation(patient_id, date_time);",
            reverse_sql="DROP INDEX IF EXISTS idx_consultation_patient_date;"
        ),
        
        # Index for consultation created_by relationship
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consultation_created_by ON patients_consultation(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_consultation_created_by;"
        ),
    ]