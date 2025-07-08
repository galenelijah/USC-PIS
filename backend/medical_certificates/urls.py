from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicalCertificateViewSet, CertificateTemplateViewSet

router = DefaultRouter()
router.register(r'certificates', MedicalCertificateViewSet)
router.register(r'templates', CertificateTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 