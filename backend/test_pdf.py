import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from reports.services import ReportGenerationService
from reports.models import ReportTemplate, GeneratedReport
from authentication.models import User

user = User.objects.first()
s = ReportGenerationService()
try:
    print("Testing TREATMENT_OUTCOMES via direct collect and pdf export...")
    data = s.collect_report_data('TREATMENT_OUTCOMES', 'Test')
    html = s.get_default_template('TREATMENT_OUTCOMES', 'Test')
    pdf = s.export_service.export_to_pdf(data, html, 'Test', user=user)
    if pdf:
        print("Success for 3")
    else:
        print("Failed for 3")
except Exception as e:
    print(f"Exception: {e}")

try:
    print("Testing FEEDBACK_ANALYSIS via direct collect and pdf export...")
    data = s.collect_report_data('FEEDBACK_ANALYSIS', 'Test')
    html = s.get_default_template('FEEDBACK_ANALYSIS', 'Test')
    pdf = s.export_service.export_to_pdf(data, html, 'Test', user=user)
    if pdf:
        print("Success for 6")
    else:
        print("Failed for 6")
except Exception as e:
    print(f"Exception: {e}")
