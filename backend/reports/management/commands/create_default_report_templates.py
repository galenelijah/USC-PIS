from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import ReportTemplate
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Create default report templates for the USC Patient Information System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if templates exist',
        )

    def handle(self, *args, **options):
        force = options['force']
        
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
                'template_content': self.get_patient_summary_template(),
                'default_filters': {'include_medical_history': True, 'include_dental_records': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'requires_patient_filter': True,
                'allowed_roles': ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Monthly Visit Trends',
                'description': 'Analysis of patient visit patterns and trends over time',
                'report_type': 'VISIT_TRENDS',
                'template_content': self.get_visit_trends_template(),
                'default_filters': {'group_by': 'month', 'include_charts': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Treatment Outcomes Report',
                'description': 'Analysis of treatment effectiveness and patient outcomes',
                'report_type': 'TREATMENT_OUTCOMES',
                'template_content': self.get_treatment_outcomes_template(),
                'default_filters': {'include_success_rates': True, 'group_by_treatment': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Medical Statistics Dashboard',
                'description': 'Statistical overview of medical consultations and diagnoses',
                'report_type': 'MEDICAL_STATISTICS',
                'template_content': self.get_medical_statistics_template(),
                'default_filters': {'include_demographics': True, 'include_diagnosis_trends': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Dental Health Report',
                'description': 'Comprehensive dental health statistics and treatment analysis',
                'report_type': 'DENTAL_STATISTICS',
                'template_content': self.get_dental_statistics_template(),
                'default_filters': {'include_procedures': True, 'include_oral_health_index': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'STAFF', 'ADMIN']
            },
            {
                'name': 'Patient Feedback Analysis',
                'description': 'Analysis of patient feedback and satisfaction ratings',
                'report_type': 'FEEDBACK_ANALYSIS',
                'template_content': self.get_feedback_analysis_template(),
                'default_filters': {'include_ratings': True, 'include_comments': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'Health Campaign Performance',
                'description': 'Analysis of health campaign reach, engagement, and effectiveness',
                'report_type': 'CAMPAIGN_PERFORMANCE',
                'template_content': self.get_campaign_performance_template(),
                'default_filters': {'include_participation_rates': True, 'include_feedback': True},
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'User Activity Report',
                'description': 'Tracking of system usage, logins, and staff actions',
                'report_type': 'USER_ACTIVITY',
                'template_content': self.get_user_activity_template(),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Health Metrics Report',
                'description': 'Population-level health indicators and trends',
                'report_type': 'HEALTH_METRICS',
                'template_content': self.get_health_metrics_template(),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'ADMIN']
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for template_data in templates_data:
            # Inject shared stylesheet into HTML content
            try:
                template_data['template_content'] = self._apply_shared_styles(template_data['template_content'])
            except Exception:
                pass

            template, created = ReportTemplate.objects.get_or_create(
                name=template_data['name'],
                report_type=template_data['report_type'],
                defaults={
                    **template_data,
                    'created_by': system_user
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created template: {template.name}")
                )
            elif force:
                # Update existing template
                for key, value in template_data.items():
                    if key not in ['name', 'report_type']:
                        setattr(template, key, value)
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Updated template: {template.name}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"Template already exists: {template.name}")
                )
        
        # Delete templates that are no longer in templates_data
        active_report_types = [t['report_type'] for t in templates_data]
        deleted_count, _ = ReportTemplate.objects.exclude(report_type__in=active_report_types).delete()
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} obsolete templates"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary: {created_count} templates created, {updated_count} templates updated"
            )
        )

    def _apply_shared_styles(self, content: str) -> str:
        """Insert shared report CSS and load custom tags."""
        if not isinstance(content, str):
            return content
            
        # Ensure report tags are loaded for custom filters
        if '{% load report_tags %}' not in content:
            content = '{% load report_tags %}\n' + content
            
        return content

    def get_base_style(self):
        return """
        <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #0B4F6C; margin-bottom: 20px; padding-bottom: 10px; }
            .title { color: #0B4F6C; font-size: 18pt; font-weight: bold; margin: 0; }
            .subtitle { color: #246A73; font-size: 10pt; margin-top: 5px; }
            .section { margin-bottom: 15px; }
            .section-title { background-color: #f0f4f8; color: #0B4F6C; font-size: 12pt; font-weight: bold; padding: 5px; border-left: 4px solid #0B4F6C; margin-bottom: 10px; }
            .usc-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .usc-table th { background-color: #0B4F6C; color: white; text-align: left; padding: 6px; font-size: 9pt; }
            .usc-table td { padding: 6px; border-bottom: 1px solid #ddd; font-size: 8pt; vertical-align: top; }
            .metric-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 10px; text-align: center; margin-bottom: 10px; }
            .metric-value { font-size: 16pt; font-weight: bold; color: #0B4F6C; }
            .metric-label { font-size: 8pt; color: #666; text-transform: uppercase; }
            .footer { text-align: center; font-size: 8pt; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
            .badge { display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 7pt; font-weight: bold; color: white; }
            .badge-high { background-color: #dc3545; }
            .badge-medium { background-color: #ffc107; color: #333; }
            .badge-low { background-color: #28a745; }
        </style>
        """

    def get_patient_summary_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Summary Report</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Patient Summary Report</div>
                <div class="subtitle">University of San Carlos - Patient Information System</div>
            </div>
            
            {{% if patient %}}
            <div class="section">
                <div class="section-title">Patient Profile</div>
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%;">
                            <strong>Name:</strong> {{{{ patient.first_name }}}} {{{{ patient.last_name }}}}<br>
                            <strong>ID:</strong> {{{{ patient.student_id }}}}<br>
                            <strong>Gender:</strong> {{{{ patient.gender }}}}
                        </td>
                        <td style="width: 50%;">
                            <strong>Age:</strong> {{{{ patient.age }}}} yrs<br>
                            <strong>Blood Type:</strong> {{{{ patient.blood_type }}}}<br>
                            <strong>Contact:</strong> {{{{ patient.contact_number }}}}
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Medical Background</div>
                <table class="usc-table">
                    <tr><td style="width:30%; font-weight:bold;">Allergies</td><td>{{{{ patient.allergies }}}}</td></tr>
                    <tr><td style="font-weight:bold;">Conditions</td><td>{{{{ patient.medical_conditions }}}}</td></tr>
                    <tr><td style="font-weight:bold;">Medications</td><td>{{{{ patient.current_medications }}}}</td></tr>
                </table>
            </div>
            {{% else %}}
            <div class="section">
                <div class="section-title">Population Overview</div>
                <div style="display: table; width: 100%; margin-bottom: 20px;">
                    <div style="display: table-cell; width: 33%; padding: 5px;">
                        <div class="metric-box">
                            <div class="metric-value">{{{{ total_patients }}}}</div>
                            <div class="metric-label">Total Patients</div>
                        </div>
                    </div>
                    <div style="display: table-cell; width: 33%; padding: 5px;">
                        <div class="metric-box">
                            <div class="metric-value">{{{{ active_patients }}}}</div>
                            <div class="metric-label">Active (90 Days)</div>
                        </div>
                    </div>
                    <div style="display: table-cell; width: 33%; padding: 5px;">
                        <div class="metric-box">
                            <div class="metric-value">{{{{ new_registrations }}}}</div>
                            <div class="metric-label">New (30 Days)</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: table; width: 100%;">
                    <div style="display: table-cell; width: 50%; padding-right: 10px;">
                        <div class="section-title">Gender Distribution</div>
                        <table class="usc-table">
                            {{% for item in gender_distribution %}}
                            <tr><td>{{{{ item.gender }}}}</td><td>{{{{ item.count }}}}</td></tr>
                            {{% endfor %}}
                        </table>
                    </div>
                    <div style="display: table-cell; width: 50%;">
                        <div class="section-title">Age Distribution</div>
                        <table class="usc-table">
                            {{% for group, count in age_distribution.items %}}
                            <tr><td>{{{{ group }}}}</td><td>{{{{ count }}}}</td></tr>
                            {{% endfor %}}
                        </table>
                    </div>
                </div>
            </div>
            {{% endif %}}
            
            {{% if medical_records %}}
            <div class="section">
                <div class="section-title">Medical Consultation History</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Date</th><th>Diagnosis</th><th>Treatment</th></tr>
                    </thead>
                    <tbody>
                        {{% for record in medical_records %}}
                        <tr>
                            <td>{{{{ record.visit_date|format_date }}}}</td>
                            <td>{{{{ record.diagnosis }}}}</td>
                            <td>{{{{ record.treatment }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            {{% if dental_records %}}
            <div class="section">
                <div class="section-title">Dental Treatment History</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Date</th><th>Procedure</th><th>Diagnosis</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                        {{% for record in dental_records %}}
                        <tr>
                            <td>{{{{ record.visit_date|format_date }}}}</td>
                            <td>{{{{ record.procedure_performed }}}}</td>
                            <td>{{{{ record.diagnosis }}}}</td>
                            <td>{{{{ record.notes }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            {{% if consultations %}}
            <div class="section">
                <div class="section-title">General Health Consultations</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Date</th><th>Complaints</th><th>Treatment Plan</th></tr>
                    </thead>
                    <tbody>
                        {{% for record in consultations %}}
                        <tr>
                            <td>{{{{ record.date_time|format_date }}}}</td>
                            <td>{{{{ record.chief_complaints }}}}</td>
                            <td>{{{{ record.treatment_plan }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            <div class="footer">
                <p>Confidential USC Medical Record | Generated on: {{{{ report_date }}}} | System: USC-PIS</p>
            </div>
        </body>
        </html>
        """

    def get_visit_trends_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Visit Trends Report</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Visit Trends Report</div>
                <div class="subtitle">University of San Carlos - Patient Information System</div>
            </div>
            
            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 25%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-value">{{{{ total_visits }}}}</div>
                        <div class="metric-label">Total Visits</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 25%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-value">{{{{ unique_patients }}}}</div>
                        <div class="metric-label">Unique Patients</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 25%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-value">{{{{ avg_daily_visits }}}}</div>
                        <div class="metric-label">Avg Daily</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 25%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-value">{{{{ peak_day_visits }}}}</div>
                        <div class="metric-label">Peak Day</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Monthly Visit Summary</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Month</th><th>Medical</th><th>Dental</th><th>Total</th><th>Growth</th></tr>
                    </thead>
                    <tbody>
                        {{% for month in monthly_summary %}}
                        <tr>
                            <td>{{{{ month.month }}}}</td>
                            <td>{{{{ month.medical_visits }}}}</td>
                            <td>{{{{ month.dental_visits }}}}</td>
                            <td><strong>{{{{ month.total_visits }}}}</strong></td>
                            <td>{{{{ month.growth_percentage|floatformat:1 }}}}%</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Visit Distribution by Service Type</div>
                <table class="usc-table" style="width: 50%;">
                    <thead>
                        <tr><th>Service Type</th><th>Visit Count</th></tr>
                    </thead>
                    <tbody>
                        {{% for type, count in summary_by_type.items %}}
                        <tr><td>{{{{ type }}}}</td><td>{{{{ count }}}}</td></tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>Generated for Period: {{{{ date_range_start|date:"M d, Y" }}}} - {{{{ date_range_end|date:"M d, Y" }}}}</p>
            </div>
        </body>
        </html>
        """

    def get_treatment_outcomes_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Treatment Outcomes Report</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Treatment Outcomes Analysis</div>
                <div class="subtitle">University of San Carlos - Patient Information System</div>
            </div>
            
            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Overall Success Rate</div>
                        <div class="metric-value">{{{{ overall_success_rate }}}}%</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Total Cases Analyzed</div>
                        <div class="metric-value">{{{{ total_treatments }}}}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Outcomes by Treatment Category</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Category</th><th>Total Cases</th><th>Successful</th><th>Improved</th><th>Success Rate</th></tr>
                    </thead>
                    <tbody>
                        {{% for outcome in treatment_outcomes %}}
                        <tr>
                            <td>{{{{ outcome.category }}}}</td>
                            <td>{{{{ outcome.total_cases }}}}</td>
                            <td>{{{{ outcome.successful }}}}</td>
                            <td>{{{{ outcome.improved }}}}</td>
                            <td><strong>{{{{ outcome.success_rate|floatformat:1 }}}}%</strong></td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Top Performing Treatments</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Treatment</th><th>Cases</th><th>Success Rate</th><th>Avg Duration</th></tr>
                    </thead>
                    <tbody>
                        {{% for treatment in top_treatments %}}
                        <tr>
                            <td>{{{{ treatment.name }}}}</td>
                            <td>{{{{ treatment.case_count }}}}</td>
                            <td>{{{{ treatment.success_rate|floatformat:1 }}}}%</td>
                            <td>{{{{ treatment.avg_duration }}}} days</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_medical_statistics_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Medical Statistics Report</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Medical Statistics Dashboard</div>
                <div class="subtitle">Population Health and Consultation Overview</div>
            </div>
            
            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Total Patients</div>
                        <div class="metric-value">{{{{ total_patients }}}}</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Consultations</div>
                        <div class="metric-value">{{{{ total_consultations }}}}</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Avg Age</div>
                        <div class="metric-value">{{{{ avg_age|floatformat:1 }}}}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Top 10 Diagnoses</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Diagnosis</th><th>Cases</th><th>Percentage</th><th>Avg Age</th></tr>
                    </thead>
                    <tbody>
                        {{% for diagnosis in top_diagnoses %}}
                        <tr>
                            <td>{{{{ diagnosis.name }}}}</td>
                            <td>{{{{ diagnosis.case_count }}}}</td>
                            <td>{{{{ diagnosis.percentage|floatformat:1 }}}}%</td>
                            <td>{{{{ diagnosis.avg_age|floatformat:1 }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Monthly Trends</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Month</th><th>Consultations</th><th>Medical</th><th>Emergency</th></tr>
                    </thead>
                    <tbody>
                        {{% for month in monthly_trends %}}
                        <tr>
                            <td>{{{{ month.name }}}}</td>
                            <td>{{{{ month.total }}}}</td>
                            <td>{{{{ month.medical }}}}</td>
                            <td>{{{{ month.emergency }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_dental_statistics_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dental Health Report</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Dental Health Statistics</div>
                <div class="subtitle">USC Patient Information System</div>
            </div>

            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Total Procedures</div>
                        <div class="metric-value">{{{{ total_procedures }}}}</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Preventive Care Rate</div>
                        <div class="metric-value">{{{{ preventive_care_rate }}}}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Common Dental Procedures</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Procedure</th><th>Count</th><th>Success Rate</th><th>Avg Duration</th></tr>
                    </thead>
                    <tbody>
                        {{% for proc in common_procedures %}}
                        <tr>
                            <td>{{{{ proc.name }}}}</td>
                            <td>{{{{ proc.count }}}}</td>
                            <td>{{{{ proc.success_rate }}}}%</td>
                            <td>{{{{ proc.avg_duration }}}} min</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Health by Age Group</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Age Group</th><th>Patients</th><th>Cavities Rate</th><th>Gum Disease</th></tr>
                    </thead>
                    <tbody>
                        {{% for age in dental_by_age %}}
                        <tr>
                            <td>{{{{ age.range }}}}</td>
                            <td>{{{{ age.patient_count }}}}</td>
                            <td>{{{{ age.cavities_rate }}}}%</td>
                            <td>{{{{ age.gum_disease_rate }}}}%</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_feedback_analysis_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Feedback Analysis</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Patient Feedback Analysis</div>
                <div class="subtitle">Satisfaction and Service Quality Metrics</div>
            </div>

            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Avg Rating</div>
                        <div class="metric-value">{{{{ avg_rating }}}} / 5.0</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Satisfaction Score</div>
                        <div class="metric-value">{{{{ satisfaction_score }}}}%</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Response Rate</div>
                        <div class="metric-value">{{{{ response_rate }}}}%</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 20px; font-size: 10pt; color: #666;">
                <strong>Total Responses:</strong> {{{{ total_responses }}}} | <strong>Total Visits in Period:</strong> {{{{ total_visits }}}}
            </div>

            <div class="section">
                <div class="section-title">Rating Distribution</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Excellent (5★)</td><td>{{{{ excellent_count }}}}</td><td>{{{{ excellent_percentage|floatformat:1 }}}}%</td></tr>
                        <tr><td>Good (4★)</td><td>{{{{ good_count }}}}</td><td>{{{{ good_percentage|floatformat:1 }}}}%</td></tr>
                        <tr><td>Fair (3★)</td><td>{{{{ fair_count }}}}</td><td>{{{{ fair_percentage|floatformat:1 }}}}%</td></tr>
                        <tr><td>Poor (1-2★)</td><td>{{{{ poor_count }}}}</td><td>{{{{ poor_percentage|floatformat:1 }}}}%</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Recent Comments</div>
                {{% for comment in recent_comments %}}
                <div style="border-bottom: 1px solid #eee; padding: 5px; font-size: 8pt;">
                    <strong>Rating: {{{{ comment.rating }}}}★</strong> - {{{{ comment.date|date:"Y-m-d" }}}}<br>
                    <span style="font-style: italic;">"{{{{ comment.text }}}}"</span>
                </div>
                {{% endfor %}}
            </div>
        </body>
        </html>
        """

    def get_campaign_performance_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Campaign Performance</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">Health Campaign Reach Analytics</div>
                <div class="subtitle">Outreach and Awareness Performance</div>
            </div>

            <div style="display: table; width: 100%; margin-bottom: 20px;">
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Total Reach (Views)</div>
                        <div class="metric-value">{{{{ total_views }}}}</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 50%; padding: 5px;">
                    <div class="metric-box">
                        <div class="metric-label">Average Views per Campaign</div>
                        <div class="metric-value">{{{{ avg_views_per_campaign|floatformat:1 }}}}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Campaign Reach Summary</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Campaign</th><th>Reach (Views)</th><th>Type</th><th>Priority</th></tr>
                    </thead>
                    <tbody>
                        {{% for camp in campaign_performance %}}
                        <tr>
                            <td>{{{{ camp.title }}}}</td>
                            <td>{{{{ camp.views }}}}</td>
                            <td>{{{{ camp.type }}}}</td>
                            <td>{{{{ camp.priority }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Visual Asset Effectiveness (Reach Analysis)</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>Asset Type</th><th>Campaigns</th><th>Avg Reach (Views)</th></tr>
                    </thead>
                    <tbody>
                        {{% for asset in asset_effectiveness %}}
                        <tr>
                            <td>{{{{ asset.asset_type }}}}</td>
                            <td>{{{{ asset.campaigns }}}}</td>
                            <td>{{{{ asset.avg_views|floatformat:1 }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_user_activity_template(self):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>User Activity</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">System Activity Report</div>
                <div class="subtitle">User Engagement and Access Logs</div>
            </div>
            
            <div class="metric-box" style="width: 30%;">
                <div class="metric-label">Active Users</div>
                <div class="metric-value">{{{{ active_users_period }}}}</div>
            </div>

            <div class="section">
                <div class="section-title">Recent Login Activity</div>
                <table class="usc-table">
                    <thead>
                        <tr><th>User</th><th>Role</th><th>Last Login</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {{% for log in system_log %}}
                        <tr>
                            <td>{{{{ log.User }}}}</td>
                            <td>{{{{ log.Role }}}}</td>
                            <td>{{{{ log.Last_Login|date:"Y-m-d H:i" }}}}</td>
                            <td>{{{{ log.Status }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_health_metrics_template(self):
        return self.get_generic_template("Health Metrics Report")

    def get_generic_template(self, title):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            {self.get_base_style()}
        </head>
        <body>
            <div class="header">
                <div class="title">{title}</div>
                <div class="subtitle">USC Patient Information System</div>
            </div>
            
            <div class="section">
                <div class="section-title">Report Data Summary</div>
                <table class="usc-table">
                    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                    <tbody>
                        {{% for k, v in report_data.items %}}
                        {{% if v|is_simple %}}
                        <tr><td style="font-weight:bold;">{{{{ k|title_clean }}}}</td><td>{{{{ v }}}}</td></tr>
                        {{% endif %}}
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>Generated on: {{{{ report_date }}}}</p>
            </div>
        </body>
        </html>
        """
