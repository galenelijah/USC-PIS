import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from reports.models import ReportTemplate

updates = {
    1: 'Population & Academic Distribution',
    2: 'Clinical Capacity & Visit Volume',
    3: 'Detailed Clinical Diagnosis Breakdown',
    4: 'Morbidity & Clinical Trends',
    5: 'Oral Health Services & Clinical Capacity',
    6: 'Service Satisfaction & Sentiment',
    7: 'Detailed Health Campaigns Breakdown',
    8: 'Clinic Operational Flow & Density'
}

for t_id, new_name in updates.items():
    try:
        template = ReportTemplate.objects.get(id=t_id)
        template.name = new_name
        template.save()
        print(f"Updated Template ID {t_id} to '{new_name}'")
    except ReportTemplate.DoesNotExist:
        print(f"Template ID {t_id} not found")

print("Templates update complete.")
