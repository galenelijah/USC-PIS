release: cd backend && python manage.py migrate && python manage.py collectstatic --noinput
web: cd backend && gunicorn backend.wsgi --log-file - 