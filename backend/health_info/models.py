from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
import os

def get_media_storage():
    """Get the appropriate storage backend for media files - TEMPORARY for migration compatibility"""
    from django.core.files.storage import default_storage
    return default_storage

def campaign_image_upload_path(instance, filename):
    """Generate upload path for campaign images"""
    import os
    # Clean filename
    name, ext = os.path.splitext(filename)
    safe_name = "".join(c for c in name if c.isalnum() or c in '-_').rstrip()
    # Handle empty filename case
    if not safe_name:
        safe_name = "thumbnail"
    safe_filename = f"{safe_name}{ext}"
    # Use getattr with default to handle cases where campaign_type isn't set yet
    campaign_type = getattr(instance, 'campaign_type', 'GENERAL') or 'GENERAL'
    return f'campaigns/{campaign_type}/thumbnails/{safe_filename}'

def banner_upload_path(instance, filename):
    """Generate upload path for banner images"""
    import os
    # Clean filename
    name, ext = os.path.splitext(filename)
    safe_name = "".join(c for c in name if c.isalnum() or c in '-_').rstrip()
    # Handle empty filename case
    if not safe_name:
        safe_name = "banner"
    safe_filename = f"{safe_name}{ext}"
    # Use getattr with default to handle cases where campaign_type isn't set yet
    campaign_type = getattr(instance, 'campaign_type', 'GENERAL') or 'GENERAL'
    return f'campaigns/{campaign_type}/banners/{safe_filename}'

def pubmat_upload_path(instance, filename):
    """Generate upload path for PubMat images"""
    import os
    # Clean filename
    name, ext = os.path.splitext(filename)
    safe_name = "".join(c for c in name if c.isalnum() or c in '-_').rstrip()
    # Handle empty filename case
    if not safe_name:
        safe_name = "pubmat"
    safe_filename = f"{safe_name}{ext}"
    # Use getattr with default to handle cases where campaign_type isn't set yet
    campaign_type = getattr(instance, 'campaign_type', 'GENERAL') or 'GENERAL'
    return f'campaigns/{campaign_type}/pubmats/{safe_filename}'

def health_info_image_upload_path(instance, filename):
    """Generate upload path for health info images"""
    import uuid
    from django.utils import timezone
    
    # Create a unique identifier for the health info
    if instance.health_info and instance.health_info.id:
        folder_id = str(instance.health_info.id)
    else:
        # Use timestamp + UUID for new instances
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        folder_id = f"{timestamp}_{uuid.uuid4().hex[:8]}"
    
    # Clean filename for cloud storage
    import os
    name, ext = os.path.splitext(filename)
    safe_name = "".join(c for c in name if c.isalnum() or c in '-_').rstrip()
    safe_filename = f"{safe_name}{ext}"
    
    return f'health_info/{folder_id}/{safe_filename}'

class HealthInformation(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.title

class HealthInformationImage(models.Model):
    """Images associated with health information"""
    health_info = models.ForeignKey(HealthInformation, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(
        upload_to=health_info_image_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])]
    )
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order of the image")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'uploaded_at']

    def __str__(self):
        return f"Image for {self.health_info.title}"
    
    @property
    def url(self):
        """Return the full URL for the image"""
        if self.image:
            return self.image.url
        return None

