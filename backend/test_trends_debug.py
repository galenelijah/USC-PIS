import os
import django
import sys
from datetime import timedelta
from django.utils import timezone

# Setup Django
sys.path.append(os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from reports.services import ReportDataService
from patients.models import MedicalRecord, DentalRecord

def test_trends():
    now = timezone.now()
    date_start = now - timedelta(days=30)
    date_end = now
    
    # Check if there are any records at all
    print(f"Total Medical Records: {MedicalRecord.objects.count()}")
    print(f"Total Dental Records: {DentalRecord.objects.count()}")
    
    # Check records in range
    print(f"Medical in range: {MedicalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()}")
    print(f"Dental in range: {DentalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()}")
    
    data = ReportDataService.get_visit_trends_data(date_start, date_end)
    
    if 'error' in data:
        print(f"ERROR: {data['error']}")
    else:
        print(f"Total Visits: {data['total_visits']}")
        print(f"Granularity: {data.get('granularity')}")
        print(f"Summary Count: {len(data.get('monthly_summary', []))}")
        if data.get('monthly_summary'):
            # Print entries that have non-zero visits
            non_zero = [e for e in data['monthly_summary'] if e['total_visits'] > 0]
            print(f"Non-zero entries: {non_zero}")
            print(f"First Entry: {data['monthly_summary'][0]}")
            print(f"Last Entry: {data['monthly_summary'][-1]}")

if __name__ == "__main__":
    test_trends()
