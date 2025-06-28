from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.system_health_check, name='system_health'),
    path('database-health/', views.database_health_check, name='database_health'),
    path('performance/', views.performance_stats, name='performance_stats'),
    path('resources/', views.resource_health_check, name='resource_health'),
] 