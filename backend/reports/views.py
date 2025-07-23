from django.shortcuts import render
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.core.files.base import ContentFile
from datetime import datetime, timedelta
import os
import uuid
import threading
from .models import (
    ReportTemplate, GeneratedReport, ReportMetric, ReportChart,
    ReportSchedule, ReportAnalytics, ReportBookmark
)
from .serializers import (
    ReportTemplateSerializer, GeneratedReportListSerializer, GeneratedReportDetailSerializer,
    ReportGenerationRequestSerializer, ReportScheduleSerializer, ReportAnalyticsSerializer,
    ReportBookmarkSerializer, ReportDashboardSerializer, ReportFilterSerializer
)
from .services import ReportGenerationService
import logging

logger = logging.getLogger(__name__)

class IsStaffOrReadOnly(permissions.BasePermission):
    """Custom permission for reports"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role in ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE']
        )

class ReportPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

def generate_report_task(report_id, template_id, filters, date_start, date_end, export_format):
    """Background task for generating reports"""
    try:
        report = GeneratedReport.objects.get(id=report_id)
        template = ReportTemplate.objects.get(id=template_id)
        
        report.status = 'GENERATING'
        report.progress_percentage = 10
        report.save()
        
        # Initialize report generation service
        service = ReportGenerationService()
        
        # Generate report based on type
        report_data = None
        if template.report_type == 'PATIENT_SUMMARY':
            report_data = service.generate_patient_summary_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'VISIT_TRENDS':
            report_data = service.generate_visit_trends_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'TREATMENT_OUTCOMES':
            report_data = service.generate_treatment_outcomes_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'FEEDBACK_ANALYSIS':
            report_data = service.generate_feedback_analysis_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'COMPREHENSIVE_ANALYTICS':
            report_data = service.generate_comprehensive_analytics_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'MEDICAL_STATISTICS':
            report_data = service.generate_medical_statistics_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'DENTAL_STATISTICS':
            report_data = service.generate_dental_statistics_report(
                date_start, date_end, filters, export_format
            )
        elif template.report_type == 'CAMPAIGN_PERFORMANCE':
            report_data = service.generate_campaign_performance_report(
                date_start, date_end, filters, export_format
            )
        
        if report_data:
            # Save file
            file_extension = {
                'PDF': 'pdf',
                'EXCEL': 'xlsx',
                'CSV': 'csv',
                'JSON': 'json'
            }.get(export_format, 'pdf')
            
            filename = f"report_{report.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            report.file_path.save(filename, ContentFile(report_data))
            report.file_size = len(report_data)
            report.status = 'COMPLETED'
            report.progress_percentage = 100
            report.completed_at = timezone.now()
            report.generation_time = timezone.now() - report.created_at
            
        else:
            report.status = 'FAILED'
            report.error_message = 'Failed to generate report data'
        
        report.save()
        
    except Exception as e:
        import traceback
        error_details = f"Error generating report {report_id}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_details)
        try:
            report = GeneratedReport.objects.get(id=report_id)
            report.status = 'FAILED'
            report.error_message = f"{str(e)}\n\nFull traceback:\n{traceback.format_exc()}"
            report.save()
        except Exception as save_error:
            logger.error(f"Failed to save error status: {save_error}")
            pass

class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report templates"""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['report_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'report_type', 'created_at']
    ordering = ['report_type', 'name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user role permissions
        user = self.request.user
        if not (user.is_staff or user.role in ['ADMIN', 'STAFF']):
            # Filter templates based on allowed roles
            queryset = queryset.filter(
                Q(allowed_roles__contains=[user.role]) |
                Q(allowed_roles__contains=['ALL']) |
                Q(allowed_roles=[])
            )
        
        return queryset.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate a report from this template"""
        template = self.get_object()
        
        # Validate request data
        serializer = ReportGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Check user permissions
        user_role = request.user.role
        if template.allowed_roles and user_role not in template.allowed_roles:
            return Response(
                {'error': 'You do not have permission to generate this report'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create report record
        report = GeneratedReport.objects.create(
            template=template,
            generated_by=request.user,
            title=validated_data['title'],
            date_range_start=validated_data.get('date_range_start'),
            date_range_end=validated_data.get('date_range_end'),
            filters=validated_data.get('filters', {}),
            export_format=validated_data['export_format'],
            expires_at=timezone.now() + timedelta(days=30)  # Reports expire after 30 days
        )
        
        # Start background task for report generation using threading
        thread = threading.Thread(
            target=generate_report_task,
            args=(
                report.id,
                template.id,
                validated_data.get('filters', {}),
                validated_data.get('date_range_start'),
                validated_data.get('date_range_end'),
                validated_data['export_format']
            )
        )
        thread.daemon = True
        thread.start()
        
        return Response({
            'report_id': report.id,
            'status': 'PENDING',
            'message': 'Report generation started'
        }, status=status.HTTP_202_ACCEPTED)

class GeneratedReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing generated reports"""
    queryset = GeneratedReport.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'export_format', 'template__report_type']
    search_fields = ['title', 'template__name']
    ordering_fields = ['created_at', 'completed_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return GeneratedReportListSerializer
        return GeneratedReportDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Users can only see their own reports unless they're staff
        if not (self.request.user.is_staff or self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(generated_by=self.request.user)
        
        # Filter out expired reports
        queryset = queryset.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
        )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download generated report file"""
        report = self.get_object()
        
        if report.status != 'COMPLETED':
            return Response(
                {'error': 'Report is not ready for download'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not report.file_path:
            return Response(
                {'error': 'Report file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if file exists
        if not os.path.exists(report.file_path.path):
            return Response(
                {'error': 'Report file not found on disk'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Increment download count
        report.increment_download_count()
        
        # Return file
        with open(report.file_path.path, 'rb') as f:
            response = HttpResponse(f.read())
            
        content_type = {
            'PDF': 'application/pdf',
            'EXCEL': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'CSV': 'text/csv',
            'JSON': 'application/json'
        }.get(report.export_format, 'application/octet-stream')
        
        response['Content-Type'] = content_type
        response['Content-Disposition'] = f'attachment; filename="{report.title}.{report.export_format.lower()}"'
        
        return response
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get report generation status"""
        report = self.get_object()
        return Response({
            'status': report.status,
            'progress_percentage': report.progress_percentage,
            'error_message': report.error_message,
            'created_at': report.created_at,
            'completed_at': report.completed_at
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get report dashboard data"""
        user = request.user
        
        # Base queryset for user's reports
        if user.is_staff or user.role in ['ADMIN', 'STAFF']:
            base_queryset = GeneratedReport.objects.all()
        else:
            base_queryset = GeneratedReport.objects.filter(generated_by=user)
        
        # Calculate metrics
        total_reports = base_queryset.count()
        reports_this_month = base_queryset.filter(
            created_at__gte=timezone.now().replace(day=1)
        ).count()
        pending_reports = base_queryset.filter(status='PENDING').count()
        failed_reports = base_queryset.filter(status='FAILED').count()
        
        # Popular templates
        popular_templates = ReportTemplate.objects.annotate(
            generation_count=Count('generated_reports')
        ).order_by('-generation_count')[:5]
        
        # Recent reports
        recent_reports = base_queryset.order_by('-created_at')[:10]
        
        # Format distribution
        format_dist = base_queryset.values('export_format').annotate(
            count=Count('id')
        ).order_by('-count')
        format_distribution = {item['export_format']: item['count'] for item in format_dist}
        
        # Generation trends (last 30 days)
        generation_trends = []
        for i in range(30):
            day = timezone.now() - timedelta(days=i)
            day_reports = base_queryset.filter(
                created_at__date=day.date()
            ).count()
            generation_trends.append({
                'date': day.strftime('%Y-%m-%d'),
                'reports': day_reports
            })
        
        # User activity (if staff)
        user_activity = []
        if user.is_staff or user.role in ['ADMIN', 'STAFF']:
            user_activity = GeneratedReport.objects.values(
                'generated_by__first_name', 'generated_by__last_name'
            ).annotate(
                report_count=Count('id')
            ).order_by('-report_count')[:10]
        
        # Storage usage
        total_size = base_queryset.aggregate(
            total_size=Sum('file_size')
        )['total_size'] or 0
        
        storage_usage = {
            'total_size': total_size,
            'total_size_formatted': self._format_file_size(total_size),
            'report_count': total_reports
        }
        
        dashboard_data = {
            'total_reports': total_reports,
            'reports_this_month': reports_this_month,
            'pending_reports': pending_reports,
            'failed_reports': failed_reports,
            'popular_templates': ReportTemplateSerializer(popular_templates, many=True).data,
            'recent_reports': GeneratedReportListSerializer(recent_reports, many=True, context={'request': request}).data,
            'format_distribution': format_distribution,
            'generation_trends': generation_trends,
            'user_activity': user_activity,
            'storage_usage': storage_usage
        }
        
        return Response(dashboard_data)
    
    def _format_file_size(self, size):
        """Format file size in human readable format"""
        if not size:
            return "0 B"
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

class ReportScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report schedules"""
    queryset = ReportSchedule.objects.all()
    serializer_class = ReportScheduleSerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['frequency', 'is_active', 'template__report_type']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'next_run', 'created_at']
    ordering = ['next_run', 'name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Users can only see their own schedules unless they're staff
        if not (self.request.user.is_staff or self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """Run scheduled report immediately"""
        schedule = self.get_object()
        
        # Create report record
        report = GeneratedReport.objects.create(
            template=schedule.template,
            generated_by=request.user,
            title=f"{schedule.name} - Manual Run",
            date_range_start=timezone.now() - timedelta(days=30),
            date_range_end=timezone.now(),
            filters=schedule.filters,
            export_format=schedule.export_format,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Start background task
        generate_report_task(
            report.id,
            schedule.template.id,
            schedule.filters,
            timezone.now() - timedelta(days=30),
            timezone.now(),
            schedule.export_format
        )
        
        return Response({
            'report_id': report.id,
            'message': 'Report generation started'
        })

class ReportBookmarkViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report bookmarks"""
    queryset = ReportBookmark.objects.all()
    serializer_class = ReportBookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['template__report_type']
    search_fields = ['name', 'template__name']
    ordering_fields = ['name', 'last_used', 'use_count']
    ordering = ['-last_used']
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        """Use bookmark to generate report"""
        bookmark = self.get_object()
        bookmark.increment_use_count()
        
        # Generate report with bookmark settings
        report = GeneratedReport.objects.create(
            template=bookmark.template,
            generated_by=request.user,
            title=f"{bookmark.name} - {timezone.now().strftime('%Y-%m-%d')}",
            date_range_start=timezone.now() - timedelta(days=30),
            date_range_end=timezone.now(),
            filters=bookmark.saved_filters,
            export_format=bookmark.preferred_format,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Start background task
        generate_report_task(
            report.id,
            bookmark.template.id,
            bookmark.saved_filters,
            timezone.now() - timedelta(days=30),
            timezone.now(),
            bookmark.preferred_format
        )
        
        return Response({
            'report_id': report.id,
            'message': 'Report generation started from bookmark'
        })

class ReportAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for report analytics"""
    queryset = ReportAnalytics.objects.all()
    serializer_class = ReportAnalyticsSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['report_template__report_type']
    ordering_fields = ['last_calculated', 'total_generations']
    ordering = ['-last_calculated'] 