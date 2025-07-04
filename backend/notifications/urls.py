from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'logs', views.NotificationLogViewSet, basename='notification-log')
router.register(r'preferences', views.NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'campaigns', views.NotificationCampaignViewSet, basename='notification-campaign')

app_name = 'notifications'

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # Additional custom endpoints can be added here
] 