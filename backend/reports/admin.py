from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count
from .models import (
    ReportTemplate, GeneratedReport, ReportMetric, ReportChart,
    ReportSchedule, ReportAnalytics, ReportBookmark
)

class ReportMetricInline(admin.TabularInline):
    model = ReportMetric
    extra = 0
    readonly_fields = ('metric_name', 'metric_type', 'metric_value')

class ReportChartInline(admin.TabularInline):
    model = ReportChart
    extra = 0
    readonly_fields = ('chart_title', 'chart_type', 'display_order')

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'report_type', 'is_active', 'generation_count',
        'requires_date_range', 'requires_patient_filter', 'created_at'
    ]
    list_filter = [
        'report_type', 'is_active', 'requires_date_range', 
        'requires_patient_filter', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'generation_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'report_type', 'is_active')
        }),
        ('Template Content', {
            'fields': ('template_content',),
            'classes': ('wide',)
        }),
        ('Configuration', {
            'fields': (
                'default_filters', 'supported_formats', 'allowed_roles',
                'requires_date_range', 'requires_patient_filter', 'requires_user_filter'
            )
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'created_by', 'generation_count'),
            'classes': ('collapse',)
        })
    )
    
    def generation_count(self, obj):
        return obj.generated_reports.count()
    generation_count.short_description = 'Generated Reports'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'template', 'status_badge', 'export_format',
        'generated_by', 'progress_percentage', 'file_size_display',
        'download_count', 'created_at', 'completed_at'
    ]
    list_filter = [
        'status', 'export_format', 'template__report_type',
        'created_at', 'completed_at'
    ]
    search_fields = ['title', 'template__name', 'generated_by__email']
    readonly_fields = [
        'status', 'progress_percentage', 'error_message', 'file_path',
        'file_size', 'record_count', 'generation_time', 'created_at',
        'completed_at', 'download_count'
    ]
    inlines = [ReportMetricInline, ReportChartInline]
    
    fieldsets = (
        ('Report Information', {
            'fields': ('template', 'generated_by', 'title', 'export_format')
        }),
        ('Parameters', {
            'fields': ('date_range_start', 'date_range_end', 'filters')
        }),
        ('Status', {
            'fields': ('status', 'progress_percentage', 'error_message')
        }),
        ('Results', {
            'fields': ('file_path', 'file_size', 'record_count', 'generation_time')
        }),
        ('Usage', {
            'fields': ('download_count', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at'),
            'classes': ('collapse',)
        })
    )
    
    def status_badge(self, obj):
        colors = {
            'PENDING': '#ffc107',
            'GENERATING': '#007bff',
            'COMPLETED': '#28a745',
            'FAILED': '#dc3545',
            'EXPIRED': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def file_size_display(self, obj):
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return '-'
    file_size_display.short_description = 'File Size'
    
    actions = ['retry_failed_reports', 'cleanup_expired_reports']
    
    def retry_failed_reports(self, request, queryset):
        failed_reports = queryset.filter(status='FAILED')
        count = 0
        for report in failed_reports:
            # Reset status to pending for retry
            report.status = 'PENDING'
            report.progress_percentage = 0
            report.error_message = ''
            report.save()
            count += 1
        
        self.message_user(request, f'{count} reports queued for retry.')
    retry_failed_reports.short_description = "Retry failed reports"
    
    def cleanup_expired_reports(self, request, queryset):
        expired_reports = queryset.filter(expires_at__lt=timezone.now())
        count = expired_reports.count()
        expired_reports.update(status='EXPIRED')
        
        self.message_user(request, f'{count} reports marked as expired.')
    cleanup_expired_reports.short_description = "Mark expired reports"

@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template', 'frequency', 'is_active',
        'next_run', 'last_run', 'run_count', 'created_by'
    ]
    list_filter = [
        'frequency', 'is_active', 'template__report_type', 'created_at'
    ]
    search_fields = ['name', 'description', 'template__name']
    readonly_fields = ['last_run', 'next_run', 'run_count', 'created_at']
    filter_horizontal = ['user_recipients']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'template', 'is_active')
        }),
        ('Schedule Configuration', {
            'fields': (
                'frequency', 'day_of_week', 'day_of_month', 'time_of_day'
            )
        }),
        ('Recipients', {
            'fields': ('email_recipients', 'user_recipients')
        }),
        ('Report Settings', {
            'fields': ('export_format', 'filters')
        }),
        ('Tracking', {
            'fields': ('last_run', 'next_run', 'run_count'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(ReportAnalytics)
class ReportAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'report_template', 'total_generations', 'total_downloads',
        'unique_users', 'success_rate', 'last_calculated'
    ]
    list_filter = [
        'report_template__report_type', 'last_calculated'
    ]
    search_fields = ['report_template__name']
    readonly_fields = [
        'total_generations', 'total_downloads', 'unique_users',
        'average_generation_time', 'average_file_size', 'success_rate',
        'pdf_downloads', 'excel_downloads', 'csv_downloads',
        'last_calculated'
    ]
    
    fieldsets = (
        ('Template', {
            'fields': ('report_template',)
        }),
        ('Usage Statistics', {
            'fields': ('total_generations', 'total_downloads', 'unique_users')
        }),
        ('Performance Statistics', {
            'fields': ('average_generation_time', 'average_file_size', 'success_rate')
        }),
        ('Format Breakdown', {
            'fields': ('pdf_downloads', 'excel_downloads', 'csv_downloads')
        }),
        ('Calculation Period', {
            'fields': ('calculation_period_start', 'calculation_period_end', 'last_calculated')
        })
    )

@admin.register(ReportBookmark)
class ReportBookmarkAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user', 'template', 'preferred_format',
        'use_count', 'last_used', 'created_at'
    ]
    list_filter = [
        'template__report_type', 'preferred_format', 'created_at', 'last_used'
    ]
    search_fields = ['name', 'user__email', 'template__name']
    readonly_fields = ['created_at', 'last_used', 'use_count']
    
    fieldsets = (
        ('Bookmark Information', {
            'fields': ('user', 'template', 'name', 'preferred_format')
        }),
        ('Settings', {
            'fields': ('saved_filters',)
        }),
        ('Usage', {
            'fields': ('use_count', 'last_used', 'created_at')
        })
    )

@admin.register(ReportMetric)
class ReportMetricAdmin(admin.ModelAdmin):
    list_display = [
        'report', 'metric_name', 'metric_type', 'display_order'
    ]
    list_filter = ['metric_type', 'report__template__report_type']
    search_fields = ['metric_name', 'report__title']
    ordering = ['report', 'display_order', 'metric_name']

@admin.register(ReportChart)
class ReportChartAdmin(admin.ModelAdmin):
    list_display = [
        'report', 'chart_title', 'chart_type', 'display_order'
    ]
    list_filter = ['chart_type', 'report__template__report_type']
    search_fields = ['chart_title', 'report__title']
    ordering = ['report', 'display_order', 'chart_title']

# Custom admin site configuration
admin.site.site_header = "USC-PIS Reports Administration"
admin.site.site_title = "USC-PIS Reports Admin"
admin.site.index_title = "Welcome to USC-PIS Reports Administration" 