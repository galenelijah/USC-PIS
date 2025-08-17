from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.system_health_check, name='system_health'),
    path('database-health/', views.database_health_check, name='database_health'),
    path('performance/', views.performance_stats, name='performance_stats'),
    path('resources/', views.resource_health_check, name='resource_health'),
    
    # Backup system endpoints
    path('backup-health/', views.backup_health_check, name='backup_health'),
    path('backup/trigger/', views.trigger_manual_backup, name='trigger_backup'),
    path('backup-status/<int:backup_id>/', views.backup_status_detail, name='backup_status_detail'),
    path('backup/download/<int:backup_id>/', views.download_backup, name='download_backup'),
    path('backup/restore/', views.restore_backup, name='restore_backup'),
] 