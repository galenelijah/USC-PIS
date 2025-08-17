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


class SecurityHeadersMiddleware:
    """
    Middleware to add additional security headers to HTTP responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Add Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # Add HSTS header for production
        from django.conf import settings
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response


class APIVersionMiddleware:
    """
    Middleware to handle API versioning
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add API version to request if not present
        if request.path.startswith('/api/') and 'HTTP_ACCEPT' not in request.META:
            request.META['HTTP_ACCEPT'] = 'application/json; version=v1'
        
        response = self.get_response(request)
        
        # Add API version header to response
        if request.path.startswith('/api/'):
            response['API-Version'] = 'v1'
            response['X-API-Version'] = 'v1'
        
        return response


class RequestLoggingMiddleware:
    """
    Middleware to log API requests for monitoring
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import logging
        import time
        
        logger = logging.getLogger('api.requests')
        performance_logger = logging.getLogger('performance')
        start_time = time.time()
        
        # Log request
        if request.path.startswith('/api/'):
            logger.info(f"API Request: {request.method} {request.path} - User: {getattr(request.user, 'email', 'Anonymous')}")
        
        response = self.get_response(request)
        
        # Log response and performance metrics
        if request.path.startswith('/api/'):
            duration = time.time() - start_time
            logger.info(f"API Response: {response.status_code} - Duration: {duration:.3f}s")
            
            # Log slow requests (>1 second)
            if duration > 1.0:
                performance_logger.warning(f"Slow API request: {request.method} {request.path} - {duration:.3f}s - User: {getattr(request.user, 'email', 'Anonymous')}")
            
            # Log database query performance (if available)
            from django.db import connection
            if hasattr(connection, 'queries'):
                num_queries = len(connection.queries)
                if num_queries > 10:  # Log if more than 10 queries
                    performance_logger.warning(f"High query count: {request.path} - {num_queries} queries in {duration:.3f}s")
        
        return response


class RateLimitMiddleware:
    """
    Simple rate limiting middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_counts = {}
        self.request_times = {}

    def __call__(self, request):
        from django.conf import settings
        from django.http import HttpResponse
        import time
        
        # Only apply rate limiting if enabled
        if not getattr(settings, 'RATE_LIMIT_ENABLED', True):
            return self.get_response(request)
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        current_time = time.time()
        
        # Clean old entries (older than 1 hour)
        if client_ip in self.request_times:
            self.request_times[client_ip] = [
                req_time for req_time in self.request_times[client_ip] 
                if current_time - req_time < 3600
            ]
        
        # Initialize if not exists
        if client_ip not in self.request_times:
            self.request_times[client_ip] = []
        
        # Check rate limit (500 requests per hour for authenticated users, 100 for unauthenticated)
        max_requests = 500 if hasattr(request, 'user') and request.user.is_authenticated else 100
        
        if len(self.request_times[client_ip]) >= max_requests:
            return HttpResponse(
                '{"error": "Rate limit exceeded. Please try again later."}',
                status=429,
                content_type='application/json'
            )
        
        # Add current request
        self.request_times[client_ip].append(current_time)
        
        return self.get_response(request)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 