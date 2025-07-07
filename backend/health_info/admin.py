from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import HealthInformation, HealthCampaign, CampaignResource, CampaignFeedback

@admin.register(HealthInformation)
class HealthInformationAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']

class CampaignResourceInline(admin.TabularInline):
    model = CampaignResource
    extra = 0
    readonly_fields = ['file_size', 'download_count', 'created_at']
    fields = ['title', 'resource_type', 'file', 'file_size', 'download_count', 'is_public']

class CampaignFeedbackInline(admin.TabularInline):
    model = CampaignFeedback
    extra = 0
    readonly_fields = ['user', 'rating', 'created_at']
    fields = ['user', 'rating', 'usefulness', 'clarity', 'will_recommend', 'created_at']

@admin.register(HealthCampaign)
class HealthCampaignAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'campaign_type', 'status_badge', 'priority_badge', 
        'start_date', 'end_date', 'view_count', 'engagement_count',
        'is_featured_display', 'created_by'
    ]
    list_filter = [
        'campaign_type', 'status', 'priority', 'start_date', 'end_date', 'created_at'
    ]
    search_fields = ['title', 'description', 'content', 'tags']
    readonly_fields = [
        'created_at', 'updated_at', 'view_count', 'engagement_count',
        'banner_image_preview', 'thumbnail_image_preview', 'pubmat_image_preview',
        'is_active', 'is_featured'
    ]
    inlines = [CampaignResourceInline, CampaignFeedbackInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'summary', 'campaign_type', 'status', 'priority')
        }),
        ('Content', {
            'fields': ('content', 'objectives', 'call_to_action', 'target_audience')
        }),
        ('Visual Content', {
            'fields': (
                ('banner_image', 'banner_image_preview'),
                ('thumbnail_image', 'thumbnail_image_preview'),
                ('pubmat_image', 'pubmat_image_preview')
            ),
            'classes': ('wide',)
        }),
        ('Scheduling', {
            'fields': ('start_date', 'end_date', 'featured_until')
        }),
        ('Meta Information', {
            'fields': ('tags', 'external_link', 'contact_info')
        }),
        ('Analytics', {
            'fields': ('view_count', 'engagement_count', 'is_active', 'is_featured'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'created_by', 'last_modified_by'),
            'classes': ('collapse',)
        })
    )
    
    def status_badge(self, obj):
        colors = {
            'DRAFT': '#6c757d',
            'SCHEDULED': '#007bff',
            'ACTIVE': '#28a745',
            'PAUSED': '#ffc107',
            'COMPLETED': '#17a2b8',
            'ARCHIVED': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        colors = {
            'LOW': '#28a745',
            'MEDIUM': '#ffc107',
            'HIGH': '#fd7e14',
            'URGENT': '#dc3545'
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">{}</span>',
            color,
            obj.priority
        )
    priority_badge.short_description = 'Priority'
    
    def is_featured_display(self, obj):
        if obj.is_featured:
            return format_html('<span style="color: #28a745; font-weight: bold;">★ Featured</span>')
        return '-'
    is_featured_display.short_description = 'Featured'
    
    def banner_image_preview(self, obj):
        if obj.banner_image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
                obj.banner_image.url
            )
        return "No banner image"
    banner_image_preview.short_description = 'Banner Preview'
    
    def thumbnail_image_preview(self, obj):
        if obj.thumbnail_image:
            return format_html(
                '<img src="{}" style="max-height: 60px; max-width: 60px;" />',
                obj.thumbnail_image.url
            )
        return "No thumbnail"
    thumbnail_image_preview.short_description = 'Thumbnail Preview'
    
    def pubmat_image_preview(self, obj):
        if obj.pubmat_image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px;" />',
                obj.pubmat_image.url
            )
        return "No PubMat"
    pubmat_image_preview.short_description = 'PubMat Preview'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new campaign
            obj.created_by = request.user
        obj.last_modified_by = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['activate_campaigns', 'pause_campaigns', 'complete_campaigns', 'feature_campaigns']
    
    def activate_campaigns(self, request, queryset):
        updated = queryset.update(status='ACTIVE')
        self.message_user(request, f'{updated} campaigns activated.')
    activate_campaigns.short_description = "Activate selected campaigns"
    
    def pause_campaigns(self, request, queryset):
        updated = queryset.update(status='PAUSED')
        self.message_user(request, f'{updated} campaigns paused.')
    pause_campaigns.short_description = "Pause selected campaigns"
    
    def complete_campaigns(self, request, queryset):
        updated = queryset.update(status='COMPLETED')
        self.message_user(request, f'{updated} campaigns marked as completed.')
    complete_campaigns.short_description = "Mark selected campaigns as completed"
    
    def feature_campaigns(self, request, queryset):
        # Feature for 30 days from now
        feature_until = timezone.now() + timezone.timedelta(days=30)
        updated = queryset.update(featured_until=feature_until)
        self.message_user(request, f'{updated} campaigns featured until {feature_until.strftime("%Y-%m-%d")}.')
    feature_campaigns.short_description = "Feature selected campaigns for 30 days"

@admin.register(CampaignResource)
class CampaignResourceAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'campaign', 'resource_type', 'file_size_display', 
        'download_count', 'is_public', 'uploaded_by', 'created_at'
    ]
    list_filter = ['resource_type', 'is_public', 'created_at', 'campaign__campaign_type']
    search_fields = ['title', 'description', 'campaign__title']
    readonly_fields = ['file_size', 'download_count', 'created_at']
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    file_size_display.short_description = 'File Size'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new resource
            obj.uploaded_by = request.user
            # Calculate file size if not set
            if obj.file and not obj.file_size:
                obj.file_size = obj.file.size
        super().save_model(request, obj, form, change)

@admin.register(CampaignFeedback)
class CampaignFeedbackAdmin(admin.ModelAdmin):
    list_display = [
        'campaign', 'user', 'rating_display', 'usefulness', 'clarity',
        'will_recommend', 'took_action', 'learned_something_new', 'created_at'
    ]
    list_filter = [
        'rating', 'usefulness', 'clarity', 'will_recommend', 
        'took_action', 'learned_something_new', 'created_at',
        'campaign__campaign_type'
    ]
    search_fields = ['campaign__title', 'user__email', 'comments', 'suggestions']
    readonly_fields = ['created_at']
    
    def rating_display(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html(
            '<span style="color: #ffc107; font-size: 14px;">{}</span> ({})',
            stars, obj.rating
        )
    rating_display.short_description = 'Rating'
    
    fieldsets = (
        ('Campaign & User', {
            'fields': ('campaign', 'user')
        }),
        ('Ratings', {
            'fields': ('rating', 'usefulness', 'clarity')
        }),
        ('Engagement', {
            'fields': ('will_recommend', 'took_action', 'learned_something_new')
        }),
        ('Comments', {
            'fields': ('comments', 'suggestions')
        }),
        ('Meta', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    ) 