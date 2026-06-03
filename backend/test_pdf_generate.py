import os
import django
from datetime import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from reports.services import ReportGenerationService

service = ReportGenerationService()
try:
    date_start = timezone.make_aware(datetime(2025, 1, 1))
    date_end = timezone.make_aware(datetime(2026, 1, 1))
    
    data = service._generate_generic_report(
        report_type='PATIENT_SUMMARY',
        title='Test Patient Summary',
        date_start=date_start,
        date_end=date_end,
        export_format='PDF'
    )
    if isinstance(data, dict) and data.get('error'):
        print("Backend Error:", data.get('error'))
    else:
        print("Success! PDF created.")
except Exception as e:
    import traceback
    print("Crash:", e)
    traceback.print_exc()
