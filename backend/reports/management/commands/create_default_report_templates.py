from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import ReportTemplate
from reports.services import ReportGenerationService
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Create default report templates for the USC Patient Information System using High-Fidelity Workshop Standards'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if templates exist',
        )

    def handle(self, *args, **options):
        force = options['force']
        service = ReportGenerationService()
        
        # Get or create a system user for template creation
        system_user, created = User.objects.get_or_create(
            username='system',
            defaults={
                'email': 'system@usc.edu.ph',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'ADMIN',
                'is_staff': True,
                'is_active': True
            }
        )
        
        templates_data = [
            {
                'name': 'Patient Summary Report',
                'description': 'Comprehensive summary of patient information, medical history, and recent visits',
                'report_type': 'PATIENT_SUMMARY',
                'template_content': service.get_default_template('PATIENT_SUMMARY', 'Institutional Population Summary'),
                'default_filters': {'include_medical_history': True, 'include_dental_records': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'requires_patient_filter': True,
                'allowed_roles': ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Monthly Visit Trends',
                'description': 'Analysis of patient visit patterns and trends over time',
                'report_type': 'VISIT_TRENDS',
                'template_content': service.get_default_template('VISIT_TRENDS', 'Clinical Capacity & Visit Trends'),
                'default_filters': {'group_by': 'month', 'include_charts': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Clinical Outcomes Report',
                'description': 'Analysis of diagnosis distribution and treatment patterns',
                'report_type': 'TREATMENT_OUTCOMES',
                'template_content': service.get_default_template('TREATMENT_OUTCOMES', 'Treatment Efficacy & Outcomes'),
                'default_filters': {'include_top_diagnoses': True, 'include_treatments': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Medical Statistics Dashboard',
                'description': 'Statistical overview of medical consultations and diagnoses',
                'report_type': 'MEDICAL_STATISTICS',
                'template_content': service.get_default_template('MEDICAL_STATISTICS', 'Medical Clinical Statistics'),
                'default_filters': {'include_demographics': True, 'include_diagnosis_trends': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Dental Health Report',
                'description': 'Comprehensive dental health statistics and treatment analysis',
                'report_type': 'DENTAL_STATISTICS',
                'template_content': service.get_default_template('DENTAL_STATISTICS', 'Dental Health Clinical Statistics'),
                'default_filters': {'include_procedures': True, 'include_oral_health_index': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Patient Feedback Analysis',
                'description': 'Analysis of patient feedback and satisfaction ratings',
                'report_type': 'FEEDBACK_ANALYSIS',
                'template_content': service.get_default_template('FEEDBACK_ANALYSIS', 'Patient Satisfaction & Feedback Analysis'),
                'default_filters': {'include_ratings': True, 'include_comments': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'Health Campaign Performance',
                'description': 'Analysis of health campaign reach, engagement, and effectiveness',
                'report_type': 'CAMPAIGN_PERFORMANCE',
                'template_content': service.get_default_template('CAMPAIGN_PERFORMANCE', 'Health Campaign Impact Analysis'),
                'default_filters': {'include_participation_rates': True, 'include_feedback': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'User Activity & Audit Report',
                'description': 'Analysis of system usage, audit logs, and operational activity',
                'report_type': 'USER_ACTIVITY',
                'template_content': service.get_default_template('USER_ACTIVITY', 'System Operations & Audit Log'),
                'default_filters': {},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Clinic Operational Flow & Density',
                'description': 'Analysis of clinic traffic patterns, peak hours, and operational efficiency',
                'report_type': 'USER_ACTIVITY',
                'template_content': service.get_default_template('USER_ACTIVITY', 'Clinic Operational Flow & Density'),
                'default_filters': {'include_peak_hours': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'Comprehensive Analytics Report',
                'description': 'Full-scale analysis across all clinical and administrative modules',
                'report_type': 'COMPREHENSIVE_ANALYTICS',
                'template_content': service.get_default_template('COMPREHENSIVE_ANALYTICS', 'Comprehensive Institutional Analytics'),
                'default_filters': {},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Health History Summary',
                'description': 'Longitudinal view of a patient health history across all modules',
                'report_type': 'HEALTH_HISTORY',
                'template_content': service.get_default_template('HEALTH_HISTORY', 'Unified Longitudinal Health History'),
                'default_filters': {},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'requires_patient_filter': True,
                'allowed_roles': ['DOCTOR', 'NURSE', 'ADMIN']
            }
        ]

        created_count = 0
        updated_count = 0
        
        for data in templates_data:
            templates = ReportTemplate.objects.filter(report_type=data['report_type']).order_by('id')
            
            if not templates.exists():
                template = ReportTemplate.objects.create(
                    report_type=data['report_type'],
                    name=data['name'],
                    description=data['description'],
                    template_content=data['template_content'],
                    default_filters=data.get('default_filters', {}),
                    supported_formats=data['supported_formats'],
                    requires_patient_filter=data.get('requires_patient_filter', False),
                    allowed_roles=data['allowed_roles'],
                    created_by=system_user
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created template: {template.name}"))
            else:
                # Handle duplicates if they exist
                if templates.count() > 1:
                    self.stdout.write(self.style.WARNING(f"Found {templates.count()} duplicates for {data['report_type']}. Cleaning up..."))
                    keep_id = templates.first().id
                    ReportTemplate.objects.filter(report_type=data['report_type']).exclude(id=keep_id).delete()
                    template = ReportTemplate.objects.get(id=keep_id)
                else:
                    template = templates.first()

                if force:
                    template.name = data['name']
                    template.description = data['description']
                    template.template_content = data['template_content']
                    template.default_filters = data.get('default_filters', {})
                    template.supported_formats = data['supported_formats']
                    template.requires_patient_filter = data.get('requires_patient_filter', False)
                    template.allowed_roles = data['allowed_roles']
                    template.save()
                    updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Updated template: {template.name}"))
                else:
                    self.stdout.write(
                        self.style.WARNING(f"Template already exists: {template.name}")
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary: {created_count} templates created, {updated_count} templates updated"
            )
        )
