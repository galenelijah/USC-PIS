from django.core.management.base import BaseCommand
from reports.models import ReportTemplate

class Command(BaseCommand):
    help = 'Fix report templates to support all export formats including JSON'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Fixing report template export formats...")
        
        # Define all supported formats
        all_formats = ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML']
        
        # Get all report templates
        templates = ReportTemplate.objects.all()
        
        if not templates.exists():
            self.stdout.write("📝 No report templates found. Creating default templates...")
            self.create_default_templates()
            templates = ReportTemplate.objects.all()
        
        fixed_count = 0
        for template in templates:
            original_formats = template.supported_formats or []
            
            # Ensure all formats are supported
            updated_formats = list(set(all_formats + original_formats))
            
            if set(updated_formats) != set(original_formats):
                template.supported_formats = updated_formats
                template.save()
                fixed_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Updated {template.name}: {len(updated_formats)} formats supported")
                )
            else:
                self.stdout.write(f"✅ {template.name}: Already supports all formats")
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Fixed {fixed_count} report templates!")
        )
        
        # Verify the fix
        self.stdout.write("\n🔍 Verification:")
        for template in ReportTemplate.objects.all():
            formats = template.supported_formats or []
            has_json = 'JSON' in formats
            self.stdout.write(f"  - {template.name}: JSON {'✅' if has_json else '❌'} ({len(formats)} total formats)")
        
        self.stdout.write(
            self.style.SUCCESS("\n✨ All report templates now support JSON export!")
        )

    def create_default_templates(self):
        """Create default report templates if none exist"""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        admin_user = User.objects.filter(role='ADMIN').first()
        
        if not admin_user:
            self.stdout.write(self.style.WARNING("No admin user found for template creation"))
            return
        
        default_templates = [
            {
                'name': 'Patient Summary Report',
                'description': 'Comprehensive summary of patient demographics and statistics',
                'report_type': 'PATIENT_SUMMARY',
                'template_content': '<h1>Patient Summary Report</h1><p>{{data}}</p>',
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'],
                'created_by': admin_user
            },
            {
                'name': 'Visit Trends Report',
                'description': 'Analysis of patient visit patterns and trends',
                'report_type': 'VISIT_TRENDS',
                'template_content': '<h1>Visit Trends Report</h1><p>{{data}}</p>',
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'],
                'created_by': admin_user
            },
            {
                'name': 'Feedback Analysis Report',
                'description': 'Patient feedback analysis and satisfaction metrics',
                'report_type': 'FEEDBACK_ANALYSIS',
                'template_content': '<h1>Feedback Analysis Report</h1><p>{{data}}</p>',
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'],
                'created_by': admin_user
            },
            {
                'name': 'Medical Statistics Report',
                'description': 'Statistical analysis of medical records and treatments',
                'report_type': 'MEDICAL_STATISTICS',
                'template_content': '<h1>Medical Statistics Report</h1><p>{{data}}</p>',
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'],
                'created_by': admin_user
            },
            {
                'name': 'Campaign Performance Report',
                'description': 'Analysis of health campaign effectiveness and engagement',
                'report_type': 'CAMPAIGN_PERFORMANCE',
                'template_content': '<h1>Campaign Performance Report</h1><p>{{data}}</p>',
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'],
                'created_by': admin_user
            }
        ]
        
        created_count = 0
        for template_data in default_templates:
            template, created = ReportTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"✅ Created template: {template.name}")
        
        self.stdout.write(f"📝 Created {created_count} default templates")