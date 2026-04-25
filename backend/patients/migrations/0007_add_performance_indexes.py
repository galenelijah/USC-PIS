from django.db import migrations, models

def run_sql_if_postgres(sql):
    def wrapped(apps, schema_editor):
        if schema_editor.connection.vendor == 'postgresql':
            schema_editor.execute(sql)
    return wrapped

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0006_dentalrecord'),
    ]

    operations = [
        # Index for patient email lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_patient_email ON patients_patient(email);")),
        
        # Index for patient user relationship
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_patient_user ON patients_patient(user_id);")),
        
        # Index for patient created_by relationship
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_patient_created_by ON patients_patient(created_by_id);")),
        
        # Index for medical record patient and date lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_medical_patient_date ON patients_medicalrecord(patient_id, visit_date);")),
        
        # Index for medical record created_by relationship
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_medical_created_by ON patients_medicalrecord(created_by_id);")),
        
        # Index for dental record patient and date lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_dental_patient_date ON patients_dentalrecord(patient_id, visit_date);")),
        
        # Index for dental record created_by relationship
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_dental_created_by ON patients_dentalrecord(created_by_id);")),
        
        # Index for dental record procedure lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_dental_procedure ON patients_dentalrecord(procedure_performed);")),
        
        # Index for dental record priority lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_dental_priority ON patients_dentalrecord(priority);")),
        
        # Index for consultation patient and date lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_consultation_patient_date ON patients_consultation(patient_id, date_time);")),
        
        # Index for consultation created_by relationship
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_consultation_created_by ON patients_consultation(created_by_id);")),
    ]
