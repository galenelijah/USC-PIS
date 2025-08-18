from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import user_management_views

router = DefaultRouter()
router.register(r'profile', views.ProfileViewSet, basename='profile')

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('debug-register/', views.debug_register, name='debug-register'),
    path('debug-current-user/', views.debug_current_user, name='debug-current-user'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('check-email/', views.check_email, name='check-email'),
    path('change-password/', views.change_password, name='change-password'),
    path('database-health/', views.database_health_check, name='database-health'),
    path('complete-profile/', views.CompleteProfileSetupView.as_view(), name='complete-profile'),
    
    # Password Reset URLs
    path('password-reset-request/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'), # Traditional Django style path
    # Or, if we handle token/uid extraction purely in the view from POST data:
    # path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # User Management URLs (Admin only)
    path('admin/users/', user_management_views.get_all_users, name='admin-users'),
    path('admin/users/<int:user_id>/', user_management_views.get_user_details, name='admin-user-details'),
    path('admin/users/<int:user_id>/role/', user_management_views.update_user_role, name='admin-update-role'),
    path('admin/users/<int:user_id>/status/', user_management_views.toggle_user_status, name='admin-toggle-status'),
    path('admin/users/<int:user_id>/delete/', user_management_views.delete_user, name='admin-delete-user'),

    path('', include(router.urls)),
] 