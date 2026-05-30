import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from reports.models import ReportTemplate, GeneratedReport
from reports.tasks import generate_report_task_celery
from authentication.models import User

user = User.objects.filter(is_staff=True).first() or User.objects.first()

print(f"Running report tests as user: {user}")

for t_id in range(1, 9):
    try:
        template = ReportTemplate.objects.get(id=t_id)
        report = GeneratedReport.objects.create(
            template=template,
            generated_by=user,
            title=f"Test {template.name}",
            export_format="PDF",
            filters={}
        )
        print(f"Testing Template ID {t_id} ({template.name})...")
        success = generate_report_task_celery(report.id, is_sync=True)
        report.refresh_from_db()
        
        if success and report.status == 'COMPLETED':
            print(f"  [SUCCESS] Template ID {t_id}")
        else:
            print(f"  [FAILED] Template ID {t_id} - Error: {report.error_message}")
            
    except Exception as e:
        print(f"  [ERROR] Setup failed for Template ID {t_id}: {str(e)}")

print("All tests completed.")