class CampaignTemplate(models.Model):
    """Reusable templates for health campaigns"""
    
    CAMPAIGN_TYPES = [
        ('GENERAL', 'General Health Information'),
        ('VACCINATION', 'Vaccination Campaign'),
        ('MENTAL_HEALTH', 'Mental Health Awareness'),
        ('NUTRITION', 'Nutrition & Wellness'),
        ('DENTAL_HEALTH', 'Dental Health'),
        ('HYGIENE', 'Personal Hygiene'),
        ('EXERCISE', 'Physical Exercise'),
        ('SAFETY', 'Health & Safety'),
        ('PREVENTION', 'Disease Prevention'),
        ('AWARENESS', 'Health Awareness'),
        ('EMERGENCY', 'Emergency Health'),
        ('SEASONAL', 'Seasonal Health'),
        ('CUSTOM', 'Custom Campaign'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    name = models.CharField(max_length=200, help_text="Template name")
    description = models.TextField(help_text="Template description")
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='MEDIUM')
    
    # Template content (will be used as defaults)
    title_template = models.CharField(max_length=200, help_text="Default title for campaigns using this template")
    content_template = models.TextField(help_text="Default content template")
    summary_template = models.CharField(max_length=500, help_text="Default summary template")
    target_audience_template = models.CharField(max_length=200, help_text="Default target audience")
    objectives_template = models.TextField(help_text="Default objectives")
    call_to_action_template = models.CharField(max_length=300, help_text="Default call to action")
    
    # Template images
    banner_image = models.ImageField(
        upload_to='templates/banners/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])],
        null=True, blank=True
    )
    thumbnail_image = models.ImageField(
        upload_to='templates/thumbnails/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])],
        null=True, blank=True
    )
    
    # Template metadata
    tags_template = models.CharField(max_length=500, blank=True, help_text="Default tags")
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0, help_text="Number of times this template has been used")
    is_active = models.BooleanField(default=True, help_text="Whether this template is available for use")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-usage_count', 'name']
        indexes = [
            models.Index(fields=['campaign_type', 'is_active']),
            models.Index(fields=['usage_count']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_campaign_type_display()})"
    
    def increment_usage(self):
        """Increment usage count when template is used"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])

class HealthCampaign(models.Model):
    """Enhanced model for visual health campaigns with PubMats and banners"""
    
    CAMPAIGN_TYPES = [
        ('GENERAL', 'General Health Information'),
        ('VACCINATION', 'Vaccination Campaign'),
        ('MENTAL_HEALTH', 'Mental Health Awareness'),
        ('NUTRITION', 'Nutrition & Wellness'),
        ('DENTAL_HEALTH', 'Dental Health'),
        ('HYGIENE', 'Personal Hygiene'),
        ('EXERCISE', 'Physical Exercise'),
        ('SAFETY', 'Health & Safety'),
        ('PREVENTION', 'Disease Prevention'),
        ('AWARENESS', 'Health Awareness'),
        ('EMERGENCY', 'Emergency Health'),
        ('SEASONAL', 'Seasonal Health'),
        ('CUSTOM', 'Custom Campaign'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField()
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='DRAFT')
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='MEDIUM')
    
    # Template reference
    template = models.ForeignKey(
        CampaignTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Template used to create this campaign"
    )
    
    # Content
    content = models.TextField(help_text="Detailed campaign content")
    summary = models.CharField(max_length=500, blank=True, help_text="Brief campaign summary")
    
    # Visual Content
    banner_image = models.ImageField(
        upload_to=banner_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])],
        null=True, blank=True,
        help_text="Main banner image for the campaign"
    )
    pubmat_image = models.ImageField(
        upload_to=pubmat_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])],
        null=True, blank=True,
        help_text="PubMat (Public Material) for printing and distribution"
    )
    thumbnail_image = models.ImageField(
        upload_to=campaign_image_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])],
        null=True, blank=True,
        help_text="Thumbnail image for campaign listing"
    )
    
    # Campaign Details
    target_audience = models.CharField(max_length=200, blank=True, help_text="Target audience description")
    objectives = models.TextField(blank=True, help_text="Campaign objectives and goals")
    call_to_action = models.CharField(max_length=300, blank=True, help_text="What action should people take?")
    
    # Scheduling
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    featured_until = models.DateTimeField(null=True, blank=True, help_text="Feature on homepage until this date")
    
    # Engagement
    view_count = models.PositiveIntegerField(default=0)
    engagement_count = models.PositiveIntegerField(default=0, help_text="Clicks, interactions, etc.")
    
    # Meta Information
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    external_link = models.URLField(blank=True, help_text="External link for more information")
    contact_info = models.CharField(max_length=300, blank=True, help_text="Contact information for inquiries")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_health_campaigns')
    last_modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='modified_health_campaigns')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['campaign_type', 'status']),
            models.Index(fields=['featured_until']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        """Check if campaign is currently active"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status == 'ACTIVE' and 
            self.start_date <= now <= self.end_date
        )
    
    @property
    def is_featured(self):
        """Check if campaign should be featured"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.featured_until and 
            now <= self.featured_until and 
            self.is_active
        )
    
    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_engagement(self):
        """Increment engagement count"""
        self.engagement_count += 1
        self.save(update_fields=['engagement_count'])
    
    @classmethod
    def create_from_template(cls, template, user, title=None, **kwargs):
        """Create a new campaign from a template"""
        campaign_data = {
            'title': title or template.title_template,
            'campaign_type': template.campaign_type,
            'priority': template.priority,
            'content': template.content_template,
            'summary': template.summary_template,
            'target_audience': template.target_audience_template,
            'objectives': template.objectives_template,
            'call_to_action': template.call_to_action_template,
            'tags': template.tags_template,
            'template': template,
            'created_by': user,
            'last_modified_by': user,
        }
        
        # Override with any provided kwargs
        campaign_data.update(kwargs)
        
        # Create the campaign
        campaign = cls.objects.create(**campaign_data)
        
        # Increment template usage
        template.increment_usage()
        
        return campaign

class CampaignResource(models.Model):
    """Additional resources for campaigns (downloadable files, additional images, etc.)"""
    
    RESOURCE_TYPES = [
        ('DOCUMENT', 'Document'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('INFOGRAPHIC', 'Infographic'),
        ('FLYER', 'Flyer'),
        ('POSTER', 'Poster'),
        ('BROCHURE', 'Brochure'),
        ('GUIDELINE', 'Guideline'),
        ('CHECKLIST', 'Checklist'),
        ('OTHER', 'Other'),
    ]
    
    campaign = models.ForeignKey(HealthCampaign, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=15, choices=RESOURCE_TYPES)
    file = models.FileField(
        upload_to='resources/',
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov'
        ])]
    )
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    download_count = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True, help_text="Whether this resource is publicly accessible")
    
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['resource_type', 'title']
    
    def __str__(self):
        return f"{self.title} ({self.campaign.title})"
    
    def increment_download_count(self):
        """Increment download count"""
        self.download_count += 1
        self.save(update_fields=['download_count'])

class CampaignFeedback(models.Model):
    """Feedback specifically for health campaigns"""
    
    campaign = models.ForeignKey(HealthCampaign, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Feedback Content
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="1-5 star rating")
    usefulness = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="How useful was this campaign?")
    clarity = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="How clear was the information?")
    
    comments = models.TextField(blank=True)
    suggestions = models.TextField(blank=True, help_text="Suggestions for improvement")
    
    # Engagement Questions
    will_recommend = models.BooleanField(null=True, blank=True)
    took_action = models.BooleanField(null=True, blank=True, help_text="Did you take the recommended action?")
    learned_something_new = models.BooleanField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['campaign', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Feedback for {self.campaign.title} by {self.user.email}"


@receiver(post_save, sender=HealthCampaign)
def health_campaign_notification(sender, instance, created, **kwargs):
    """
    Send notifications when health campaigns are created or status changes
    """
    from notifications.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    if created:
        # Notify admins when a new campaign is created
        admins = User.objects.filter(role__in=['ADMIN', 'STAFF'])
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                title="New Health Campaign Created",
                message=f"A new health campaign '{instance.title}' has been created and is ready for review.",
                notification_type="campaign_created"
            )
    else:
        # Check if status changed to active
        if instance.status == 'ACTIVE':
            # Notify all active users about new active campaign
            active_users = User.objects.filter(is_active=True)
            for user in active_users[:50]:  # Limit to first 50 users to avoid overwhelming
                Notification.objects.create(
                    recipient=user,
                    title=f"New Health Campaign: {instance.title}",
                    message=f"A new health campaign about {instance.get_campaign_type_display()} is now active. Check it out!",
                    notification_type="campaign_activated"
                )