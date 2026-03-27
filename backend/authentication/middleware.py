from django.http import JsonResponse
from django.urls import reverse
from rest_framework import status

class EmailVerificationMiddleware:
    """
    Enforces mandatory email verification for all authenticated users.
    Exempts superusers and specific authentication/verification endpoints.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Paths that are always allowed (substring match)
        self.exempt_prefixes = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/verify-email/',
            '/api/auth/resend-code/',
            '/api/auth/logout/',
            '/api/auth/password-reset/',
            '/admin/',
            '/api/health/',
            '/api/utils/email/',
            '/api/utils/health/',
        ]

    def __call__(self, request):
        if request.user.is_authenticated:
            # 1. Exempt Super Admin
            if request.user.is_superuser:
                return self.get_response(request)

            # 2. Check if user is verified
            if not request.user.is_verified:
                # Allow access to exempt paths
                path = request.path
                if not any(path.startswith(prefix) for prefix in self.exempt_prefixes):
                    return JsonResponse(
                        {
                            'detail': 'Email verification required.',
                            'is_verified': False,
                            'code': 'VERIFICATION_REQUIRED'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

        return self.get_response(request)
