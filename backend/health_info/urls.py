from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthInformationViewSet

router = DefaultRouter()
router.register(r'health-information', HealthInformationViewSet, basename='health-information')

urlpatterns = [
    path('', include(router.urls)),
] 