from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HealthInformationViewSet, 
    HealthCampaignViewSet,
    CampaignResourceViewSet,
    CampaignFeedbackViewSet
)

router = DefaultRouter()
router.register(r'health-information', HealthInformationViewSet)
router.register(r'campaigns', HealthCampaignViewSet)
router.register(r'campaign-resources', CampaignResourceViewSet)
router.register(r'campaign-feedback', CampaignFeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 