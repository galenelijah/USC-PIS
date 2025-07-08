from django.db import models
from django.conf import settings
from django.utils import timezone
from patients.models import Patient
import uuid


class NotificationTemplate(models.Model):
    """Template for reusable notifications"""
    TEMPLATE_TYPES = [
        ('APPOINTMENT_REMINDER', 'Appointment Reminder'),
        ('MEDICATION_REMINDER', 'Medication Reminder'),
        ('HEALTH_CAMPAIGN', 'Health Campaign'),
        ('CLINIC_UPDATE', 'Clinic Update'),
        ('FOLLOW_UP', 'Follow-up Reminder'),
        ('VACCINATION_REMINDER', 'Vaccination Reminder'),
        ('DENTAL_REMINDER', 'Dental Checkup Reminder'),
        ('CUSTOM', 'Custom Notification'),
    ]
    
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES)
    subject_template = models.CharField(max_length=255)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    # Template variables documentation
    available_variables = models.JSONField(
        default=dict,
        help_text="JSON object documenting available template variables"
    )
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class Notification(models.Model):
    """Main notification model"""
    NOTIFICATION_TYPES = [
        ('APPOINTMENT_REMINDER', 'Appointment Reminder'),
        ('MEDICATION_REMINDER', 'Medication Reminder'),
        ('HEALTH_CAMPAIGN', 'Health Campaign'),
        ('CLINIC_UPDATE', 'Clinic Update'),
        ('FOLLOW_UP', 'Follow-up Reminder'),
        ('VACCINATION_REMINDER', 'Vaccination Reminder'),
        ('DENTAL_REMINDER', 'Dental Checkup Reminder'),
        ('CUSTOM', 'Custom Notification'),
        ('SYSTEM_ALERT', 'System Alert'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    DELIVERY_METHODS = [
        ('EMAIL', 'Email'),
        ('IN_APP', 'In-App'),
        ('BOTH', 'Both Email and In-App'),
    ]
    
    # Unique identifier
    notification_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Recipients
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_notifications')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    # Content
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='MEDIUM')
    
    # Delivery settings
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHODS, default='BOTH')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    action_url = models.URLField(blank=True, help_text="URL for notification action")
    action_text = models.CharField(max_length=100, blank=True, help_text="Text for action button")
    
    # Related objects
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_notifications')
    
    # Retry mechanism
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    last_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['notification_type', 'scheduled_at']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'scheduled_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.email}"
    
    @property
    def is_expired(self):
        """Check if notification has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def is_read(self):
        """Check if notification has been read"""
        return self.status == 'READ'
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.status = 'READ'
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_sent(self):
        """Mark notification as sent"""
        self.status = 'SENT'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_delivered(self):
        """Mark notification as delivered"""
        self.status = 'DELIVERED'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at'])
    
    def mark_as_failed(self):
        """Mark notification as failed"""
        self.status = 'FAILED'
        self.save(update_fields=['status'])


class NotificationLog(models.Model):
    """Log of all notification activities for auditing"""
    LOG_ACTIONS = [
        ('CREATED', 'Created'),
        ('SCHEDULED', 'Scheduled'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('RETRY', 'Retry Attempt'),
    ]
    
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=15, choices=LOG_ACTIONS)
    details = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Email specific tracking
    email_message_id = models.CharField(max_length=255, blank=True)
    email_provider_response = models.JSONField(default=dict, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    error_code = models.CharField(max_length=50, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['notification', 'action']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.notification.title} - {self.get_action_display()} at {self.timestamp}"


class NotificationPreference(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_enabled = models.BooleanField(default=True)
    appointment_reminders = models.BooleanField(default=True)
    medication_reminders = models.BooleanField(default=True)
    health_campaigns = models.BooleanField(default=True)
    clinic_updates = models.BooleanField(default=True)
    follow_up_reminders = models.BooleanField(default=True)
    vaccination_reminders = models.BooleanField(default=True)
    dental_reminders = models.BooleanField(default=True)
    
    # In-app preferences
    in_app_enabled = models.BooleanField(default=True)
    desktop_notifications = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=False)
    
    # Frequency settings
    digest_frequency = models.CharField(
        max_length=10,
        choices=[
            ('IMMEDIATE', 'Immediate'),
            ('DAILY', 'Daily Digest'),
            ('WEEKLY', 'Weekly Digest'),
            ('NEVER', 'Never'),
        ],
        default='IMMEDIATE'
    )
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_start_time = models.TimeField(null=True, blank=True, help_text="Start of quiet hours (e.g., 22:00)")
    quiet_end_time = models.TimeField(null=True, blank=True, help_text="End of quiet hours (e.g., 08:00)")
    
    # Additional settings
    language_preference = models.CharField(max_length=10, default='en', help_text="Language for notifications")
    timezone = models.CharField(max_length=50, default='UTC')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"
    
    def __str__(self):
        return f"Notification preferences for {self.user.email}"
    
    def is_notification_type_enabled(self, notification_type):
        """Check if a specific notification type is enabled for the user"""
        type_mapping = {
            'APPOINTMENT_REMINDER': self.appointment_reminders,
            'MEDICATION_REMINDER': self.medication_reminders,
            'HEALTH_CAMPAIGN': self.health_campaigns,
            'CLINIC_UPDATE': self.clinic_updates,
            'FOLLOW_UP': self.follow_up_reminders,
            'VACCINATION_REMINDER': self.vaccination_reminders,
            'DENTAL_REMINDER': self.dental_reminders,
        }
        return type_mapping.get(notification_type, True)
    
    def is_in_quiet_hours(self, check_time=None):
        """Check if current time is within user's quiet hours"""
        if not self.quiet_hours_enabled or not self.quiet_start_time or not self.quiet_end_time:
            return False
        
        if check_time is None:
            check_time = timezone.now().time()
        
        if self.quiet_start_time <= self.quiet_end_time:
            # Same day quiet hours (e.g., 22:00 to 23:59)
            return self.quiet_start_time <= check_time <= self.quiet_end_time
        else:
            # Overnight quiet hours (e.g., 22:00 to 08:00)
            return check_time >= self.quiet_start_time or check_time <= self.quiet_end_time


class NotificationCampaign(models.Model):
    """Model for managing notification campaigns"""
    CAMPAIGN_STATUS = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    AUDIENCE_TYPES = [
        ('ALL_USERS', 'All Users'),
        ('ALL_PATIENTS', 'All Patients'),
        ('ROLE_BASED', 'Role Based'),
        ('CUSTOM_LIST', 'Custom List'),
        ('PATIENT_CONDITION', 'Based on Patient Condition'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    campaign_type = models.CharField(max_length=30, choices=NotificationTemplate.TEMPLATE_TYPES)
    
    # Audience
    audience_type = models.CharField(max_length=20, choices=AUDIENCE_TYPES)
    target_roles = models.JSONField(default=list, blank=True, help_text="List of user roles to target")
    target_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='targeted_campaigns')
    
    # Content
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    custom_subject = models.CharField(max_length=255, blank=True)
    custom_message = models.TextField(blank=True)
    
    # Scheduling
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=CAMPAIGN_STATUS, default='DRAFT')
    
    # Statistics
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    read_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_campaigns')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    @property
    def success_rate(self):
        """Calculate campaign success rate"""
        if self.sent_count == 0:
            return 0
        return (self.delivered_count / self.sent_count) * 100
    
    @property
    def engagement_rate(self):
        """Calculate campaign engagement rate"""
        if self.delivered_count == 0:
            return 0
        return (self.read_count / self.delivered_count) * 100