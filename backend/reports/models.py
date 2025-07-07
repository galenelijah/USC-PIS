from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from patients.models import Patient, MedicalRecord
from authentication.models import User
import json

class ReportTemplate(models.Model):
    """Templates for different types of reports"""
    
    REPORT_TYPES = [
        ('PATIENT_SUMMARY', 'Patient Summary Report'),
        ('VISIT_TRENDS', 'Visit Trends Report'),
        ('TREATMENT_OUTCOMES', 'Treatment Outcomes Report'),
        ('MEDICAL_STATISTICS', 'Medical Statistics Report'),
        ('DENTAL_STATISTICS', 'Dental Statistics Report'),
        ('FEEDBACK_ANALYSIS', 'Feedback Analysis Report'),
        ('CAMPAIGN_PERFORMANCE', 'Campaign Performance Report'),
        ('USER_ACTIVITY', 'User Activity Report'),
        ('HEALTH_METRICS', 'Health Metrics Report'),
        ('INVENTORY_REPORT', 'Inventory Report'),
        ('FINANCIAL_REPORT', 'Financial Report'),
        ('COMPLIANCE_REPORT', 'Compliance Report'),
        ('CUSTOM', 'Custom Report'),
    ]
    
    EXPORT_FORMATS = [
        ('PDF', 'PDF Document'),
        ('EXCEL', 'Excel Spreadsheet'),
        ('CSV', 'CSV File'),
        ('JSON', 'JSON Data'),
        ('HTML', 'HTML Report'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    report_type = models.CharField(max_length=25, choices=REPORT_TYPES)
    template_content = models.TextField(help_text="HTML template for the report")
    default_filters = models.JSONField(default=dict, help_text="Default filter settings")
    supported_formats = models.JSONField(default=list, help_text="List of supported export formats")
    
    # Configuration
    is_active = models.BooleanField(default=True)
    requires_date_range = models.BooleanField(default=True)
    requires_patient_filter = models.BooleanField(default=False)
    requires_user_filter = models.BooleanField(default=False)
    
    # Permissions
    allowed_roles = models.JSONField(default=list, help_text="List of user roles allowed to generate this report")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['report_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"

class GeneratedReport(models.Model):
    """Tracks generated reports and their metadata"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('EXPIRED', 'Expired'),
    ]
    
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='generated_reports')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Report Parameters
    title = models.CharField(max_length=300)
    date_range_start = models.DateTimeField(null=True, blank=True)
    date_range_end = models.DateTimeField(null=True, blank=True)
    filters = models.JSONField(default=dict, help_text="Applied filters for this report")
    export_format = models.CharField(max_length=10, choices=ReportTemplate.EXPORT_FORMATS)
    
    # Status and Results
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    progress_percentage = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # File Storage
    file_path = models.FileField(
        upload_to='reports/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'xlsx', 'csv', 'json', 'html'])],
        null=True, blank=True
    )
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    
    # Metadata
    record_count = models.PositiveIntegerField(null=True, blank=True, help_text="Number of records in report")
    generation_time = models.DurationField(null=True, blank=True, help_text="Time taken to generate report")
    expires_at = models.DateTimeField(null=True, blank=True, help_text="When this report expires")
    download_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['generated_by', 'status']),
            models.Index(fields=['template', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    def increment_download_count(self):
        """Increment download count"""
        self.download_count += 1
        self.save(update_fields=['download_count'])

class ReportMetric(models.Model):
    """Stores calculated metrics for reports"""
    
    METRIC_TYPES = [
        ('COUNT', 'Count'),
        ('PERCENTAGE', 'Percentage'),
        ('AVERAGE', 'Average'),
        ('SUM', 'Sum'),
        ('RATIO', 'Ratio'),
        ('TREND', 'Trend'),
        ('DISTRIBUTION', 'Distribution'),
    ]
    
    report = models.ForeignKey(GeneratedReport, on_delete=models.CASCADE, related_name='metrics')
    metric_name = models.CharField(max_length=100)
    metric_type = models.CharField(max_length=15, choices=METRIC_TYPES)
    metric_value = models.JSONField(help_text="Metric value (can be number, list, dict)")
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['display_order', 'metric_name']
        unique_together = ['report', 'metric_name']
    
    def __str__(self):
        return f"{self.metric_name}: {self.metric_value}"

class ReportChart(models.Model):
    """Stores chart data for reports"""
    
    CHART_TYPES = [
        ('BAR', 'Bar Chart'),
        ('LINE', 'Line Chart'),
        ('PIE', 'Pie Chart'),
        ('DOUGHNUT', 'Doughnut Chart'),
        ('AREA', 'Area Chart'),
        ('SCATTER', 'Scatter Plot'),
        ('HISTOGRAM', 'Histogram'),
        ('HEATMAP', 'Heatmap'),
    ]
    
    report = models.ForeignKey(GeneratedReport, on_delete=models.CASCADE, related_name='charts')
    chart_title = models.CharField(max_length=200)
    chart_type = models.CharField(max_length=15, choices=CHART_TYPES)
    chart_data = models.JSONField(help_text="Chart.js compatible data structure")
    chart_options = models.JSONField(default=dict, help_text="Chart.js options")
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['display_order', 'chart_title']
    
    def __str__(self):
        return f"{self.chart_title} ({self.get_chart_type_display()})"

class ReportSchedule(models.Model):
    """Schedules for automatic report generation"""
    
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]
    
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='schedules')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Schedule Configuration
    frequency = models.CharField(max_length=15, choices=FREQUENCY_CHOICES)
    day_of_week = models.PositiveIntegerField(null=True, blank=True, help_text="0=Monday, 6=Sunday")
    day_of_month = models.PositiveIntegerField(null=True, blank=True, help_text="1-31")
    time_of_day = models.TimeField(help_text="Time to generate report")
    
    # Recipients
    email_recipients = models.JSONField(default=list, help_text="List of email addresses")
    user_recipients = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='scheduled_reports')
    
    # Configuration
    export_format = models.CharField(max_length=10, choices=ReportTemplate.EXPORT_FORMATS, default='PDF')
    filters = models.JSONField(default=dict, help_text="Default filters for scheduled reports")
    is_active = models.BooleanField(default=True)
    
    # Tracking
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    run_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_schedules')
    
    class Meta:
        ordering = ['next_run', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"

class ReportAnalytics(models.Model):
    """Analytics about report usage and performance"""
    
    report_template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='analytics')
    
    # Usage Statistics
    total_generations = models.PositiveIntegerField(default=0)
    total_downloads = models.PositiveIntegerField(default=0)
    unique_users = models.PositiveIntegerField(default=0)
    
    # Performance Statistics
    average_generation_time = models.DurationField(null=True, blank=True)
    average_file_size = models.PositiveIntegerField(null=True, blank=True)
    success_rate = models.FloatField(default=0.0, help_text="Percentage of successful generations")
    
    # Popular Formats
    pdf_downloads = models.PositiveIntegerField(default=0)
    excel_downloads = models.PositiveIntegerField(default=0)
    csv_downloads = models.PositiveIntegerField(default=0)
    
    # Time Tracking
    last_calculated = models.DateTimeField(auto_now=True)
    calculation_period_start = models.DateTimeField()
    calculation_period_end = models.DateTimeField()
    
    class Meta:
        unique_together = ['report_template', 'calculation_period_start', 'calculation_period_end']
        ordering = ['-last_calculated']
    
    def __str__(self):
        return f"Analytics for {self.report_template.name}"

class ReportBookmark(models.Model):
    """User bookmarks for frequently used reports"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_bookmarks')
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    name = models.CharField(max_length=200, help_text="Custom name for this bookmark")
    saved_filters = models.JSONField(default=dict, help_text="Saved filter preferences")
    preferred_format = models.CharField(max_length=10, choices=ReportTemplate.EXPORT_FORMATS, default='PDF')
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    use_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'template', 'name']
        ordering = ['-last_used']
    
    def __str__(self):
        return f"{self.name} (by {self.user.email})"
    
    def increment_use_count(self):
        """Increment use count and update last used"""
        self.use_count += 1
        self.save(update_fields=['use_count', 'last_used']) 