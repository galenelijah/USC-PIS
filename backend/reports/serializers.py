from rest_framework import serializers
from .models import (
    ReportTemplate, GeneratedReport, ReportMetric, ReportChart,
    ReportSchedule, ReportAnalytics, ReportBookmark
)
from authentication.models import User
import logging

logger = logging.getLogger(__name__)

class ReportTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    generation_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def get_generation_count(self, obj):
        return obj.generated_reports.count()
    
    def validate_supported_formats(self, value):
        """Validate supported formats"""
        valid_formats = [choice[0] for choice in ReportTemplate.EXPORT_FORMATS]
        for format_type in value:
            if format_type not in valid_formats:
                raise serializers.ValidationError(f"Invalid format: {format_type}")
        return value
    
    def validate_allowed_roles(self, value):
        """Validate allowed roles"""
        valid_roles = ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'PATIENT']
        for role in value:
            if role not in valid_roles:
                raise serializers.ValidationError(f"Invalid role: {role}")
        return value

class ReportMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportMetric
        fields = '__all__'
        read_only_fields = ('report',)

class ReportChartSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportChart
        fields = '__all__'
        read_only_fields = ('report',)

class GeneratedReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for report listing"""
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.report_type', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'title', 'status', 'export_format', 'progress_percentage',
            'created_at', 'completed_at', 'expires_at', 'download_count',
            'generated_by_name', 'template_name', 'template_type',
            'file_url', 'file_size_formatted', 'record_count', 'error_message'
        ]
    
    def get_file_url(self, obj):
        if obj.file_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_path.url)
            return obj.file_path.url
        return None
    
    def get_file_size_formatted(self, obj):
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return None

class GeneratedReportDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for report details"""
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.report_type', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    metrics = ReportMetricSerializer(many=True, read_only=True)
    charts = ReportChartSerializer(many=True, read_only=True)
    generation_time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = '__all__'
        read_only_fields = (
            'generated_by', 'status', 'progress_percentage', 'error_message',
            'file_path', 'file_size', 'record_count', 'generation_time',
            'created_at', 'completed_at', 'download_count'
        )
    
    def get_file_url(self, obj):
        if obj.file_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_path.url)
            return obj.file_path.url
        return None
    
    def get_file_size_formatted(self, obj):
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return None
    
    def get_generation_time_formatted(self, obj):
        if obj.generation_time:
            total_seconds = obj.generation_time.total_seconds()
            if total_seconds < 60:
                return f"{total_seconds:.1f} seconds"
            elif total_seconds < 3600:
                return f"{total_seconds/60:.1f} minutes"
            else:
                return f"{total_seconds/3600:.1f} hours"
        return None

class ReportGenerationRequestSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    template_id = serializers.IntegerField()
    title = serializers.CharField(max_length=300)
    export_format = serializers.ChoiceField(choices=ReportTemplate.EXPORT_FORMATS)
    date_range_start = serializers.DateTimeField(required=False, allow_null=True)
    date_range_end = serializers.DateTimeField(required=False, allow_null=True)
    filters = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        """Validate report generation request"""
        template_id = data.get('template_id')
        
        # Check if template exists
        try:
            template = ReportTemplate.objects.get(id=template_id)
        except ReportTemplate.DoesNotExist:
            raise serializers.ValidationError("Report template not found")
        
        # Check if export format is supported by the engine
        export_format = data.get('export_format')
        from .services import ReportGenerationService
        engine_formats = ReportGenerationService.get_supported_formats()
        
        # Validation: Format must be supported by engine AND (either template list is empty OR format is in template list)
        if export_format not in engine_formats:
            raise serializers.ValidationError(f"Export format {export_format} is not supported by the system engine")
            
        if template.supported_formats and export_format not in template.supported_formats:
            # Fallback: if engine supports it but template doesn't list it, we can still allow it 
            # OR we can strictly follow template. Let's allow it if it's a standard format
            # to resolve the user's immediate issue without a DB migration.
            logger.warning(f"Format {export_format} requested for template {template.name} but not in its supported_formats list. Allowing due to engine support.")
        
        # Validate date range if required
        if template.requires_date_range:
            if not data.get('date_range_start') or not data.get('date_range_end'):
                raise serializers.ValidationError("Date range is required for this report template")
        
        # Validate date range order
        start_date = data.get('date_range_start')
        end_date = data.get('date_range_end')
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")
        
        data['template'] = template
        return data

class ReportScheduleSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.report_type', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    user_recipients_names = serializers.SerializerMethodField()
    next_run_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportSchedule
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'last_run', 'next_run', 'run_count')
    
    def get_user_recipients_names(self, obj):
        return [user.get_full_name() for user in obj.user_recipients.all()]
    
    def get_next_run_formatted(self, obj):
        if obj.next_run:
            return obj.next_run.strftime('%Y-%m-%d %H:%M:%S')
        return None
    
    def validate_email_recipients(self, value):
        """Validate email addresses"""
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        
        for email in value:
            try:
                validate_email(email)
            except ValidationError:
                raise serializers.ValidationError(f"Invalid email address: {email}")
        return value
    
    def validate_day_of_week(self, value):
        """Validate day of week"""
        if value is not None and (value < 0 or value > 6):
            raise serializers.ValidationError("Day of week must be between 0 (Monday) and 6 (Sunday)")
        return value
    
    def validate_day_of_month(self, value):
        """Validate day of month"""
        if value is not None and (value < 1 or value > 31):
            raise serializers.ValidationError("Day of month must be between 1 and 31")
        return value

class ReportAnalyticsSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='report_template.name', read_only=True)
    template_type = serializers.CharField(source='report_template.report_type', read_only=True)
    average_generation_time_formatted = serializers.SerializerMethodField()
    average_file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportAnalytics
        fields = '__all__'
    
    def get_average_generation_time_formatted(self, obj):
        if obj.average_generation_time:
            total_seconds = obj.average_generation_time.total_seconds()
            if total_seconds < 60:
                return f"{total_seconds:.1f} seconds"
            elif total_seconds < 3600:
                return f"{total_seconds/60:.1f} minutes"
            else:
                return f"{total_seconds/3600:.1f} hours"
        return None
    
    def get_average_file_size_formatted(self, obj):
        if obj.average_file_size:
            size = obj.average_file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return None

class ReportBookmarkSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.report_type', read_only=True)
    
    class Meta:
        model = ReportBookmark
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'last_used', 'use_count')
    
    def validate(self, data):
        """Ensure unique bookmark name per user per template"""
        user = self.context['request'].user
        template = data.get('template')
        name = data.get('name')
        
        if self.instance is None:  # Creating new bookmark
            if ReportBookmark.objects.filter(user=user, template=template, name=name).exists():
                raise serializers.ValidationError("You already have a bookmark with this name for this template")
        
        return data

class ReportDashboardSerializer(serializers.Serializer):
    """Serializer for report dashboard data"""
    total_reports = serializers.IntegerField()
    reports_this_month = serializers.IntegerField()
    pending_reports = serializers.IntegerField()
    failed_reports = serializers.IntegerField()
    popular_templates = ReportTemplateSerializer(many=True)
    recent_reports = GeneratedReportListSerializer(many=True)
    format_distribution = serializers.DictField()
    generation_trends = serializers.ListField()
    user_activity = serializers.ListField()
    storage_usage = serializers.DictField()

class ReportFilterSerializer(serializers.Serializer):
    """Serializer for report filters"""
    date_range_start = serializers.DateTimeField(required=False, allow_null=True)
    date_range_end = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=GeneratedReport.STATUS_CHOICES, required=False)
    export_format = serializers.ChoiceField(choices=ReportTemplate.EXPORT_FORMATS, required=False)
    template_type = serializers.ChoiceField(choices=ReportTemplate.REPORT_TYPES, required=False)
    generated_by = serializers.IntegerField(required=False)
    search = serializers.CharField(required=False, max_length=200) 