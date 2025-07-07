"""
Custom middleware for production API handling
"""
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import json


class APIResponseMiddleware(MiddlewareMixin):
    """
    Middleware to ensure API endpoints always return JSON responses
    and handle CORS preflight requests properly
    """
    
    def process_request(self, request):
        # Handle preflight OPTIONS requests for CORS
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            response = JsonResponse({'status': 'ok'})
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', '*')
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
        return None
    
    def process_response(self, request, response):
        # Ensure API responses have proper headers
        if request.path.startswith('/api/'):
            # Set JSON content type for API responses
            if not response.get('Content-Type'):
                response['Content-Type'] = 'application/json'
            
            # Add CORS headers
            origin = request.META.get('HTTP_ORIGIN')
            if origin:
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
        
        return response


class HealthCheckMiddleware(MiddlewareMixin):
    """
    Middleware to handle health check requests
    """
    
    def process_request(self, request):
        if request.path == '/health' or request.path == '/api/health':
            return JsonResponse({
                'status': 'healthy',
                'message': 'USC-PIS API is running',
                'version': '1.0.0'
            })
        return None 