from django.http import JsonResponse
from django.urls import resolve, Resolver404
import threading

_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_ip():
    return getattr(_thread_locals, 'ip', None)

def get_current_user_agent():
    return getattr(_thread_locals, 'user_agent', None)

def get_current_path():
    return getattr(_thread_locals, 'path', None)

def get_current_method():
    return getattr(_thread_locals, 'method', None)

def clear_audit_context():
    """ 
    Explicitly clear the audit trail context from thread locals.
    Used for background tasks (Celery/Management Commands) to prevent 
    context leakage from previous HTTP requests in the same thread.
    """
    for attr in ['user', 'ip', 'user_agent', 'path', 'method']:
        if hasattr(_thread_locals, attr):
            delattr(_thread_locals, attr)

class EmailVerificationMiddleware:
    """
    Middleware that enforces email verification (MFA) for authenticated users.
    Blocks access to sensitive clinical endpoints if user.is_verified is False.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Define paths that are exempt from the verification check
        self.exempt_paths = [
            'login', 'register', 'verify_email', 'resend_code', 
            'logout', 'get-csrf-token', 'password-reset-request',
            'password-reset-confirm', 'password-reset-confirm-post',
            'check-email', 'database-health', 'debug-current-user'
        ]

    def __call__(self, request):
        # 1. Skip check for unauthenticated users (they are handled by DRF permissions)
        # 2. Skip check for admin/staff/clinical users if needed? (Requirement says "any user")
        # 3. Only check if path is in /api/
        
        if request.user.is_authenticated and not request.user.is_verified:
            path = request.path_info
            
            # Check if this is an API request
            if path.startswith('/api/'):
                try:
                    match = resolve(path)
                    url_name = match.url_name
                    
                    # If not exempt, block with 403
                    if url_name not in self.exempt_paths:
                        return JsonResponse({
                            'error': 'Email verification required',
                            'code': 'VERIFICATION_REQUIRED',
                            'is_verified': False
                        }, status=403)
                except Resolver404:
                    pass

        return self.get_response(request)

class AuditLogMiddleware:
    """
    Middleware to capture current user and request context for audit logging.
    Stores context in thread-local storage accessible by signals.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        _thread_locals.ip = self.get_client_ip(request)
        _thread_locals.user_agent = request.META.get('HTTP_USER_AGENT', '')
        _thread_locals.path = request.path_info
        _thread_locals.method = request.method
        
        response = self.get_response(request)
        
        # Clean up to prevent memory leaks or cross-thread contamination
        if hasattr(_thread_locals, 'user'):
            del _thread_locals.user
        if hasattr(_thread_locals, 'ip'):
            del _thread_locals.ip
        if hasattr(_thread_locals, 'user_agent'):
            del _thread_locals.user_agent
        if hasattr(_thread_locals, 'path'):
            del _thread_locals.path
        if hasattr(_thread_locals, 'method'):
            del _thread_locals.method
            
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
