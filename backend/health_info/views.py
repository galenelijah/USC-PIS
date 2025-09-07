from django.shortcuts import render
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
import logging
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import HealthInformation, HealthInformationImage, HealthCampaign, CampaignResource, CampaignFeedback
from .serializers import (
    HealthInformationSerializer, 
    HealthCampaignListSerializer,
    HealthCampaignDetailSerializer,
    HealthCampaignCreateUpdateSerializer,
    CampaignResourceSerializer,
    CampaignFeedbackSerializer,
    CampaignAnalyticsSerializer
)

def health_info_placeholder(request):
    return HttpResponse('Health Info app is set up. Replace this with actual views.')

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow staff to edit campaigns.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role in ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE']
        )

class CampaignPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50

class HealthInformationViewSet(viewsets.ModelViewSet):
    queryset = HealthInformation.objects.all()
    serializer_class = HealthInformationSerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        # Save the health information instance
        health_info = serializer.save(author=self.request.user)
        
        # Handle image uploads if present
        images = self.request.FILES.getlist('images')
        for index, image_file in enumerate(images):
            HealthInformationImage.objects.create(
                health_info=health_info,
                image=image_file,
                order=index
            )
    
    def perform_update(self, serializer):
        # Save the health information instance
        health_info = serializer.save()
        
        # Handle image uploads if present
        images = self.request.FILES.getlist('images')
        if images:  # Only update images if new ones are provided
            # Remove existing images
            health_info.images.all().delete()
            # Add new images
            for index, image_file in enumerate(images):
                HealthInformationImage.objects.create(
                    health_info=health_info,
                    image=image_file,
                    order=index
                )

