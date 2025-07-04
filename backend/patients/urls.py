from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'medical-records', views.MedicalRecordViewSet)
router.register(r'dental-records', views.DentalRecordViewSet)
router.register(r'consultations', views.ConsultationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
] 