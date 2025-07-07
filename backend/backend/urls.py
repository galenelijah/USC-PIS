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
from django.http import JsonResponse
import json

def api_health_check(request):
    """Health check endpoint for API"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'USC-PIS API is running',
        'version': '1.0.0'
    })

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API health check
    path('api/health/', api_health_check, name='api_health_check'),
    
    # API endpoints - these must come before catch-all
    path('api/auth/', include('authentication.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/health-info/', include('health_info.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/files/', include('file_uploads.urls')),
    path('api/medical-certificates/', include('medical_certificates.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/system/', include('utils.urls')),
    
    # Media files serving
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # Static files for production (handled by WhiteNoise in middleware)
    
    # React app routes - serve index.html for non-API routes only
    # This pattern specifically excludes /api/ routes
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]

# Development-only URL patterns
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
