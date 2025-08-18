from rest_framework import serializers
from .models import HealthInformation, HealthInformationImage, HealthCampaign, CampaignResource, CampaignFeedback
from authentication.models import User

class HealthInformationImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthInformationImage
        fields = ['id', 'url', 'caption', 'order']
    
    def get_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class HealthInformationSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    images = HealthInformationImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = HealthInformation
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'author')

class CampaignResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = CampaignResource
        fields = '__all__'
        read_only_fields = ('created_at', 'uploaded_by', 'download_count', 'file_size')
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size_formatted(self, obj):
        """Return human-readable file size"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

class HealthCampaignListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for campaign listing"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    banner_image_url = serializers.SerializerMethodField()
    thumbnail_image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()  # For frontend compatibility
    is_active = serializers.ReadOnlyField()
    is_featured = serializers.ReadOnlyField()
    resource_count = serializers.SerializerMethodField()
    feedback_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthCampaign
        fields = [
            'id', 'title', 'summary', 'campaign_type', 'status', 'priority',
            'start_date', 'end_date', 'featured_until', 'view_count', 'engagement_count',
            'created_at', 'updated_at', 'created_by_name', 'banner_image_url', 
            'thumbnail_image_url', 'images', 'is_active', 'is_featured', 'resource_count',
            'feedback_count', 'average_rating', 'tags'
        ]
    
    def get_banner_image_url(self, obj):
        if obj.banner_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None
    
    def get_thumbnail_image_url(self, obj):
        if obj.thumbnail_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail_image.url)
            return obj.thumbnail_image.url
        return None
    
    def get_images(self, obj):
        """Return array of campaign images for frontend compatibility"""
        images = []
        request = self.context.get('request')
        
        # Add banner image if it exists
        if obj.banner_image:
            url = request.build_absolute_uri(obj.banner_image.url) if request else obj.banner_image.url
            images.append({
                'id': f'banner_{obj.id}',
                'url': url,
                'type': 'banner',
                'caption': 'Campaign Banner'
            })
        
        # Add thumbnail image if it exists
        if obj.thumbnail_image:
            url = request.build_absolute_uri(obj.thumbnail_image.url) if request else obj.thumbnail_image.url
            images.append({
                'id': f'thumbnail_{obj.id}',
                'url': url,
                'type': 'thumbnail',
                'caption': 'Campaign Thumbnail'
            })
        
        # Add pubmat image if it exists
        if obj.pubmat_image:
            url = request.build_absolute_uri(obj.pubmat_image.url) if request else obj.pubmat_image.url
            images.append({
                'id': f'pubmat_{obj.id}',
                'url': url,
                'type': 'pubmat',
                'caption': 'Campaign PubMat'
            })
        
        return images
    
    def get_resource_count(self, obj):
        return obj.resources.count()
    
    def get_feedback_count(self, obj):
        return obj.feedback.count()
    
    def get_average_rating(self, obj):
        feedback = obj.feedback.all()
        if feedback:
            total_rating = sum(f.rating for f in feedback)
            return round(total_rating / len(feedback), 1)
        return 0

class HealthCampaignDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for campaign details"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    last_modified_by_name = serializers.CharField(source='last_modified_by.get_full_name', read_only=True)
    banner_image_url = serializers.SerializerMethodField()
    thumbnail_image_url = serializers.SerializerMethodField()
    pubmat_image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()  # For frontend compatibility
    is_active = serializers.ReadOnlyField()
    is_featured = serializers.ReadOnlyField()
    resources = CampaignResourceSerializer(many=True, read_only=True)
    tags_list = serializers.SerializerMethodField()
    
    # Analytics
    resource_count = serializers.SerializerMethodField()
    feedback_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    engagement_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthCampaign
        fields = '__all__'
        read_only_fields = (
            'created_at', 'updated_at', 'created_by', 'last_modified_by', 
            'view_count', 'engagement_count'
        )
    
    def get_banner_image_url(self, obj):
        if obj.banner_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None
    
    def get_thumbnail_image_url(self, obj):
        if obj.thumbnail_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail_image.url)
            return obj.thumbnail_image.url
        return None
    
    def get_pubmat_image_url(self, obj):
        if obj.pubmat_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pubmat_image.url)
            return obj.pubmat_image.url
        return None
    
    def get_images(self, obj):
        """Return array of campaign images for frontend compatibility"""
        images = []
        request = self.context.get('request')
        
        # Add banner image if it exists
        if obj.banner_image:
            url = request.build_absolute_uri(obj.banner_image.url) if request else obj.banner_image.url
            images.append({
                'id': f'banner_{obj.id}',
                'url': url,
                'type': 'banner',
                'caption': 'Campaign Banner'
            })
        
        # Add thumbnail image if it exists
        if obj.thumbnail_image:
            url = request.build_absolute_uri(obj.thumbnail_image.url) if request else obj.thumbnail_image.url
            images.append({
                'id': f'thumbnail_{obj.id}',
                'url': url,
                'type': 'thumbnail', 
                'caption': 'Campaign Thumbnail'
            })
        
        # Add pubmat image if it exists
        if obj.pubmat_image:
            url = request.build_absolute_uri(obj.pubmat_image.url) if request else obj.pubmat_image.url
            images.append({
                'id': f'pubmat_{obj.id}',
                'url': url,
                'type': 'pubmat',
                'caption': 'Campaign PubMat'
            })
        
        return images
    
    def get_tags_list(self, obj):
        if obj.tags:
            return [tag.strip() for tag in obj.tags.split(',') if tag.strip()]
        return []
    
    def get_resource_count(self, obj):
        return obj.resources.count()
    
    def get_feedback_count(self, obj):
        return obj.feedback.count()
    
    def get_average_rating(self, obj):
        feedback = obj.feedback.all()
        if feedback:
            total_rating = sum(f.rating for f in feedback)
            return round(total_rating / len(feedback), 1)
        return 0
    
    def get_engagement_rate(self, obj):
        if obj.view_count > 0:
            return round((obj.engagement_count / obj.view_count) * 100, 1)
        return 0

class HealthCampaignCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating campaigns"""
    
    class Meta:
        model = HealthCampaign
        exclude = ('created_at', 'updated_at', 'created_by', 'last_modified_by', 'view_count', 'engagement_count')
    
    def validate(self, data):
        """Validate campaign data with enhanced error handling"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Validating campaign data: {list(data.keys())}")
        
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            logger.error(f"Date validation failed: start_date={start_date} >= end_date={end_date}")
            raise serializers.ValidationError("End date must be after start date")
        
        featured_until = data.get('featured_until')
        if featured_until and end_date and featured_until > end_date:
            logger.error(f"Featured date validation failed: featured_until={featured_until} > end_date={end_date}")
            raise serializers.ValidationError("Featured until date cannot be after campaign end date")
        
        logger.info("Campaign data validation passed")
        return data

class CampaignFeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    
    class Meta:
        model = CampaignFeedback
        fields = '__all__'
        read_only_fields = ('created_at', 'user')
    
    def validate(self, data):
        """Ensure user hasn't already provided feedback for this campaign"""
        user = self.context['request'].user
        campaign = data.get('campaign')
        
        if self.instance is None:  # Creating new feedback
            if CampaignFeedback.objects.filter(user=user, campaign=campaign).exists():
                raise serializers.ValidationError("You have already provided feedback for this campaign")
        
        return data

class CampaignAnalyticsSerializer(serializers.Serializer):
    """Serializer for campaign analytics data"""
    total_campaigns = serializers.IntegerField()
    active_campaigns = serializers.IntegerField()
    completed_campaigns = serializers.IntegerField()
    draft_campaigns = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_engagement = serializers.IntegerField()
    average_rating = serializers.FloatField()
    top_campaigns = HealthCampaignListSerializer(many=True)
    campaign_types_distribution = serializers.DictField()
    monthly_stats = serializers.ListField()
    engagement_trends = serializers.ListField() 