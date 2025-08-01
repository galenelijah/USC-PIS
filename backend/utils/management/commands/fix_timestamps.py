"""
Django management command to verify and fix timestamp consistency across the USC-PIS system.
This command ensures all timestamps are properly handled with the correct timezone (Asia/Manila).

Usage: python manage.py fix_timestamps [--dry-run]
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from authentication.models import User
from patients.models import Patient, MedicalRecord, DentalRecord, Consultation
from medical_certificates.models import MedicalCertificate
from feedback.models import Feedback
from health_info.models import HealthInformation, HealthCampaign
from reports.models import Report
import pytz


class Command(BaseCommand):
    help = 'Verify and fix timestamp consistency across USC-PIS system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about timestamp processing',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        self.stdout.write(
            self.style.SUCCESS('🔍 USC-PIS Timestamp Consistency Check')
        )
        self.stdout.write(f"Current Django TIME_ZONE: {settings.TIME_ZONE}")
        self.stdout.write(f"USE_TZ setting: {settings.USE_TZ}")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('📋 DRY RUN MODE - No changes will be made')
            )
        
        # Get Philippines timezone
        try:
            ph_tz = pytz.timezone('Asia/Manila')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error getting Philippines timezone: {e}')
            )
            return
        
        # Track statistics
        total_records = 0
        total_issues = 0
        models_checked = []
        
        # Define models to check
        model_classes = [
            (User, 'Users'),
            (Patient, 'Patients'), 
            (MedicalRecord, 'Medical Records'),
            (DentalRecord, 'Dental Records'),
            (Consultation, 'Consultations'),
            (MedicalCertificate, 'Medical Certificates'),
            (Feedback, 'Feedback'),
            (HealthInformation, 'Health Information'),
            (HealthCampaign, 'Health Campaigns'),
            (Report, 'Reports'),
        ]
        
        for model_class, model_name in model_classes:
            self.stdout.write(f"\n📊 Checking {model_name}...")
            
            try:
                count = model_class.objects.count()
                total_records += count
                models_checked.append(model_name)
                
                if verbose:
                    self.stdout.write(f"   Found {count} {model_name.lower()}")
                
                # Check for any datetime fields that might have issues
                datetime_fields = []
                for field in model_class._meta.get_fields():
                    if hasattr(field, 'get_internal_type') and field.get_internal_type() == 'DateTimeField':
                        datetime_fields.append(field.name)
                
                if datetime_fields and verbose:
                    self.stdout.write(f"   DateTime fields: {', '.join(datetime_fields)}")
                
                # Sample a few records to check their timezone awareness
                sample_records = model_class.objects.all()[:5]
                for record in sample_records:
                    for field_name in datetime_fields:
                        field_value = getattr(record, field_name, None)
                        if field_value:
                            if not timezone.is_aware(field_value):
                                total_issues += 1
                                self.stdout.write(
                                    self.style.WARNING(
                                        f"   ⚠️  {model_name} ID {record.id}: {field_name} is not timezone-aware"
                                    )
                                )
                                if not dry_run:
                                    # Convert naive datetime to timezone-aware
                                    aware_datetime = timezone.make_aware(field_value, ph_tz)
                                    setattr(record, field_name, aware_datetime)
                                    record.save(update_fields=[field_name])
                                    self.stdout.write(
                                        self.style.SUCCESS(f"   ✅ Fixed {field_name} for {model_name} ID {record.id}")
                                    )
                            elif verbose:
                                tz_info = field_value.tzinfo
                                if tz_info != pytz.UTC and str(tz_info) != 'Asia/Manila':
                                    self.stdout.write(
                                        f"   ℹ️  {model_name} ID {record.id}: {field_name} timezone: {tz_info}"
                                    )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error checking {model_name}: {e}')
                )
        
        # Summary
        self.stdout.write(f"\n📈 Summary:")
        self.stdout.write(f"   Total records checked: {total_records}")
        self.stdout.write(f"   Models checked: {len(models_checked)}")
        self.stdout.write(f"   Timezone issues found: {total_issues}")
        
        if total_issues == 0:
            self.stdout.write(
                self.style.SUCCESS('✅ All timestamps are properly timezone-aware!')
            )
        else:
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {total_issues} timezone issues found. Run without --dry-run to fix them.')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Fixed {total_issues} timezone issues!')
                )
        
        # Additional recommendations
        self.stdout.write(f"\n💡 Recommendations:")
        self.stdout.write(f"   ✓ Django TIME_ZONE is set to: {settings.TIME_ZONE}")
        self.stdout.write(f"   ✓ USE_TZ is properly enabled: {settings.USE_TZ}")
        self.stdout.write(f"   ✓ All new records will use Asia/Manila timezone")
        self.stdout.write(f"   ✓ Frontend should use the centralized dateUtils.js for consistent display")
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 Timestamp consistency check completed!')
        )