from django.urls import path
from . import views
from . import email_admin_views
from . import backup_views
from . import backup_upload_views

urlpatterns = [
    # Legacy health endpoints
    path('health/', views.system_health_check, name='system_health'),
    path('database-health/', views.database_health_check, name='database_health'),
    path('performance/', views.performance_stats, name='performance_stats'),
    path('resources/', views.resource_health_check, name='resource_health'),
    
    # Enhanced health check endpoints
    path('health/comprehensive/', views.comprehensive_health_check, name='comprehensive_health'),
    path('health/quick/', views.quick_health_api, name='quick_health'),
    path('metrics/', views.system_metrics, name='system_metrics'),
    
    # Legacy backup system endpoints (for compatibility)
    path('backup-health/', views.backup_health_check, name='backup_health'),
    path('backup/trigger/', views.trigger_manual_backup, name='trigger_backup'),
    path('backup-status/<int:backup_id>/', views.backup_status_detail, name='backup_status_detail'),
    path('backup/download/<int:backup_id>/', views.download_backup, name='download_backup'),
    path('backup/restore/', views.restore_backup, name='restore_backup'),
    
    # New efficient backup endpoints
    path('backup/create/', backup_views.create_backup, name='create_backup_v2'),
    path('backup/status/<int:backup_id>/', backup_views.backup_status, name='backup_status_v2'),
    path('backup/download-v2/<int:backup_id>/', backup_views.download_backup, name='download_backup_v2'),
    path('backup/verify/<int:backup_id>/', backup_views.verify_backup, name='verify_backup'),
    path('backup/list/', backup_views.backup_list, name='backup_list_v2'),
    path('backup/delete/<int:backup_id>/', backup_views.delete_backup, name='delete_backup'),
    path('backup/health/', backup_views.backup_system_health, name='backup_system_health'),
    
    # Backup upload and restore endpoints
    path('backup/upload/', backup_upload_views.upload_backup, name='upload_backup'),
    path('backup/restore-uploaded/', backup_upload_views.restore_backup, name='restore_uploaded_backup'),
    path('backup/uploaded/', backup_upload_views.uploaded_backups_list, name='uploaded_backups_list'),
    path('backup/uploaded/<int:backup_id>/', backup_upload_views.delete_uploaded_backup, name='delete_uploaded_backup'),
    path('backup/upload-info/', backup_upload_views.backup_upload_info, name='backup_upload_info'),
    
    # Email administration endpoints
    path('email/status/', email_admin_views.email_system_status, name='email_system_status'),
    path('email/test/', email_admin_views.test_email_system, name='test_email_system'),
    path('email/feedback/send/', email_admin_views.send_feedback_emails, name='send_feedback_emails'),
    path('email/health-alert/send/', email_admin_views.send_health_alert, name='send_health_alert'),
    path('email/stats/', email_admin_views.email_automation_stats, name='email_automation_stats'),
] 