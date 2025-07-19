import time
import logging
from django.conf import settings
from .system_monitors import performance_monitor

logger = logging.getLogger(__name__)

class SystemMonitoringMiddleware:
    """Middleware to automatically track request performance and system health."""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Start monitoring if enabled
        if getattr(settings, 'SYSTEM_MONITORING', True):
            try:
                from .system_monitors import start_all_monitoring
                start_all_monitoring()
                logger.info("System monitoring started via middleware")
            except Exception as e:
                logger.error(f"Failed to start system monitoring: {e}")
    
    def __call__(self, request):
        # Record start time
        start_time = time.time()
        
        # Process request
        response = self.get_response(request)
        
        # Calculate request time
        request_time = time.time() - start_time
        
        # Record performance metrics
        try:
            endpoint = request.path
            status_code = response.status_code
            
            performance_monitor.record_request(request_time, endpoint, status_code)
            
            # Log slow requests
            if request_time > 2.0:  # Log requests taking more than 2 seconds
                logger.warning(f"Slow request: {endpoint} took {request_time:.2f}s (Status: {status_code})")
                
        except Exception as e:
            logger.error(f"Performance monitoring error: {e}")
        
        return response

class SecurityHeadersMiddleware:
    """Middleware to add security headers to responses."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add Content Security Policy for production
        if not settings.DEBUG:
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' https://cdn.jsdelivr.net; "
                "style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "img-src 'self' data: https:; "
                "font-src 'self' data: https://fonts.gstatic.com; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
            response['Content-Security-Policy'] = csp_policy
        
        return response

class RequestLoggingMiddleware:
    """Middleware to log request information for debugging and monitoring."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log request start
        logger.info(f"Request: {request.method} {request.path} from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        # Process request
        response = self.get_response(request)
        
        # Log response
        logger.info(f"Response: {request.method} {request.path} -> {response.status_code}")
        
        return response

class DatabaseConnectionMiddleware:
    """Middleware to monitor database connection health."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            # Check database connection before processing request
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
            # Continue processing - don't block the request
        
        response = self.get_response(request)
        return response 