from django.db import migrations, models

def run_sql_if_postgres(sql):
    def wrapped(apps, schema_editor):
        if schema_editor.connection.vendor == 'postgresql':
            schema_editor.execute(sql)
    return wrapped

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        # Index for user role lookups
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_user_role ON authentication_user(role);")),
        
        # Index for user email lookups (already unique, but helps with searches)
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_user_email ON authentication_user(email);")),
        
        # Index for user created_at for chronological queries
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_user_created_at ON authentication_user(created_at);")),
        
        # Index for user active status and role combination
        migrations.RunPython(run_sql_if_postgres("CREATE INDEX IF NOT EXISTS idx_user_active_role ON authentication_user(is_active, role);")),
    ]
