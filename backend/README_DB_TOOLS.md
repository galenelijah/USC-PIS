# Database Monitoring Tools

This directory contains tools to help you monitor and verify your Heroku Postgres database.

## Available Tools

### 1. Database Health Check API

A Django view that provides information about the database health, including:
- Database status
- Database size
- Connection count
- Table information

**Access via API:**
```
GET /api/auth/database-health/
```

**Access via UI:**
Navigate to `/database-monitor` in the application.

### 2. Database Check Script

A Python script that checks the database connection and displays table information.

**Usage:**
```bash
cd USC-PIS/USC-PIS/backend
python check_db.py
```

### 3. Table Contents Check Script

A Python script that checks the database tables and their contents.

**Usage:**
```bash
cd USC-PIS/USC-PIS/backend
python check_tables.py
```

### 4. Heroku Postgres Connection Script

A batch script that connects to the Heroku Postgres database using psql.

**Usage:**
```bash
cd USC-PIS/USC-PIS/backend
connect_to_heroku_db.bat
```

## Using pgAdmin 4

1. Open pgAdmin 4
2. Add a new server with these connection details:
   ```
   Host: Your Heroku Postgres host (get from DATABASE_URL)
   Port: 5432
   Database: Your database name
   Username: Your database user
   Password: Your database password
   ```
3. You can get these details by running:
   ```bash
   heroku pg:credentials:url -a usc-pis
   ```

## Using Heroku CLI

1. Check database info:
   ```bash
   heroku pg:info -a usc-pis
   ```

2. Connect to database:
   ```bash
   heroku pg:psql -a usc-pis
   ```

3. View database logs:
   ```bash
   heroku logs --tail -a usc-pis
   ```

## Common SQL Queries

Once connected to the database, you can run these SQL queries:

1. List all tables:
   ```sql
   \dt
   ```

2. Describe a table:
   ```sql
   \d table_name
   ```

3. Count records in a table:
   ```sql
   SELECT COUNT(*) FROM table_name;
   ```

4. View sample records:
   ```sql
   SELECT * FROM table_name LIMIT 5;
   ```

5. Check database size:
   ```sql
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

6. Check connection count:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

## Troubleshooting

If you encounter issues connecting to the database:

1. Check if the Heroku app is running:
   ```bash
   heroku ps -a usc-pis
   ```

2. Check database credentials:
   ```bash
   heroku pg:credentials:url -a usc-pis
   ```

3. Reset the database if needed:
   ```bash
   heroku pg:reset DATABASE_URL -a usc-pis
   ```

4. Check for database errors in logs:
   ```bash
   heroku logs --tail -a usc-pis
   ```

## Running Tests with Coverage

To run all backend tests and generate a coverage report:

```sh
coverage run --source=. manage.py test
coverage report
coverage html  # To generate an HTML report in htmlcov/
``` 