class HealthCampaignViewSet(viewsets.ModelViewSet):
    """Health campaigns viewset using the same approach as HealthInformationViewSet"""
    queryset = HealthCampaign.objects.all()
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = CampaignPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add back JSONParser like health info
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['campaign_type', 'status', 'priority']
    search_fields = ['title', 'description', 'content', 'tags']
    ordering_fields = ['created_at', 'start_date', 'view_count', 'engagement_count']
    ordering = ['-created_at']
    
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HealthCampaignListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return HealthCampaignCreateUpdateSerializer
        return HealthCampaignDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Show all campaigns to all authenticated users
        # No role-based filtering - everyone can see all campaigns
        
        # Additional filters
        featured = self.request.query_params.get('featured', None)
        if featured == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                featured_until__gte=now,
                status='ACTIVE',
                start_date__lte=now,
                end_date__gte=now
            )
        
        active = self.request.query_params.get('active', None)
        if active == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                status='ACTIVE',
                start_date__lte=now,
                end_date__gte=now
            )
        
        return queryset
    
    def perform_create(self, serializer):
        logger = logging.getLogger(__name__)
        try:
            # Save the campaign instance with user info if available
            user = self.request.user if self.request.user.is_authenticated else None
            
            # Check if Cloudinary is properly configured
            import os
            cloudinary_configured = (
                os.environ.get('USE_CLOUDINARY') == 'True' and 
                os.environ.get('CLOUDINARY_CLOUD_NAME') and 
                os.environ.get('CLOUDINARY_API_KEY') and 
                os.environ.get('CLOUDINARY_API_SECRET')
            )
            
            # Process files before creating the campaign to avoid Cloudinary empty file errors
            file_data = {}
            
            # Handle specific image field uploads only if properly configured or files are valid
            if 'banner_image' in self.request.FILES:
                file_obj = self.request.FILES['banner_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    if cloudinary_configured:
                        file_data['banner_image'] = file_obj
                        logger.info(f"Prepared banner_image: {file_obj.name} ({file_obj.size} bytes)")
                    else:
                        logger.warning("Cloudinary not configured - skipping banner_image upload")
            
            if 'thumbnail_image' in self.request.FILES:
                file_obj = self.request.FILES['thumbnail_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    if cloudinary_configured:
                        file_data['thumbnail_image'] = file_obj
                        logger.info(f"Prepared thumbnail_image: {file_obj.name} ({file_obj.size} bytes)")
                    else:
                        logger.warning("Cloudinary not configured - skipping thumbnail_image upload")
            
            if 'pubmat_image' in self.request.FILES:
                file_obj = self.request.FILES['pubmat_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    if cloudinary_configured:
                        file_data['pubmat_image'] = file_obj
                        logger.info(f"Prepared pubmat_image: {file_obj.name} ({file_obj.size} bytes)")
                    else:
                        logger.warning("Cloudinary not configured - skipping pubmat_image upload")
            
            # Save campaign instance first without file data
            campaign = serializer.save(created_by=user, last_modified_by=user)
            
            # Then handle file uploads after campaign is created
            if file_data and cloudinary_configured:
                for field_name, file_obj in file_data.items():
                    try:
                        setattr(campaign, field_name, file_obj)
                        logger.info(f"Successfully set {field_name} for campaign {campaign.id}")
                    except Exception as file_error:
                        logger.error(f"Error setting {field_name} for campaign {campaign.id}: {str(file_error)}")
                
                # Save the campaign again with files
                try:
                    campaign.save()
                    logger.info(f"Campaign files saved successfully for campaign {campaign.id}")
                except Exception as save_error:
                    logger.error(f"Error saving campaign files: {str(save_error)}")
                    # Don't fail the entire operation, campaign was created successfully
            
            logger.info(f"Campaign created successfully: {campaign.title} (ID: {campaign.id})")
            
            # If Cloudinary not configured, warn user
            if not cloudinary_configured and self.request.FILES:
                logger.warning("Campaign created without images - Cloudinary not configured")
            
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            raise
    
    def perform_update(self, serializer):
        logger = logging.getLogger(__name__)
        try:
            # Process files before updating the campaign to avoid Cloudinary empty file errors
            file_data = {}
            
            # Handle specific image field uploads
            if 'banner_image' in self.request.FILES:
                file_obj = self.request.FILES['banner_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    file_data['banner_image'] = file_obj
                    logger.info(f"Prepared banner_image for update: {file_obj.name} ({file_obj.size} bytes)")
            
            if 'thumbnail_image' in self.request.FILES:
                file_obj = self.request.FILES['thumbnail_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    file_data['thumbnail_image'] = file_obj
                    logger.info(f"Prepared thumbnail_image for update: {file_obj.name} ({file_obj.size} bytes)")
            
            if 'pubmat_image' in self.request.FILES:
                file_obj = self.request.FILES['pubmat_image']
                if file_obj and file_obj.size > 0:
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    file_data['pubmat_image'] = file_obj
                    logger.info(f"Prepared pubmat_image for update: {file_obj.name} ({file_obj.size} bytes)")
            
            # Save campaign instance first without file data
            campaign = serializer.save(last_modified_by=self.request.user)
            
            # Then handle file uploads after campaign is updated
            import os
            cloudinary_configured = (
                os.environ.get('USE_CLOUDINARY') == 'True' and 
                os.environ.get('CLOUDINARY_CLOUD_NAME') and 
                os.environ.get('CLOUDINARY_API_KEY') and 
                os.environ.get('CLOUDINARY_API_SECRET')
            )
            
            if file_data and cloudinary_configured:
                for field_name, file_obj in file_data.items():
                    try:
                        setattr(campaign, field_name, file_obj)
                        logger.info(f"Successfully updated {field_name} for campaign {campaign.id}")
                    except Exception as file_error:
                        logger.error(f"Error updating {field_name} for campaign {campaign.id}: {str(file_error)}")
                
                # Save the campaign again with files
                try:
                    campaign.save()
                    logger.info(f"Campaign files updated successfully for campaign {campaign.id}")
                except Exception as save_error:
                    logger.error(f"Error saving campaign file updates: {str(save_error)}")
            
            logger.info(f"Campaign updated successfully: {campaign.title} (ID: {campaign.id})")
            
        except Exception as e:
            logger.error(f"Error in perform_update: {str(e)}", exc_info=True)
            raise
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count for active campaigns
        if instance.status == 'ACTIVE':
            instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def engage(self, request, pk=None):
        """Track engagement (clicks, interactions)"""
        campaign = self.get_object()
        if campaign.status == 'ACTIVE':
            campaign.increment_engagement()
            return Response({'status': 'engagement tracked'})
        return Response({'error': 'Campaign not active'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def resources(self, request, pk=None):
        """Get campaign resources"""
        campaign = self.get_object()
        resources = campaign.resources.filter(is_public=True)
        serializer = CampaignResourceSerializer(resources, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_resource(self, request, pk=None):
        """Upload a resource for the campaign"""
        if not (request.user.is_staff or request.user.role in ['ADMIN', 'STAFF']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        campaign = self.get_object()
        serializer = CampaignResourceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Calculate file size
            file = request.FILES.get('file')
            if file:
                file_size = file.size
                serializer.save(campaign=campaign, uploaded_by=request.user, file_size=file_size)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def feedback(self, request, pk=None):
        """Get or submit feedback for campaign"""
        campaign = self.get_object()
        
        if request.method == 'GET':
            # Get feedback for this campaign
            if request.user.is_staff or request.user.role in ['ADMIN', 'STAFF']:
                # Staff can see all feedback
                feedback = campaign.feedback.all()
            else:
                # Users can only see their own feedback
                feedback = campaign.feedback.filter(user=request.user)
            
            serializer = CampaignFeedbackSerializer(feedback, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Submit feedback
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            data = request.data.copy()
            data['campaign'] = campaign.id
            serializer = CampaignFeedbackSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get campaign analytics"""
        if not (request.user.is_staff or request.user.role in ['ADMIN', 'STAFF']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Basic stats
        total_campaigns = HealthCampaign.objects.count()
        active_campaigns = HealthCampaign.objects.filter(status='ACTIVE').count()
        completed_campaigns = HealthCampaign.objects.filter(status='COMPLETED').count()
        draft_campaigns = HealthCampaign.objects.filter(status='DRAFT').count()
        
        # Engagement stats
        total_views = HealthCampaign.objects.aggregate(Sum('view_count'))['view_count__sum'] or 0
        total_engagement = HealthCampaign.objects.aggregate(Sum('engagement_count'))['engagement_count__sum'] or 0
        
        # Average rating
        average_rating = CampaignFeedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
        
        # Top campaigns by views
        top_campaigns = HealthCampaign.objects.order_by('-view_count')[:5]
        top_campaigns_serializer = HealthCampaignListSerializer(top_campaigns, many=True, context={'request': request})
        
        # Campaign types distribution
        campaign_types = HealthCampaign.objects.values('campaign_type').annotate(
            count=Count('id')
        ).order_by('-count')
        campaign_types_distribution = {item['campaign_type']: item['count'] for item in campaign_types}
        
        # Monthly stats for the last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_stats = []
        for i in range(6):
            month_start = six_months_ago + timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            month_campaigns = HealthCampaign.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'campaigns': month_campaigns
            })
        
        # Engagement trends
        engagement_trends = []
        for i in range(7):  # Last 7 days
            day = timezone.now() - timedelta(days=i)
            day_engagement = HealthCampaign.objects.filter(
                updated_at__date=day.date()
            ).aggregate(Sum('engagement_count'))['engagement_count__sum'] or 0
            engagement_trends.append({
                'date': day.strftime('%Y-%m-%d'),
                'engagement': day_engagement
            })
        
        analytics_data = {
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'completed_campaigns': completed_campaigns,
            'draft_campaigns': draft_campaigns,
            'total_views': total_views,
            'total_engagement': total_engagement,
            'average_rating': round(average_rating, 1),
            'top_campaigns': top_campaigns_serializer.data,
            'campaign_types_distribution': campaign_types_distribution,
            'monthly_stats': monthly_stats,
            'engagement_trends': engagement_trends
        }
        
        return Response(analytics_data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get currently featured campaigns - show active campaigns regardless of end date"""
        now = timezone.now()
        featured_campaigns = HealthCampaign.objects.filter(
            Q(featured_until__gte=now) | Q(featured_until__isnull=True),
            status='ACTIVE',
            start_date__lte=now
        ).order_by('-priority', '-created_at')[:5]
        
        serializer = HealthCampaignListSerializer(featured_campaigns, many=True, context={'request': request})
        return Response(serializer.data)

class CampaignResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing campaign resources"""
    queryset = CampaignResource.objects.all()
    serializer_class = CampaignResourceSerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['resource_type', 'campaign']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Non-staff users can only see public resources
        if not (self.request.user.is_staff or self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(is_public=True)
        return queryset
    
    def perform_create(self, serializer):
        # Calculate file size
        file = self.request.FILES.get('file')
        file_size = file.size if file else 0
        serializer.save(uploaded_by=self.request.user, file_size=file_size)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Track download and return file"""
        resource = self.get_object()
        resource.increment_download_count()
        return Response({'download_url': resource.file.url})

class CampaignFeedbackViewSet(viewsets.ModelViewSet):
    """ViewSet for managing campaign feedback"""
    queryset = CampaignFeedback.objects.all()
    serializer_class = CampaignFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['campaign', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Staff can see all feedback, users only their own
        if not (self.request.user.is_staff or self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 