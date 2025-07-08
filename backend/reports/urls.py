from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, GeneratedReportViewSet, ReportScheduleViewSet,
    ReportBookmarkViewSet, ReportAnalyticsViewSet
)

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet)
router.register(r'generated', GeneratedReportViewSet)
router.register(r'schedules', ReportScheduleViewSet)
router.register(r'bookmarks', ReportBookmarkViewSet)
router.register(r'analytics', ReportAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 