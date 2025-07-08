from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta

from authentication.models import User
from patients.permissions import MedicalRecordPermission
from .models import (
    Notification,
    NotificationTemplate,
    NotificationLog,
    NotificationPreference,
    NotificationCampaign
)
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    NotificationTemplateSerializer,
    NotificationLogSerializer,
    NotificationPreferenceSerializer,
    NotificationCampaignSerializer,
    NotificationCampaignCreateSerializer,
    NotificationStatsSerializer,
    BulkNotificationSerializer
)
from .services import NotificationService, CampaignService
from .permissions import IsOwnerOrMedicalStaff, IsMedicalStaff, CanManageNotifications


class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notifications"""
    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification_type', 'priority', 'status', 'delivery_method']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter notifications based on user permissions"""
        user = self.request.user
        
        if user.role in ['medical_staff', 'admin']:
            # Medical staff can see all notifications
            return Notification.objects.select_related(
                'recipient', 'patient', 'template', 'created_by'
            ).prefetch_related('logs')
        else:
            # Regular users can only see their own notifications
            return Notification.objects.filter(
                recipient=user
            ).select_related(
                'recipient', 'patient', 'template', 'created_by'
            ).prefetch_related('logs')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'bulk_create', 'send_test']:
            permission_classes = [IsMedicalStaff]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsMedicalStaff]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Create notification with current user as creator"""
        notification = NotificationService.create_notification(
            recipient=serializer.validated_data['recipient'],
            notification_type=serializer.validated_data['notification_type'],
            title=serializer.validated_data['title'],
            message=serializer.validated_data['message'],
            priority=serializer.validated_data.get('priority', 'MEDIUM'),
            delivery_method=serializer.validated_data.get('delivery_method', 'BOTH'),
            scheduled_at=serializer.validated_data.get('scheduled_at'),
            expires_at=serializer.validated_data.get('expires_at'),
            patient=serializer.validated_data.get('patient'),
            action_url=serializer.validated_data.get('action_url'),
            action_text=serializer.validated_data.get('action_text'),
            metadata=serializer.validated_data.get('metadata', {}),
            created_by=self.request.user
        )
        return notification
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        
        # Only recipient can mark as read
        if notification.recipient != request.user:
            return Response(
                {'error': 'You can only mark your own notifications as read.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.mark_as_read()
        return Response({'status': 'Notification marked as read'})
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend a failed notification"""
        notification = self.get_object()
        
        if notification.status not in ['FAILED', 'CANCELLED']:
            return Response(
                {'error': 'Only failed or cancelled notifications can be resent.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and send
        notification.status = 'PENDING'
        notification.save()
        
        result = NotificationService.send_notification(notification)
        return Response({
            'status': 'Notification resent',
            'result': result
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple notifications at once"""
        serializer = BulkNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        recipient_ids = serializer.validated_data['recipient_ids']
        recipients = User.objects.filter(id__in=recipient_ids, is_active=True)
        
        created_notifications = []
        failed_count = 0
        
        for recipient in recipients:
            try:
                notification = NotificationService.create_notification(
                    recipient=recipient,
                    notification_type=serializer.validated_data['notification_type'],
                    title=serializer.validated_data['title'],
                    message=serializer.validated_data['message'],
                    priority=serializer.validated_data.get('priority', 'MEDIUM'),
                    delivery_method=serializer.validated_data.get('delivery_method', 'BOTH'),
                    scheduled_at=serializer.validated_data.get('scheduled_at'),
                    expires_at=serializer.validated_data.get('expires_at'),
                    action_url=serializer.validated_data.get('action_url'),
                    action_text=serializer.validated_data.get('action_text'),
                    created_by=request.user
                )
                created_notifications.append(notification)
            except Exception as e:
                failed_count += 1
        
        return Response({
            'created_count': len(created_notifications),
            'failed_count': failed_count,
            'total_recipients': len(recipients),
            'notifications': NotificationSerializer(created_notifications, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics"""
        user = request.user
        
        # Base queryset
        if user.role in ['medical_staff', 'admin']:
            queryset = Notification.objects.all()
        else:
            queryset = Notification.objects.filter(recipient=user)
        
        # Calculate statistics
        total_notifications = queryset.count()
        
        status_counts = queryset.aggregate(
            pending=Count(Case(When(status='PENDING', then=1), output_field=IntegerField())),
            sent=Count(Case(When(status='SENT', then=1), output_field=IntegerField())),
            delivered=Count(Case(When(status='DELIVERED', then=1), output_field=IntegerField())),
            read=Count(Case(When(status='READ', then=1), output_field=IntegerField())),
            failed=Count(Case(When(status='FAILED', then=1), output_field=IntegerField()))
        )
        
        # By type statistics
        by_type = {}
        for choice in Notification.NOTIFICATION_TYPES:
            type_code, type_name = choice
            count = queryset.filter(notification_type=type_code).count()
            by_type[type_name] = count
        
        # By priority statistics
        by_priority = {}
        for choice in Notification.PRIORITY_LEVELS:
            priority_code, priority_name = choice
            count = queryset.filter(priority=priority_code).count()
            by_priority[priority_name] = count
        
        # Recent notifications
        recent_notifications = queryset.order_by('-created_at')[:10]
        
        # Calculate rates
        delivery_rate = 0
        read_rate = 0
        if total_notifications > 0:
            delivered_count = status_counts['delivered'] + status_counts['read']
            delivery_rate = (delivered_count / total_notifications) * 100
            
            if delivered_count > 0:
                read_rate = (status_counts['read'] / delivered_count) * 100
        
        stats_data = {
            'total_notifications': total_notifications,
            'pending_notifications': status_counts['pending'],
            'sent_notifications': status_counts['sent'],
            'delivered_notifications': status_counts['delivered'],
            'read_notifications': status_counts['read'],
            'failed_notifications': status_counts['failed'],
            'by_type': by_type,
            'by_priority': by_priority,
            'recent_notifications': recent_notifications,
            'delivery_rate': round(delivery_rate, 2),
            'read_rate': round(read_rate, 2)
        }
        
        serializer = NotificationStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications for current user"""
        unread_notifications = self.get_queryset().filter(
            recipient=request.user,
            status__in=['PENDING', 'SENT', 'DELIVERED']
        )
        
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        updated_count = Notification.objects.filter(
            recipient=request.user,
            status__in=['PENDING', 'SENT', 'DELIVERED']
        ).update(
            status='READ',
            read_at=timezone.now()
        )
        
        return Response({
            'status': 'All notifications marked as read',
            'updated_count': updated_count
        })


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification templates"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsMedicalStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template_type', 'is_active']
    ordering = ['name']
    
    def perform_create(self, serializer):
        """Set created_by field"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test_template(self, request, pk=None):
        """Test template rendering with sample data"""
        template = self.get_object()
        
        # Sample context data
        sample_data = {
            'user_first_name': 'John',
            'user_last_name': 'Doe',
            'user_name': 'John Doe',
            'user_email': 'john.doe@usc.edu.ph',
            'patient_first_name': 'John',
            'patient_last_name': 'Doe',
            'patient_name': 'John Doe',
            'patient_email': 'john.doe@usc.edu.ph',
            'patient_phone': '09123456789',
            'clinic_name': 'USC Health Services',
            'clinic_phone': '(032) 123-4567',
            'clinic_email': 'health@usc.edu.ph',
            'current_date': timezone.now().strftime('%B %d, %Y'),
            'current_time': timezone.now().strftime('%I:%M %p'),
            'appointment_date': 'March 15, 2024',
            'appointment_time': '2:00 PM',
            'doctor_name': 'Dr. Jane Smith',
            'medication_name': 'Amoxicillin',
            'dosage': '500mg',
            'campaign_title': 'Sample Health Campaign'
        }
        
        from .services import NotificationTemplateService
        result = NotificationTemplateService.render_template(template, sample_data)
        
        return Response({
            'template_name': template.name,
            'sample_data': sample_data,
            'rendered_subject': result['subject'],
            'rendered_body': result['body'],
            'render_success': result['success'],
            'error': result.get('error')
        })


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing notification logs"""
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsMedicalStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action', 'error_code']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Filter logs based on notification access"""
        return NotificationLog.objects.select_related('notification').all()


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users can only access their own preferences"""
        if self.request.user.role in ['medical_staff', 'admin']:
            return NotificationPreference.objects.all()
        else:
            return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create preferences for current user"""
        if self.action in ['retrieve', 'update', 'partial_update']:
            # For current user's preferences
            if 'pk' not in self.kwargs or self.kwargs['pk'] == 'me':
                obj, created = NotificationPreference.objects.get_or_create(
                    user=self.request.user
                )
                return obj
        
        return super().get_object()
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's preferences"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        
        if request.method == 'GET':
            serializer = self.get_serializer(obj)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = self.get_serializer(obj, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class NotificationCampaignViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification campaigns"""
    queryset = NotificationCampaign.objects.all()
    permission_classes = [IsMedicalStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['campaign_type', 'status', 'audience_type']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCampaignCreateSerializer
        return NotificationCampaignSerializer
    
    def perform_create(self, serializer):
        """Set created_by field"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a campaign and create notifications"""
        campaign = self.get_object()
        
        if campaign.status != 'DRAFT':
            return Response(
                {'error': 'Only draft campaigns can be activated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update campaign status
        campaign.status = 'ACTIVE'
        campaign.save()
        
        # Create notifications for campaign
        result = CampaignService.create_campaign_notifications(campaign)
        
        return Response({
            'status': 'Campaign activated',
            'result': result
        })
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause an active campaign"""
        campaign = self.get_object()
        
        if campaign.status != 'ACTIVE':
            return Response(
                {'error': 'Only active campaigns can be paused.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.status = 'PAUSED'
        campaign.save()
        
        return Response({'status': 'Campaign paused'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused campaign"""
        campaign = self.get_object()
        
        if campaign.status != 'PAUSED':
            return Response(
                {'error': 'Only paused campaigns can be resumed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.status = 'ACTIVE'
        campaign.save()
        
        return Response({'status': 'Campaign resumed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a campaign"""
        campaign = self.get_object()
        
        if campaign.status in ['COMPLETED', 'CANCELLED']:
            return Response(
                {'error': 'Campaign is already completed or cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.status = 'CANCELLED'
        campaign.save()
        
        return Response({'status': 'Campaign cancelled'})
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get detailed campaign statistics"""
        campaign = self.get_object()
        
        stats = CampaignService.update_campaign_statistics(campaign)
        
        return Response({
            'campaign_name': campaign.name,
            'campaign_status': campaign.status,
            'statistics': stats
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of all campaigns"""
        campaigns = self.get_queryset()
        
        summary = {
            'total_campaigns': campaigns.count(),
            'active_campaigns': campaigns.filter(status='ACTIVE').count(),
            'draft_campaigns': campaigns.filter(status='DRAFT').count(),
            'completed_campaigns': campaigns.filter(status='COMPLETED').count(),
            'cancelled_campaigns': campaigns.filter(status='CANCELLED').count(),
        }
        
        return Response(summary)