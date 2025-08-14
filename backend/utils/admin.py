from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse, path
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib import messages
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from .models import BackupStatus, BackupSchedule, SystemHealthMetric
from .services import backup_service, schedule_service, monitoring_service
import json


@admin.register(BackupStatus)
class BackupStatusAdmin(admin.ModelAdmin):
    list_display = [
        'backup_type_display', 
        'status_display', 
        'started_at', 
        'duration_display',
        'file_size_display',
        'is_recent_display'
    ]
    list_filter = [
        'backup_type', 
        'status', 
        'started_at',
        ('started_at', admin.DateFieldListFilter),
    ]
    search_fields = ['backup_type', 'error_message']
    readonly_fields = [
        'started_at', 
        'duration_display', 
        'file_size_display', 
        'metadata_display'
    ]
    ordering = ['-started_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('backup_type', 'status', 'started_at', 'completed_at')
        }),
        ('Details', {
            'fields': ('file_size_display', 'duration_display', 'checksum', 'created_by')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata_display',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['create_manual_backup', 'verify_selected_backups', 'cleanup_old_backups']
    
    def get_urls(self):
        """Add custom admin URLs for backup management"""
        urls = super().get_urls()
        custom_urls = [
            path('backup-dashboard/', self.admin_site.admin_view(self.backup_dashboard_view), name='backup_dashboard'),
            path('create-backup/', self.admin_site.admin_view(self.create_backup_view), name='create_backup'),
            path('system-health/', self.admin_site.admin_view(self.system_health_view), name='system_health'),
        ]
        return custom_urls + urls

    def backup_type_display(self, obj):
        """Display backup type with icon"""
        icons = {
            'database': '🗄️',
            'media': '📁',
            'full': '💾',
            'verification': '✅',
            'setup': '⚙️',
            'heroku': '🌐',
        }
        icon = icons.get(obj.backup_type, '📄')
        return f"{icon} {obj.get_backup_type_display()}"
    backup_type_display.short_description = 'Type'

    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'success': '#28a745',
            'failed': '#dc3545',
            'in_progress': '#ffc107',
            'warning': '#fd7e14',
        }
        color = colors.get(obj.status, '#6c757d')
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def duration_display(self, obj):
        """Display backup duration"""
        duration = obj.duration_seconds
        if duration is None:
            return '-'
        
        if duration < 60:
            return f"{int(duration)}s"
        elif duration < 3600:
            return f"{int(duration // 60)}m {int(duration % 60)}s"
        else:
            hours = int(duration // 3600)
            minutes = int((duration % 3600) // 60)
            return f"{hours}h {minutes}m"
    duration_display.short_description = 'Duration'

    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if not obj.file_size:
            return '-'
        
        size_mb = obj.file_size_mb
        if size_mb < 1:
            return f"{obj.file_size} bytes"
        elif size_mb < 1024:
            return f"{size_mb} MB"
        else:
            size_gb = size_mb / 1024
            return f"{size_gb:.2f} GB"
    file_size_display.short_description = 'Size'

    def is_recent_display(self, obj):
        """Display if backup is recent"""
        if obj.is_recent:
            return format_html('<span style="color: green;">✓ Recent</span>')
        else:
            return format_html('<span style="color: orange;">⚠ Old</span>')
    is_recent_display.short_description = 'Recency'

    def metadata_display(self, obj):
        """Display metadata in formatted JSON"""
        if not obj.metadata:
            return 'No metadata'
        
        try:
            formatted_json = json.dumps(obj.metadata, indent=2)
            return format_html('<pre>{}</pre>', formatted_json)
        except:
            return str(obj.metadata)
    metadata_display.short_description = 'Metadata'

    def create_manual_backup(self, request, queryset):
        """Action to create a manual backup through web interface"""
        try:
            backup_record = backup_service.create_backup(
                backup_type='full',
                verify=True,
                created_by=request.user
            )
            
            messages.success(
                request, 
                f"Manual backup created successfully! Backup ID: {backup_record.id}, "
                f"Status: {backup_record.get_status_display()}, "
                f"Size: {backup_record.file_size_mb} MB"
            )
        except Exception as e:
            messages.error(request, f"Failed to create backup: {str(e)}")
    create_manual_backup.short_description = "🔧 Create manual backup"

    def verify_selected_backups(self, request, queryset):
        """Action to verify selected backups through web interface"""
        verified_count = 0
        failed_count = 0
        
        for backup in queryset:
            try:
                verification_result = backup_service.verify_backup(backup.id)
                if verification_result['overall_status'] == 'success':
                    verified_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                failed_count += 1
        
        if failed_count == 0:
            messages.success(
                request, 
                f"✅ Successfully verified {verified_count} backup(s). All backups are intact."
            )
        else:
            messages.warning(
                request, 
                f"⚠️ Verified {verified_count} backup(s), {failed_count} failed verification. Check backup details."
            )
    verify_selected_backups.short_description = "✅ Verify selected backups"
    
    def cleanup_old_backups(self, request, queryset):
        """Action to cleanup old backup files"""
        try:
            cleanup_result = backup_service.cleanup_old_backups(retention_days=7)
            messages.success(
                request,
                f"🧹 Cleanup completed: Removed {cleanup_result['cleaned_files']} files "
                f"({cleanup_result['cleaned_size_mb']} MB) older than 7 days."
            )
        except Exception as e:
            messages.error(request, f"Failed to cleanup old backups: {str(e)}")
    cleanup_old_backups.short_description = "🧹 Cleanup old backups"
    
    def backup_dashboard_view(self, request):
        """Custom backup dashboard view"""
        try:
            # Get backup health summary
            health_summary = monitoring_service.check_system_health()
            
            # Get recent backups
            recent_backups = BackupStatus.objects.order_by('-started_at')[:10]
            
            # Get backup statistics
            total_backups = BackupStatus.objects.count()
            successful_backups = BackupStatus.objects.filter(status='success').count()
            failed_backups = BackupStatus.objects.filter(status='failed').count()
            
            context = {
                'title': 'Backup System Dashboard',
                'health_summary': health_summary,
                'recent_backups': recent_backups,
                'stats': {
                    'total_backups': total_backups,
                    'successful_backups': successful_backups,
                    'failed_backups': failed_backups,
                    'success_rate': round((successful_backups / max(total_backups, 1)) * 100, 1)
                }
            }
            
            return render(request, 'admin/backup_dashboard.html', context)
            
        except Exception as e:
            messages.error(request, f"Failed to load backup dashboard: {str(e)}")
            return HttpResponseRedirect('../')
    
    def create_backup_view(self, request):
        """Custom view to create backups with options"""
        if request.method == 'POST':
            backup_type = request.POST.get('backup_type', 'full')
            verify = request.POST.get('verify') == 'on'
            
            try:
                backup_record = backup_service.create_backup(
                    backup_type=backup_type,
                    verify=verify,
                    created_by=request.user
                )
                
                messages.success(
                    request,
                    f"✅ Backup created successfully! "
                    f"Type: {backup_type}, ID: {backup_record.id}, "
                    f"Status: {backup_record.get_status_display()}"
                )
                return HttpResponseRedirect('../')
                
            except Exception as e:
                messages.error(request, f"❌ Backup failed: {str(e)}")
        
        context = {
            'title': 'Create Manual Backup',
            'backup_types': [
                ('database', 'Database Only'),
                ('media', 'Media Files Only'),
                ('full', 'Complete System Backup')
            ]
        }
        
        return render(request, 'admin/create_backup.html', context)
    
    def system_health_view(self, request):
        """System health monitoring view"""
        try:
            health_status = monitoring_service.check_system_health()
            
            context = {
                'title': 'Backup System Health',
                'health_status': health_status,
                'refresh_url': request.path,
            }
            
            return render(request, 'admin/system_health.html', context)
            
        except Exception as e:
            messages.error(request, f"Failed to check system health: {str(e)}")
            return HttpResponseRedirect('../')


@admin.register(BackupSchedule)
class BackupScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'backup_type_display',
        'schedule_type_display', 
        'schedule_time', 
        'is_active_display',
        'retention_days',
        'next_run_display'
    ]
    list_filter = ['backup_type', 'schedule_type', 'is_active']
    search_fields = ['backup_type']
    
    fieldsets = (
        ('Schedule Configuration', {
            'fields': ('backup_type', 'schedule_type', 'schedule_time', 'is_active')
        }),
        ('Retention & Options', {
            'fields': ('retention_days', 'configuration')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']

    def backup_type_display(self, obj):
        """Display backup type with icon"""
        icons = {
            'database': '🗄️',
            'media': '📁',
            'full': '💾',
        }
        icon = icons.get(obj.backup_type, '📄')
        return f"{icon} {obj.get_backup_type_display()}"
    backup_type_display.short_description = 'Backup Type'

    def schedule_type_display(self, obj):
        """Display schedule type with icon"""
        icons = {
            'daily': '📅',
            'weekly': '🗓️',
            'monthly': '📆',
            'manual': '🖱️',
        }
        icon = icons.get(obj.schedule_type, '⏰')
        return f"{icon} {obj.get_schedule_type_display()}"
    schedule_type_display.short_description = 'Schedule'

    def is_active_display(self, obj):
        """Display active status with color"""
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Active</span>')
        else:
            return format_html('<span style="color: red;">✗ Inactive</span>')
    is_active_display.short_description = 'Status'

    def next_run_display(self, obj):
        """Display next run time"""
        next_run = obj.next_run_time
        if not next_run:
            return 'Manual only'
        
        now = timezone.now()
        time_until = next_run - now
        
        if time_until.total_seconds() < 3600:  # Less than 1 hour
            minutes = int(time_until.total_seconds() / 60)
            return format_html(
                '<span style="color: orange;">⏰ In {} minutes</span>',
                minutes
            )
        elif time_until.days == 0:  # Today
            return format_html(
                '<span style="color: blue;">📅 Today at {}</span>',
                next_run.strftime('%H:%M')
            )
        else:
            return next_run.strftime('%Y-%m-%d %H:%M UTC')
    next_run_display.short_description = 'Next Run'


@admin.register(SystemHealthMetric)
class SystemHealthMetricAdmin(admin.ModelAdmin):
    list_display = [
        'metric_type_display',
        'value_display', 
        'recorded_at',
        'trend_display'
    ]
    list_filter = [
        'metric_type', 
        ('recorded_at', admin.DateFieldListFilter),
    ]
    search_fields = ['metric_type']
    readonly_fields = ['recorded_at', 'details_display']
    ordering = ['-recorded_at']
    
    fieldsets = (
        ('Metric Information', {
            'fields': ('metric_type', 'value', 'unit', 'recorded_at')
        }),
        ('Details', {
            'fields': ('details_display',),
            'classes': ('collapse',)
        }),
    )

    def metric_type_display(self, obj):
        """Display metric type with icon"""
        icons = {
            'backup_health': '💊',
            'storage_usage': '💾',
            'database_size': '🗄️',
            'media_size': '📁',
            'system_uptime': '⏱️',
        }
        icon = icons.get(obj.metric_type, '📊')
        return f"{icon} {obj.get_metric_type_display()}"
    metric_type_display.short_description = 'Metric'

    def value_display(self, obj):
        """Display value with unit and color coding"""
        if obj.metric_type == 'backup_health':
            if obj.value >= 80:
                color = 'green'
            elif obj.value >= 60:
                color = 'orange'
            else:
                color = 'red'
            
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} {}</span>',
                color,
                obj.value,
                obj.unit
            )
        else:
            return f"{obj.value} {obj.unit}"
    value_display.short_description = 'Value'

    def trend_display(self, obj):
        """Display trend compared to previous value"""
        previous = SystemHealthMetric.objects.filter(
            metric_type=obj.metric_type,
            recorded_at__lt=obj.recorded_at
        ).first()
        
        if not previous:
            return '-'
        
        change = obj.value - previous.value
        if change > 0:
            return format_html('<span style="color: green;">↗ +{}</span>', change)
        elif change < 0:
            return format_html('<span style="color: red;">↘ {}</span>', change)
        else:
            return format_html('<span style="color: gray;">→ No change</span>')
    trend_display.short_description = 'Trend'

    def details_display(self, obj):
        """Display details in formatted JSON"""
        if not obj.details:
            return 'No details'
        
        try:
            formatted_json = json.dumps(obj.details, indent=2)
            return format_html('<pre>{}</pre>', formatted_json)
        except:
            return str(obj.details)
    details_display.short_description = 'Details'


# Custom admin site views for backup management
class BackupManagementSite:
    """Custom admin views for backup management"""
    
    def backup_dashboard_view(self, request):
        """Dashboard view for backup system overview"""
        from django.shortcuts import render
        
        context = {
            'title': 'Backup System Dashboard',
            'backup_health': BackupStatus.get_backup_health_summary(),
            'recent_backups': BackupStatus.objects.filter(
                started_at__gte=timezone.now() - timezone.timedelta(days=7)
            )[:10],
            'active_schedules': BackupSchedule.objects.filter(is_active=True),
        }
        
        return render(request, 'admin/backup_dashboard.html', context)


# Register the backup management functionality
def register_backup_admin():
    """Register backup admin functionality"""
    # This function can be called to register additional admin views
    pass