from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile', views.ProfileViewSet, basename='profile')

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('check-email/', views.check_email, name='check-email'),
    path('change-password/', views.change_password, name='change-password'),
    path('database-health/', views.database_health_check, name='database-health'),
    path('', include(router.urls)),
] 