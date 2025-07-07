"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),  # Authentication endpoints
    path('api/patients/', include('patients.urls')),
    path('api/health-info/', include('health_info.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/files/', include('file_uploads.urls')), # Add file_uploads URLs
    path('api/medical-certificates/', include('medical_certificates.urls')),
    path('api/reports/', include('reports.urls')),  # Add comprehensive reports URLs
    # path('api/notifications/', include('notifications.urls')),  # Add notifications URLs
    path('api/system/', include('utils.urls')),  # Add system monitoring URLs
    # Add media URL pattern to serve uploaded files
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    # Serve static files - Removed re_path, Whitenoise handles this via middleware/storage
    # re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    # Serve React app - must be last
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
