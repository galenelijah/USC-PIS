from rest_framework import serializers
from django.utils import timezone
from authentication.models import User
from patients.models import Patient
from .models import (
    Notification,
    NotificationTemplate,
    NotificationLog,
    NotificationPreference,
    NotificationCampaign
)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'template_type', 'template_type_display',
            'subject_template', 'body_template', 'available_variables',
            'is_active', 'created_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'created_by']
    
    def validate_subject_template(self, value):
        """Validate subject template length"""
        if len(value) > 255:
            raise serializers.ValidationError("Subject template must be 255 characters or less.")
        return value
    
    def validate_available_variables(self, value):
        """Validate available variables format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Available variables must be a JSON object.")
        return value


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'action', 'action_display', 'details', 'metadata',
            'email_message_id', 'email_provider_response',
            'error_message', 'error_code', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    recipient_email = serializers.CharField(source='recipient.email', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True, allow_null=True)
    template_name = serializers.CharField(source='template.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    # Display fields
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    
    # Status properties
    is_expired = serializers.BooleanField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    
    # Related logs
    logs = NotificationLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_id', 'recipient', 'recipient_email', 'recipient_name',
            'patient', 'patient_name', 'notification_type', 'notification_type_display',
            'title', 'message', 'priority', 'priority_display',
            'delivery_method', 'delivery_method_display',
            'scheduled_at', 'expires_at', 'status', 'status_display',
            'sent_at', 'delivered_at', 'read_at',
            'metadata', 'action_url', 'action_text',
            'template', 'template_name',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'retry_count', 'max_retries', 'last_retry_at',
            'is_expired', 'is_read', 'logs'
        ]
        read_only_fields = [
            'notification_id', 'sent_at', 'delivered_at', 'read_at',
            'created_at', 'updated_at', 'retry_count', 'last_retry_at'
        ]
    
    def validate_expires_at(self, value):
        """Validate expiration date"""
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value
    
    def validate_scheduled_at(self, value):
        """Validate scheduled date"""
        if value and value <= timezone.now():
            raise serializers.ValidationError("Scheduled date must be in the future.")
        return value
    
    def validate_recipient(self, value):
        """Validate recipient exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError("Cannot send notification to inactive user.")
        return value


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'recipient', 'patient', 'notification_type', 'title', 'message',
            'priority', 'delivery_method', 'scheduled_at', 'expires_at',
            'action_url', 'action_text', 'metadata'
        ]
    
    def validate(self, data):
        """Cross-field validation"""
        scheduled_at = data.get('scheduled_at')
        expires_at = data.get('expires_at')
        
        if scheduled_at and expires_at and scheduled_at >= expires_at:
            raise serializers.ValidationError(
                "Scheduled time must be before expiration time."
            )
        
        return data


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    digest_frequency_display = serializers.CharField(source='get_digest_frequency_display', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'email_enabled', 'appointment_reminders', 'medication_reminders',
            'health_campaigns', 'clinic_updates', 'follow_up_reminders',
            'vaccination_reminders', 'dental_reminders',
            'in_app_enabled', 'desktop_notifications', 'sound_enabled',
            'digest_frequency', 'digest_frequency_display',
            'quiet_hours_enabled', 'quiet_start_time', 'quiet_end_time',
            'language_preference', 'timezone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_quiet_hours(self, data):
        """Validate quiet hours configuration"""
        quiet_enabled = data.get('quiet_hours_enabled', False)
        quiet_start = data.get('quiet_start_time')
        quiet_end = data.get('quiet_end_time')
        
        if quiet_enabled and (not quiet_start or not quiet_end):
            raise serializers.ValidationError(
                "Both start and end times are required when quiet hours are enabled."
            )
        
        return data


class NotificationCampaignSerializer(serializers.ModelSerializer):
    """Serializer for notification campaigns"""
    template_name = serializers.CharField(source='template.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    # Display fields
    campaign_type_display = serializers.CharField(source='get_campaign_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    audience_type_display = serializers.CharField(source='get_audience_type_display', read_only=True)
    
    # Calculated fields
    success_rate = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    engagement_rate = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    # Target users details
    target_users_details = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationCampaign
        fields = [
            'id', 'name', 'description', 'campaign_type', 'campaign_type_display',
            'audience_type', 'audience_type_display', 'target_roles',
            'target_users', 'target_users_details',
            'template', 'template_name', 'custom_subject', 'custom_message',
            'scheduled_start', 'scheduled_end', 'status', 'status_display',
            'total_recipients', 'sent_count', 'delivered_count',
            'read_count', 'failed_count', 'success_rate', 'engagement_rate',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'total_recipients', 'sent_count', 'delivered_count',
            'read_count', 'failed_count', 'created_at', 'updated_at'
        ]
    
    def get_target_users_details(self, obj):
        """Get details of target users"""
        if obj.audience_type == 'CUSTOM_LIST':
            return [
                {
                    'id': user.id,
                    'email': user.email,
                    'name': user.get_full_name(),
                    'role': user.role
                }
                for user in obj.target_users.all()[:10]  # Limit to 10 for performance
            ]
        return []
    
    def validate_scheduled_start(self, value):
        """Validate scheduled start date"""
        if value <= timezone.now():
            raise serializers.ValidationError("Scheduled start must be in the future.")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        scheduled_start = data.get('scheduled_start')
        scheduled_end = data.get('scheduled_end')
        
        if scheduled_start and scheduled_end and scheduled_start >= scheduled_end:
            raise serializers.ValidationError(
                "Scheduled start must be before scheduled end."
            )
        
        audience_type = data.get('audience_type')
        target_roles = data.get('target_roles', [])
        
        if audience_type == 'ROLE_BASED' and not target_roles:
            raise serializers.ValidationError(
                "Target roles are required for role-based campaigns."
            )
        
        return data


class NotificationCampaignCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating campaigns"""
    
    class Meta:
        model = NotificationCampaign
        fields = [
            'name', 'description', 'campaign_type', 'audience_type',
            'target_roles', 'target_users', 'template',
            'custom_subject', 'custom_message',
            'scheduled_start', 'scheduled_end'
        ]
    
    def validate(self, data):
        """Validation for campaign creation"""
        audience_type = data.get('audience_type')
        target_roles = data.get('target_roles', [])
        target_users = data.get('target_users', [])
        
        if audience_type == 'ROLE_BASED' and not target_roles:
            raise serializers.ValidationError(
                "Target roles are required for role-based campaigns."
            )
        
        if audience_type == 'CUSTOM_LIST' and not target_users:
            raise serializers.ValidationError(
                "Target users are required for custom list campaigns."
            )
        
        return data


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    total_notifications = serializers.IntegerField()
    pending_notifications = serializers.IntegerField()
    sent_notifications = serializers.IntegerField()
    delivered_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    failed_notifications = serializers.IntegerField()
    
    # By type statistics
    by_type = serializers.DictField()
    
    # By priority statistics
    by_priority = serializers.DictField()
    
    # Recent activity
    recent_notifications = NotificationSerializer(many=True)
    
    # Success rates
    delivery_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    read_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer for bulk notification operations"""
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=1000,
        help_text="List of recipient user IDs (max 1000)"
    )
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPES)
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_LEVELS, default='MEDIUM')
    delivery_method = serializers.ChoiceField(choices=Notification.DELIVERY_METHODS, default='BOTH')
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    action_url = serializers.URLField(required=False, allow_blank=True)
    action_text = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_recipient_ids(self, value):
        """Validate that all recipient IDs exist and are active"""
        existing_count = User.objects.filter(id__in=value, is_active=True).count()
        if existing_count != len(value):
            raise serializers.ValidationError(
                f"Some recipient IDs are invalid or inactive. "
                f"Found {existing_count} valid recipients out of {len(value)} provided."
            )
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        scheduled_at = data.get('scheduled_at')
        expires_at = data.get('expires_at')
        
        if scheduled_at and expires_at and scheduled_at >= expires_at:
            raise serializers.ValidationError(
                "Scheduled time must be before expiration time."
            )
        
        return data