release: cd backend && python manage.py migrate && python manage.py create_default_report_templates --force && python manage.py collectstatic --noinput
web: cd backend && gunicorn backend.wsgi --log-file - --timeout 120 
worker: cd backend && celery -A backend worker -l info --concurrency=2
beat: cd backend && celery -A backend beat -l info