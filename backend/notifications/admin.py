from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    Notification, 
    NotificationTemplate, 
    NotificationLog, 
    NotificationPreference, 
    NotificationCampaign
)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'created_at', 'created_by']
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject_template', 'body_template']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template_type', 'is_active')
        }),
        ('Template Content', {
            'fields': ('subject_template', 'body_template', 'available_variables'),
            'description': 'Use template variables like {{patient_name}}, {{appointment_date}}, etc.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class NotificationLogInline(admin.TabularInline):
    model = NotificationLog
    extra = 0
    readonly_fields = ['action', 'details', 'timestamp', 'error_message']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 
        'recipient_email', 
        'notification_type', 
        'priority_badge',
        'status_badge', 
        'delivery_method',
        'scheduled_at',
        'created_at'
    ]
    list_filter = [
        'notification_type', 
        'priority', 
        'status', 
        'delivery_method',
        'created_at',
        'scheduled_at'
    ]
    search_fields = ['title', 'message', 'recipient__email', 'recipient__first_name', 'recipient__last_name']
    readonly_fields = [
        'notification_id', 
        'created_at', 
        'updated_at', 
        'sent_at', 
        'delivered_at', 
        'read_at',
        'retry_count',
        'last_retry_at'
    ]
    raw_id_fields = ['recipient', 'patient', 'template', 'created_by']
    inlines = [NotificationLogInline]
    
    fieldsets = (
        ('Recipients', {
            'fields': ('recipient', 'patient')
        }),
        ('Content', {
            'fields': ('notification_type', 'title', 'message', 'priority', 'template')
        }),
        ('Delivery Settings', {
            'fields': ('delivery_method', 'scheduled_at', 'expires_at')
        }),
        ('Action', {
            'fields': ('action_url', 'action_text'),
            'classes': ('collapse',)
        }),
        ('Status & Tracking', {
            'fields': (
                'status', 'sent_at', 'delivered_at', 'read_at',
                'retry_count', 'max_retries', 'last_retry_at'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('notification_id', 'metadata', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def recipient_email(self, obj):
        return obj.recipient.email
    recipient_email.short_description = 'Recipient'
    
    def priority_badge(self, obj):
        colors = {
            'LOW': 'green',
            'MEDIUM': 'blue', 
            'HIGH': 'orange',
            'URGENT': 'red'
        }
        color = colors.get(obj.priority, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'SENT': 'blue',
            'DELIVERED': 'green',
            'READ': 'darkgreen',
            'FAILED': 'red',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['mark_as_read', 'mark_as_cancelled', 'retry_failed_notifications']
    
    def mark_as_read(self, request, queryset):
        updated = 0
        for notification in queryset:
            if notification.status != 'READ':
                notification.mark_as_read()
                updated += 1
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.filter(status__in=['PENDING', 'SCHEDULED']).update(
            status='CANCELLED'
        )
        self.message_user(request, f'{updated} notifications cancelled.')
    mark_as_cancelled.short_description = "Cancel selected notifications"
    
    def retry_failed_notifications(self, request, queryset):
        updated = 0
        for notification in queryset.filter(status='FAILED'):
            if notification.retry_count < notification.max_retries:
                notification.status = 'PENDING'
                notification.retry_count += 1
                notification.last_retry_at = timezone.now()
                notification.save()
                updated += 1
        self.message_user(request, f'{updated} notifications queued for retry.')
    retry_failed_notifications.short_description = "Retry failed notifications"


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['notification_title', 'action', 'timestamp', 'error_code']
    list_filter = ['action', 'timestamp', 'error_code']
    search_fields = ['notification__title', 'details', 'error_message']
    readonly_fields = ['notification', 'action', 'details', 'timestamp', 'error_message', 'error_code']
    
    def notification_title(self, obj):
        return obj.notification.title
    notification_title.short_description = 'Notification'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user_email', 
        'email_enabled', 
        'in_app_enabled',
        'digest_frequency',
        'quiet_hours_enabled'
    ]
    list_filter = [
        'email_enabled', 
        'in_app_enabled',
        'digest_frequency',
        'quiet_hours_enabled',
        'sound_enabled'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Preferences', {
            'fields': (
                'email_enabled',
                'appointment_reminders',
                'medication_reminders', 
                'health_campaigns',
                'clinic_updates',
                'follow_up_reminders',
                'vaccination_reminders',
                'dental_reminders'
            )
        }),
        ('In-App Preferences', {
            'fields': ('in_app_enabled', 'desktop_notifications', 'sound_enabled')
        }),
        ('Delivery Settings', {
            'fields': ('digest_frequency', 'language_preference', 'timezone')
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_enabled', 'quiet_start_time', 'quiet_end_time'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'


@admin.register(NotificationCampaign)
class NotificationCampaignAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'campaign_type', 
        'status_badge',
        'audience_type',
        'total_recipients',
        'success_rate_display',
        'engagement_rate_display',
        'scheduled_start'
    ]
    list_filter = [
        'campaign_type',
        'status', 
        'audience_type',
        'scheduled_start',
        'created_at'
    ]
    search_fields = ['name', 'description', 'custom_subject']
    readonly_fields = [
        'total_recipients',
        'sent_count',
        'delivered_count', 
        'read_count',
        'failed_count',
        'created_at',
        'updated_at'
    ]
    filter_horizontal = ['target_users']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'campaign_type', 'status')
        }),
        ('Audience', {
            'fields': ('audience_type', 'target_roles', 'target_users')
        }),
        ('Content', {
            'fields': ('template', 'custom_subject', 'custom_message')
        }),
        ('Scheduling', {
            'fields': ('scheduled_start', 'scheduled_end')
        }),
        ('Statistics', {
            'fields': (
                'total_recipients', 'sent_count', 'delivered_count',
                'read_count', 'failed_count'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        colors = {
            'DRAFT': 'gray',
            'SCHEDULED': 'blue',
            'ACTIVE': 'green',
            'PAUSED': 'orange',
            'COMPLETED': 'darkgreen',
            'CANCELLED': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def success_rate_display(self, obj):
        rate = obj.success_rate
        color = 'green' if rate >= 90 else 'orange' if rate >= 70 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color,
            rate
        )
    success_rate_display.short_description = 'Success Rate'
    
    def engagement_rate_display(self, obj):
        rate = obj.engagement_rate
        color = 'green' if rate >= 20 else 'orange' if rate >= 10 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color,
            rate
        )
    engagement_rate_display.short_description = 'Engagement Rate'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['activate_campaigns', 'pause_campaigns', 'cancel_campaigns']
    
    def activate_campaigns(self, request, queryset):
        updated = queryset.filter(status__in=['DRAFT', 'PAUSED']).update(status='ACTIVE')
        self.message_user(request, f'{updated} campaigns activated.')
    activate_campaigns.short_description = "Activate selected campaigns"
    
    def pause_campaigns(self, request, queryset):
        updated = queryset.filter(status='ACTIVE').update(status='PAUSED')
        self.message_user(request, f'{updated} campaigns paused.')
    pause_campaigns.short_description = "Pause selected campaigns"
    
    def cancel_campaigns(self, request, queryset):
        updated = queryset.filter(status__in=['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED']).update(status='CANCELLED')
        self.message_user(request, f'{updated} campaigns cancelled.')
    cancel_campaigns.short_description = "Cancel selected campaigns"