from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile', views.ProfileViewSet, basename='profile')

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('debug-register/', views.debug_register, name='debug-register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('check-email/', views.check_email, name='check-email'),
    path('change-password/', views.change_password, name='change-password'),
    path('database-health/', views.database_health_check, name='database-health'),
    path('complete-profile/', views.complete_profile_setup, name='complete-profile'),
    
    # Password Reset URLs
    path('password-reset-request/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'), # Traditional Django style path
    # Or, if we handle token/uid extraction purely in the view from POST data:
    # path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    path('', include(router.urls)),
] 