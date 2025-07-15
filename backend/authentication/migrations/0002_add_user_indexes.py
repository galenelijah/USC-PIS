from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        # Index for user role lookups
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role ON authentication_user(role);",
            reverse_sql="DROP INDEX IF EXISTS idx_user_role;"
        ),
        
        # Index for user email lookups (already unique, but helps with searches)
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON authentication_user(email);",
            reverse_sql="DROP INDEX IF EXISTS idx_user_email;"
        ),
        
        # Index for user created_at for chronological queries
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON authentication_user(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_user_created_at;"
        ),
        
        # Index for user active status and role combination
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_active_role ON authentication_user(is_active, role);",
            reverse_sql="DROP INDEX IF EXISTS idx_user_active_role;"
        ),
    ]