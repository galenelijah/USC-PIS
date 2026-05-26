import threading

_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_ip():
    return getattr(_thread_locals, 'ip', None)

def get_current_user_agent():
    return getattr(_thread_locals, 'user_agent', None)

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
        
        response = self.get_response(request)
        
        # Clean up to prevent memory leaks or cross-thread contamination
        if hasattr(_thread_locals, 'user'):
            del _thread_locals.user
        if hasattr(_thread_locals, 'ip'):
            del _thread_locals.ip
        if hasattr(_thread_locals, 'user_agent'):
            del _thread_locals.user_agent
            
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
