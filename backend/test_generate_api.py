import os
import django
from django.test import RequestFactory
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from reports.views import ReportTemplateViewSet
from reports.models import ReportTemplate
from authentication.models import User
from rest_framework.test import force_authenticate
from django.core.management import call_command

call_command('create_default_report_templates', force=True)

template = ReportTemplate.objects.filter(report_type='PATIENT_SUMMARY').first()
user = User.objects.filter(role='ADMIN').first()

factory = RequestFactory()
request = factory.post('/api/reports/templates/generate/', {
    'title': 'Test Report',
    'export_format': 'PDF',
    'date_range': '30days'
}, content_type='application/json')
force_authenticate(request, user=user)

view = ReportTemplateViewSet.as_view({'post': 'generate'})
response = view(request, pk=template.id)

print("Status Code:", response.status_code)
if response.status_code not in [200, 202]:
    print("Response Data:", response.data)
else:
    from reports.models import GeneratedReport
    report = GeneratedReport.objects.order_by('-created_at').first()
    print("Report Status:", report.status)
    print("Error Message:", report.error_message)

