from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileUploadViewSet, PatientDocumentViewSet

router = DefaultRouter()
router.register(r'uploads', FileUploadViewSet, basename='file-upload')
router.register(r'patient-documents', PatientDocumentViewSet, basename='patient-document')

urlpatterns = [
    path('', include(router.urls)),
] 
