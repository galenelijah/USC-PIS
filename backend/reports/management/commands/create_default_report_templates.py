from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import ReportTemplate

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
                'template_content': self.get_generic_template("User Activity Report"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Health Metrics Report',
                'description': 'Population-level health indicators and trends',
                'report_type': 'HEALTH_METRICS',
                'template_content': self.get_generic_template("Health Metrics Report"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['DOCTOR', 'ADMIN']
            },
            {
                'name': 'Inventory Report',
                'description': 'Overview of medical supplies and stock status',
                'report_type': 'INVENTORY_REPORT',
                'template_content': self.get_generic_template("Inventory Report"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
            },
            {
                'name': 'Financial Overview',
                'description': 'Operational costs and billing summaries',
                'report_type': 'FINANCIAL_REPORT',
                'template_content': self.get_generic_template("Financial Overview"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Compliance & Privacy Report',
                'description': 'Data security, privacy audit, and compliance status',
                'report_type': 'COMPLIANCE_REPORT',
                'template_content': self.get_generic_template("Compliance & Privacy Report"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['ADMIN']
            },
            {
                'name': 'Custom Ad-hoc Report',
                'description': 'Flexible report based on custom criteria',
                'report_type': 'CUSTOM',
                'template_content': self.get_generic_template("Custom Report"),
                'supported_formats': ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
                'allowed_roles': ['STAFF', 'ADMIN']
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
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary: {created_count} templates created, {updated_count} templates updated"
            )
        )

    def _apply_shared_styles(self, content: str) -> str:
        """Insert shared report CSS after the first <style> tag or inside <head>."""
        css = self.shared_css()
        if not isinstance(content, str):
            return content
        if '<style>' in content:
            return content.replace('<style>', '<style>\n' + css + '\n', 1)
        if '<head>' in content:
            return content.replace('<head>', '<head>\n<style>\n' + css + '\n</style>\n', 1)
        # No head/style — prepend minimal style
        return '<style>\n' + css + '\n</style>\n' + content

    def shared_css(self) -> str:
        return (
            "/* Shared USC-PIS Report Styles */\n"
            ".usc-header { text-align:center; border-bottom:2px solid #0B4F6C; padding-bottom:16px; margin-bottom:24px; }\n"
            ".usc-title { color:#0B4F6C; font-size:22px; font-weight:700; margin:4px 0; }\n"
            ".usc-subtitle { color:#246A73; font-size:14px; }\n"
            ".usc-logo { color:#0B4F6C; font-size:16px; font-weight:600; }\n"
            ".usc-footer { text-align:center; margin-top:28px; padding-top:12px; border-top:1px solid #ddd; font-size:12px; color:#666; }\n"
            ".usc-table { width:100%; border-collapse:collapse; margin:8px 0 16px 0; }\n"
            ".usc-table th, .usc-table td { border:1px solid #ddd; padding:8px; text-align:left; }\n"
            ".usc-table th { background:#f5f7fa; font-weight:700; }\n"
            ".usc-badge { display:inline-block; background:#e8f4fd; color:#0B4F6C; padding:2px 8px; border-radius:10px; font-size:12px; }\n"
        )

    def get_patient_summary_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .patient-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .section { margin-bottom: 25px; }
                .section-title { color: #003d7a; font-size: 18px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Patient Summary Report</h2>
                <p>Generated on: {{ report_date }}</p>
            </div>
            
            <div class="patient-info">
                <h3>Patient Information</h3>
                <table class="table">
                    <tr><td><strong>Name:</strong></td><td>{{ patient.first_name }} {{ patient.last_name }}</td></tr>
                    <tr><td><strong>Student ID:</strong></td><td>{{ patient.student_id }}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>{{ patient.email }}</td></tr>
                    <tr><td><strong>Contact:</strong></td><td>{{ patient.contact_number }}</td></tr>
                    <tr><td><strong>Date of Birth:</strong></td><td>{{ patient.date_of_birth }}</td></tr>
                    <tr><td><strong>Age:</strong></td><td>{{ patient.age }} years</td></tr>
                    <tr><td><strong>Gender:</strong></td><td>{{ patient.gender }}</td></tr>
                    <tr><td><strong>Blood Type:</strong></td><td>{{ patient.blood_type }}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Medical History Summary</div>
                <p><strong>Allergies:</strong> {{ patient.allergies|default:"None reported" }}</p>
                <p><strong>Medical Conditions:</strong> {{ patient.medical_conditions|default:"None reported" }}</p>
                <p><strong>Current Medications:</strong> {{ patient.current_medications|default:"None reported" }}</p>
            </div>
            
            {% if medical_records %}
            <div class="section">
                <div class="section-title">Recent Medical Records</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Chief Complaint</th>
                            <th>Diagnosis</th>
                            <th>Treatment</th>
                            <th>Doctor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for record in medical_records %}
                        <tr>
                            <td>{{ record.created_at|date:"M d, Y" }}</td>
                            <td>{{ record.chief_complaint }}</td>
                            <td>{{ record.diagnosis }}</td>
                            <td>{{ record.treatment_plan }}</td>
                            <td>Dr. {{ record.doctor.get_full_name }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            {% endif %}
            
            {% if dental_records %}
            <div class="section">
                <div class="section-title">Recent Dental Records</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Procedure</th>
                            <th>Teeth Involved</th>
                            <th>Notes</th>
                            <th>Dentist</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for record in dental_records %}
                        <tr>
                            <td>{{ record.created_at|date:"M d, Y" }}</td>
                            <td>{{ record.procedure_performed }}</td>
                            <td>{{ record.teeth_involved }}</td>
                            <td>{{ record.notes }}</td>
                            <td>Dr. {{ record.dentist.get_full_name }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            {% endif %}
            
            <div class="footer">
                <p>University of San Carlos - Health Services</p>
                <p>This report is confidential and intended for medical personnel only.</p>
            </div>
        </body>
        </html>
        """

    def get_visit_trends_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Visit Trends Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .metrics { display: flex; justify-content: space-around; margin-bottom: 30px; }
                .metric-card { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; min-width: 150px; }
                .metric-value { font-size: 32px; font-weight: bold; color: #003d7a; }
                .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
                .chart-container { margin-bottom: 30px; text-align: center; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Visit Trends Report</h2>
                <p>Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">{{ total_visits }}</div>
                    <div class="metric-label">Total Visits</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{{ unique_patients }}</div>
                    <div class="metric-label">Unique Patients</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{{ avg_daily_visits }}</div>
                    <div class="metric-label">Avg Daily Visits</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{{ peak_day_visits }}</div>
                    <div class="metric-label">Peak Day Visits</div>
                </div>
            </div>
            
            {% if visit_trends_chart %}
            <div class="chart-container">
                <h3>Visit Trends Over Time</h3>
                <div id="visit-trends-chart">{{ visit_trends_chart }}</div>
            </div>
            {% endif %}
            
            <div class="section">
                <h3>Visit Summary by Month</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Total Visits</th>
                            <th>Medical Consultations</th>
                            <th>Dental Consultations</th>
                            <th>Growth %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for month_data in monthly_summary %}
                        <tr>
                            <td>{{ month_data.month }}</td>
                            <td>{{ month_data.total_visits }}</td>
                            <td>{{ month_data.medical_visits }}</td>
                            <td>{{ month_data.dental_visits }}</td>
                            <td>{{ month_data.growth_percentage|floatformat:1 }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_treatment_outcomes_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Treatment Outcomes Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .outcome-summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .success-rate { color: #28a745; font-weight: bold; }
                .improvement-rate { color: #007bff; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Treatment Outcomes Report</h2>
                <p>Analysis Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="outcome-summary">
                <h3>Overall Treatment Effectiveness</h3>
                <p><strong>Total Treatments Analyzed:</strong> {{ total_treatments }}</p>
                <p><strong>Overall Success Rate:</strong> <span class="success-rate">{{ overall_success_rate|floatformat:1 }}%</span></p>
                <p><strong>Patient Improvement Rate:</strong> <span class="improvement-rate">{{ improvement_rate|floatformat:1 }}%</span></p>
                <p><strong>Average Treatment Duration:</strong> {{ avg_treatment_duration }} days</p>
            </div>
            
            <div class="section">
                <h3>Treatment Outcomes by Category</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Treatment Category</th>
                            <th>Total Cases</th>
                            <th>Successful</th>
                            <th>Improved</th>
                            <th>No Change</th>
                            <th>Success Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for outcome in treatment_outcomes %}
                        <tr>
                            <td>{{ outcome.category }}</td>
                            <td>{{ outcome.total_cases }}</td>
                            <td>{{ outcome.successful }}</td>
                            <td>{{ outcome.improved }}</td>
                            <td>{{ outcome.no_change }}</td>
                            <td class="success-rate">{{ outcome.success_rate|floatformat:1 }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Top Performing Treatments</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Treatment</th>
                            <th>Cases</th>
                            <th>Success Rate</th>
                            <th>Avg Duration</th>
                            <th>Patient Satisfaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for treatment in top_treatments %}
                        <tr>
                            <td>{{ treatment.name }}</td>
                            <td>{{ treatment.case_count }}</td>
                            <td class="success-rate">{{ treatment.success_rate|floatformat:1 }}%</td>
                            <td>{{ treatment.avg_duration }} days</td>
                            <td>{{ treatment.satisfaction_score|floatformat:1 }}/5.0</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_medical_statistics_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Medical Statistics Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #f8f9fa; padding: 20px; border-radius: 5px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Medical Statistics Report</h2>
                <p>Reporting Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Patient Demographics</h4>
                    <p><strong>Total Active Patients:</strong> {{ total_patients }}</p>
                    <p><strong>New Registrations:</strong> {{ new_patients }}</p>
                    <p><strong>Average Age:</strong> {{ avg_age|floatformat:1 }} years</p>
                </div>
                <div class="stat-card">
                    <h4>Consultations</h4>
                    <p><strong>Total Consultations:</strong> {{ total_consultations }}</p>
                    <p><strong>Medical Consultations:</strong> {{ medical_consultations }}</p>
                    <p><strong>Follow-up Visits:</strong> {{ followup_visits }}</p>
                </div>
                <div class="stat-card">
                    <h4>Health Indicators</h4>
                    <p><strong>Most Common Condition:</strong> {{ top_condition }}</p>
                    <p><strong>Emergency Cases:</strong> {{ emergency_cases }}</p>
                    <p><strong>Referrals Made:</strong> {{ referrals_count }}</p>
                </div>
            </div>
            
            <div class="section">
                <h3>Top 10 Diagnoses</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Diagnosis</th>
                            <th>Cases</th>
                            <th>Percentage</th>
                            <th>Avg Age</th>
                            <th>Gender Ratio (M:F)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for diagnosis in top_diagnoses %}
                        <tr>
                            <td>{{ diagnosis.name }}</td>
                            <td>{{ diagnosis.case_count }}</td>
                            <td>{{ diagnosis.percentage|floatformat:1 }}%</td>
                            <td>{{ diagnosis.avg_age|floatformat:1 }}</td>
                            <td>{{ diagnosis.gender_ratio }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Monthly Consultation Trends</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Total Consultations</th>
                            <th>Medical</th>
                            <th>Emergency</th>
                            <th>Follow-up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for month in monthly_trends %}
                        <tr>
                            <td>{{ month.name }}</td>
                            <td>{{ month.total }}</td>
                            <td>{{ month.medical }}</td>
                            <td>{{ month.emergency }}</td>
                            <td>{{ month.followup }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_dental_statistics_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dental Health Statistics Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .dental-overview { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Dental Health Statistics Report</h2>
                <p>Analysis Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="dental-overview">
                <h3>Dental Health Overview</h3>
                <p><strong>Total Dental Patients:</strong> {{ total_dental_patients }}</p>
                <p><strong>Dental Procedures Performed:</strong> {{ total_procedures }}</p>
                <p><strong>Average Oral Health Index:</strong> {{ avg_oral_health|floatformat:1 }}/10</p>
                <p><strong>Preventive Care Rate:</strong> {{ preventive_care_rate|floatformat:1 }}%</p>
            </div>
            
            <div class="section">
                <h3>Most Common Dental Procedures</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Procedure</th>
                            <th>Count</th>
                            <th>Success Rate</th>
                            <th>Avg Duration</th>
                            <th>Patient Age Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for procedure in common_procedures %}
                        <tr>
                            <td>{{ procedure.name }}</td>
                            <td>{{ procedure.count }}</td>
                            <td>{{ procedure.success_rate|floatformat:1 }}%</td>
                            <td>{{ procedure.avg_duration }} min</td>
                            <td>{{ procedure.age_range }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Dental Health by Age Group</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Age Group</th>
                            <th>Patients</th>
                            <th>Cavities Rate</th>
                            <th>Gum Disease Rate</th>
                            <th>Regular Checkups</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for age_group in dental_by_age %}
                        <tr>
                            <td>{{ age_group.range }}</td>
                            <td>{{ age_group.patient_count }}</td>
                            <td>{{ age_group.cavities_rate|floatformat:1 }}%</td>
                            <td>{{ age_group.gum_disease_rate|floatformat:1 }}%</td>
                            <td>{{ age_group.regular_checkups|floatformat:1 }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_feedback_analysis_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Feedback Analysis Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .feedback-summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                .rating-excellent { color: #28a745; font-weight: bold; }
                .rating-good { color: #007bff; font-weight: bold; }
                .rating-fair { color: #ffc107; font-weight: bold; }
                .rating-poor { color: #dc3545; font-weight: bold; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Patient Feedback Analysis Report</h2>
                <p>Analysis Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="feedback-summary">
                <h3>Feedback Summary</h3>
                <p><strong>Total Feedback Responses:</strong> {{ total_responses }}</p>
                <p><strong>Average Overall Rating:</strong> {{ avg_rating|floatformat:1 }}/5.0</p>
                <p><strong>Response Rate:</strong> {{ response_rate|floatformat:1 }}%</p>
                <p><strong>Satisfaction Score:</strong> {{ satisfaction_score|floatformat:1 }}%</p>
            </div>
            
            <div class="section">
                <h3>Rating Distribution</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Rating</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="rating-excellent">Excellent (5 stars)</td>
                            <td>{{ excellent_count }}</td>
                            <td>{{ excellent_percentage|floatformat:1 }}%</td>
                            <td>{{ excellent_trend }}</td>
                        </tr>
                        <tr>
                            <td class="rating-good">Good (4 stars)</td>
                            <td>{{ good_count }}</td>
                            <td>{{ good_percentage|floatformat:1 }}%</td>
                            <td>{{ good_trend }}</td>
                        </tr>
                        <tr>
                            <td class="rating-fair">Fair (3 stars)</td>
                            <td>{{ fair_count }}</td>
                            <td>{{ fair_percentage|floatformat:1 }}%</td>
                            <td>{{ fair_trend }}</td>
                        </tr>
                        <tr>
                            <td class="rating-poor">Poor (1-2 stars)</td>
                            <td>{{ poor_count }}</td>
                            <td>{{ poor_percentage|floatformat:1 }}%</td>
                            <td>{{ poor_trend }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Key Feedback Themes</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Theme</th>
                            <th>Mentions</th>
                            <th>Sentiment</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for theme in feedback_themes %}
                        <tr>
                            <td>{{ theme.name }}</td>
                            <td>{{ theme.mention_count }}</td>
                            <td>{{ theme.sentiment }}</td>
                            <td>{{ theme.priority }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Recent Comments (Sample)</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    {% for comment in recent_comments %}
                    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                        <p><strong>Rating:</strong> {{ comment.rating }}/5 | <strong>Date:</strong> {{ comment.date|date:"M d, Y" }}</p>
                        <p style="font-style: italic;">"{{ comment.text }}"</p>
                        <p><small>- {{ comment.patient_type }} Patient</small></p>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </body>
        </html>
        """

    def get_generic_template(self, title):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ color: #003d7a; font-size: 24px; font-weight: bold; }}
                .section {{ margin-bottom: 25px; }}
                .table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
                .table th, .table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                .table th {{ background-color: #f8f9fa; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>{title}</h2>
                <p>Period: {{{{ date_range_start|date:"M d, Y" }}}} - {{{{ date_range_end|date:"M d, Y" }}}}</p>
            </div>
            
            <div class="section">
                <h3>Report Data</h3>
                <table class="table">
                    <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                        {{% for k, v in report_data.items %}}
                        {{% if v|is_simple %}}
                        <tr><td><strong>{{{{ k|title_clean }}}}:</strong></td><td>{{{{ v }}}}</td></tr>
                        {{% endif %}}
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """

    def get_campaign_performance_template(self):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Campaign Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #003d7a; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { color: #003d7a; font-size: 24px; font-weight: bold; }
                .campaign-overview { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .performance-high { color: #28a745; font-weight: bold; }
                .performance-medium { color: #ffc107; font-weight: bold; }
                .performance-low { color: #dc3545; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">University of San Carlos - Patient Information System</div>
                <h2>Health Campaign Performance Report</h2>
                <p>Analysis Period: {{ date_range_start|date:"M d, Y" }} - {{ date_range_end|date:"M d, Y" }}</p>
            </div>
            
            <div class="campaign-overview">
                <h3>Campaign Overview</h3>
                <p><strong>Active Campaigns:</strong> {{ active_campaigns }}</p>
                <p><strong>Total Participants:</strong> {{ total_participants }}</p>
                <p><strong>Average Engagement Rate:</strong> {{ avg_engagement_rate|floatformat:1 }}%</p>
                <p><strong>Campaign Completion Rate:</strong> {{ completion_rate|floatformat:1 }}%</p>
            </div>
            
            <div class="section">
                <h3>Campaign Performance Summary</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Participants</th>
                            <th>Completion Rate</th>
                            <th>Engagement</th>
                            <th>Feedback Score</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for campaign in campaign_performance %}
                        <tr>
                            <td>{{ campaign.title }}</td>
                            <td>{{ campaign.participant_count }}</td>
                            <td>{{ campaign.completion_rate|floatformat:1 }}%</td>
                            <td>{{ campaign.engagement_rate|floatformat:1 }}%</td>
                            <td>{{ campaign.feedback_score|floatformat:1 }}/5.0</td>
                            <td class="{% if campaign.performance == 'High' %}performance-high{% elif campaign.performance == 'Medium' %}performance-medium{% else %}performance-low{% endif %}">
                                {{ campaign.performance }}
                            </td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Participant Demographics</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Demographic</th>
                            <th>Participants</th>
                            <th>Percentage</th>
                            <th>Engagement Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for demo in participant_demographics %}
                        <tr>
                            <td>{{ demo.category }}</td>
                            <td>{{ demo.count }}</td>
                            <td>{{ demo.percentage|floatformat:1 }}%</td>
                            <td>{{ demo.engagement_rate|floatformat:1 }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h3>Campaign Feedback Summary</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    {% for feedback in campaign_feedback %}
                    <div style="margin-bottom: 15px;">
                        <p><strong>{{ feedback.campaign_title }}</strong></p>
                        <p>{{ feedback.summary }}</p>
                        <p><small>Average Rating: {{ feedback.avg_rating|floatformat:1 }}/5.0 | Responses: {{ feedback.response_count }}</small></p>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </body>
        </html>
        """ 
