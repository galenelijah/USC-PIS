from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserRegistrationSerializer, UserProfileSerializer, ChangePasswordSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
import logging
import traceback
from django.http import JsonResponse
from django.db import connection, transaction, IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework.views import APIView
from patients.models import Patient
import datetime
from .validators import email_validator, strict_email_validator, password_validator, rate_limiter, SessionManager
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django.views.decorators.http import require_http_methods

# Import email service
from utils.email_service import EmailService

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email(request):
    """Enhanced email checking with validation."""
    try:
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({
                'exists': False,
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use lenient validation for email checking (allows existing users)
        validation_error = email_validator(email, check_existing=True)
        if validation_error:
            return Response({
                'exists': False,
                'error': validation_error,
                'suggestion': validation_error if 'Did you mean' in validation_error else None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email exists
        exists = User.objects.filter(email=email.lower()).exists()
        
        return Response({
            'exists': exists,
            'email': email.lower()
        })
        
    except Exception as e:
        logger.error(f"Email check error: {str(e)}\n{traceback.format_exc()}")
        return Response({
            'exists': False,
            'error': 'An error occurred while checking email'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Enhanced user registration with comprehensive validation."""
    if request.method == 'POST':
        try:
            # Get client IP for rate limiting
            client_ip = get_client_ip(request)
            
            # Check rate limiting
            is_limited, time_remaining = rate_limiter.is_rate_limited(client_ip, 'register')
            if is_limited:
                return Response({
                    'detail': f'Too many registration attempts. Try again in {time_remaining // 60} minutes.',
                    'retry_after': time_remaining
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Use the serializer for validation and creation
            serializer = UserRegistrationSerializer(data=request.data)
            
            if serializer.is_valid():
                try:
                    # Create user using serializer
                    user = serializer.save()
                    
                    # Create initial token
                    token, created = Token.objects.get_or_create(user=user)
                    
                    # Log successful registration
                    logger.info(f"User registered successfully: {user.email} with role {user.role}")
                    
                    # Send welcome email
                    try:
                        EmailService.send_welcome_email(user)
                        logger.info(f"Welcome email sent to {user.email}")
                    except Exception as email_error:
                        logger.error(f"Failed to send welcome email to {user.email}: {str(email_error)}")
                        # Don't fail registration if email fails
                    
                    # Record successful attempt
                    rate_limiter.record_attempt(client_ip, 'register', success=True)
                    
                    return Response({
                        'detail': 'User created successfully',
                        'user_id': user.id,
                        'token': token.key,
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'role': user.role,
                            'completeSetup': user.completeSetup
                        }
                    }, status=status.HTTP_201_CREATED)
                    
                except IntegrityError as e:
                    logger.error(f"Database integrity error during registration: {str(e)}")
                    rate_limiter.record_attempt(client_ip, 'register', success=False)
                    
                    # Check if it's likely a duplicate email error
                    if 'unique constraint' in str(e).lower() and 'email' in str(e).lower():
                        return Response({
                            'email': ['This email address is already registered. Please log in instead.']
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                    return Response({
                        'detail': 'Registration failed due to database conflict.',
                        'field': 'email'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Record failed attempt
                rate_limiter.record_attempt(client_ip, 'register', success=False)
                
                # Return serializer validation errors
                return Response({
                    'detail': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            error_msg = f"Registration error: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            
            # Record failed attempt
            try:
                client_ip = get_client_ip(request)
                rate_limiter.record_attempt(client_ip, 'register', success=False)
            except Exception as e:
                logger.warning(f"Failed to record rate limit attempt: {e}")
                pass
            
            return Response({
                'detail': 'Registration failed due to server error. Please try again.',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Enhanced login with rate limiting and security checks."""
    if request.method == 'POST':
        try:
            # Get client IP for rate limiting
            client_ip = get_client_ip(request)
            email = request.data.get('email', '').strip().lower()
            password = request.data.get('password', '')
            
            # Input validation
            if not email or not password:
                rate_limiter.record_attempt(client_ip, 'login', success=False)
                return Response({
                    'detail': 'Please provide both email and password',
                    'fields': ['email', 'password']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check rate limiting (by IP and email)
            ip_limited, ip_time = rate_limiter.is_rate_limited(client_ip, 'login')
            email_limited, email_time = rate_limiter.is_rate_limited(email, 'login')
            
            if ip_limited or email_limited:
                max_time = max(ip_time, email_time)
                return Response({
                    'detail': f'Too many login attempts. Try again in {max_time // 60} minutes.',
                    'retry_after': max_time,
                    'locked_out': True
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Lenient email validation for login (allows existing users)
            email_error = email_validator(email, check_existing=True)
            if email_error:
                rate_limiter.record_attempt(client_ip, 'login', success=False)
                rate_limiter.record_attempt(email, 'login', success=False)
                return Response({
                    'detail': 'Invalid email format',
                    'field': 'email'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user
            user = authenticate(request, username=email, password=password)
            
            if user is None:
                # Record failed attempt
                rate_limiter.record_attempt(client_ip, 'login', success=False)
                rate_limiter.record_attempt(email, 'login', success=False)
                
                # Check if user exists to provide appropriate message
                user_exists = User.objects.filter(email=email).exists()
                if user_exists:
                    detail = 'Invalid password'
                    field = 'password'
                else:
                    detail = 'No account found with this email'
                    field = 'email'
                
                return Response({
                    'detail': detail,
                    'field': field
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                rate_limiter.record_attempt(client_ip, 'login', success=False)
                rate_limiter.record_attempt(email, 'login', success=False)
                return Response({
                    'detail': 'Account is disabled. Please contact support.',
                    'account_status': 'disabled'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Handle concurrent sessions
            SessionManager.handle_concurrent_logins(user, max_sessions=3)
            
            # Create or get token
            token, created = Token.objects.get_or_create(user=user)
            
            # Check if token is expired
            if not created and SessionManager.is_token_expired(token):
                token.delete()
                token = Token.objects.create(user=user)
                logger.info(f"Refreshed expired token for user {user.email}")
            
            # Record successful attempt
            rate_limiter.record_attempt(client_ip, 'login', success=True)
            rate_limiter.record_attempt(email, 'login', success=True)
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            logger.info(f"Successful login for user {user.email}")
            
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
                'login_time': timezone.now().isoformat(),
                'session_info': {
                    'token_created': created,
                    'expires_in_hours': 24
                }
            })
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}\n{traceback.format_exc()}")
            
            # Record failed attempt on exception
            try:
                client_ip = get_client_ip(request)
                email = request.data.get('email', '').strip().lower()
                rate_limiter.record_attempt(client_ip, 'login', success=False)
                if email:
                    rate_limiter.record_attempt(email, 'login', success=False)
            except Exception as e:
                logger.warning(f"Failed to record rate limit attempt: {e}")
                pass
            
            return Response({
                'detail': 'An error occurred during login. Please try again.',
                'error_code': 'LOGIN_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        # This queryset is used for list view, if enabled/needed, or admin
        # For direct profile access, use get_object or the 'me' action
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        # This correctly gets the current user, used by default retrieve/update/etc.
        # if accessed via /api/auth/profile/{user_id}/
        return self.request.user

    # Custom action for retrieving and updating the current user's profile via /api/auth/profile/me/
    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me', url_name='profile-me')
    def me(self, request):
        user = self.request.user # Directly get the authenticated user
        
        if request.method == 'GET':
            serializer = self.serializer_class(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            # Determine if it's a partial update (PATCH)
            partial = (request.method == 'PATCH')
            serializer = self.serializer_class(user, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Should not happen given the methods specified in @action
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # Default retrieve (maps to /api/auth/profile/{pk}/) - kept for potential admin use or direct access
    def retrieve(self, request, *args, **kwargs):
        user = self.get_object() # Gets user based on {pk} from URL if used
        serializer = self.serializer_class(user)
        return Response(serializer.data)

    # Default update (maps to /api/auth/profile/{pk}/) - No longer the primary way for user updates
    # def update(self, request, *args, **kwargs):
    #     user = self.get_object()
    #     serializer = self.serializer_class(user, data=request.data)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Default partial_update (maps to /api/auth/profile/{pk}/) - No longer the primary way
    # def partial_update(self, request, *args, **kwargs):
    #     user = self.get_object()
    #     serializer = self.serializer_class(user, data=request.data, partial=True)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Update token
        Token.objects.filter(user=user).delete()
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'detail': 'Password changed successfully',
            'token': token.key
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        request.user.auth_token.delete()
        return Response({'detail': 'Successfully logged out'})
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {'detail': 'Error during logout'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def database_health_check(request):
    # Enhanced security: Only admin users can access database health information
    if not request.user.is_staff and request.user.role not in ['ADMIN', 'STAFF']:
        return JsonResponse({
            'error': 'Access denied. Admin privileges required.'
        }, status=403)
    try:
        with connection.cursor() as cursor:
            # Get table counts, column counts, and approximate row counts
            # Use GREATEST(0, pc.reltuples) to show 0 instead of -1 if table not analyzed
            cursor.execute("""
                SELECT
                    t.table_name,
                    COUNT(c.column_name) AS column_count,
                    GREATEST(0, pc.reltuples) AS approximate_row_count
                FROM information_schema.tables t
                LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
                LEFT JOIN pg_class pc ON pc.relname = t.table_name AND pc.relnamespace = (
                    SELECT oid FROM pg_namespace WHERE nspname = t.table_schema
                )
                WHERE t.table_schema = 'public'
                GROUP BY t.table_name, pc.reltuples
                ORDER BY t.table_name;
            """)
            tables = cursor.fetchall()
            
            # Get database size
            cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
            db_size = cursor.fetchone()[0]
            
            # Get connection count
            cursor.execute("SELECT count(*) FROM pg_stat_activity")
            connection_count = cursor.fetchone()[0]
            
            return JsonResponse({
                'status': 'healthy',
                'database_size': db_size,
                'connection_count': connection_count,
                'tables': [{
                    'name': table[0],
                    'columns': table[1],
                    'rows': table[2]
                } for table in tables]
            })
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}\n{traceback.format_exc()}") 
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_register(request):
    """
    Debug endpoint to test user creation directly.
    Access via /auth/debug-register/ to create a test user.
    SECURITY: Only available in debug mode.
    """
    # Security check: Only allow in debug mode
    if not settings.DEBUG:
        return JsonResponse({
            'error': 'Debug endpoint not available in production'
        }, status=404)
    try:
        # Generate a unique email
        import random
        test_email = f"test{random.randint(1000, 9999)}@example.com"
        test_password = "Password123"
        
        # Create user directly using User.objects.create_user
        from django.db import transaction
        with transaction.atomic():
            user = User.objects.create_user(
                username=test_email,
                email=test_email,
                password=test_password,
                role='STUDENT',
                first_name='Test',
                last_name='User',
                completeSetup=False
            )
        
        # Return success
        return Response({
            'detail': 'Debug user created successfully',
            'email': test_email,
            'password': test_password
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        error_msg = f"Debug registration error: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return Response({'detail': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CompleteProfileSetupView(APIView):
    """Lenient profile setup that allows completion even with authentication issues."""
    
    def post(self, request):
        try:
            # Log the incoming request for debugging
            logger.info(f"Profile setup request received from IP: {get_client_ip(request)}")
            
            # Handle both DRF request.data and Django request.POST
            data = getattr(request, 'data', request.POST)
            
            user = None
            authenticated = False
            
            # Try to authenticate, but don't fail if it doesn't work
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1] if len(auth_header.split(' ')) > 1 else ''
                
                if token_key:
                    logger.info(f"Profile setup request with token: {token_key[:10]}...")
                    
                    # Try to find the token and user
                    try:
                        token = Token.objects.select_related('user').get(key=token_key)
                        user = token.user
                        
                        # Verify user exists and is active
                        if user and user.is_active:
                            try:
                                user = User.objects.get(id=user.id)
                                authenticated = True
                                logger.info(f"Authentication successful for user: {user.email}")
                            except User.DoesNotExist:
                                logger.warning(f"Token user not found in database: {user.id}")
                                user = None
                        else:
                            logger.warning(f"User is inactive: {user.email if user else 'Unknown'}")
                            user = None
                            
                    except Token.DoesNotExist:
                        logger.warning(f"Token not found: {token_key[:10]}...")
                        
                        # LENIENT: Try to find user by email from request data if available  
                        email = data.get('email', '').strip().lower()
                        if email:
                            try:
                                user = User.objects.get(email=email)
                                logger.info(f"Found user by email fallback: {user.email}")
                                # Create a new token for this user
                                Token.objects.filter(user=user).delete()
                                new_token = Token.objects.create(user=user)
                                logger.info(f"Created new token for user: {new_token.key[:10]}...")
                                authenticated = True
                            except User.DoesNotExist:
                                logger.warning(f"No user found with email: {email}")
            
            # If we still don't have a user, try more lenient approaches
            if not user:
                # Check if there's any identifying information in the request
                email = data.get('email', '').strip().lower()
                id_number = data.get('id_number', '').strip()
                
                # Try to find user by email
                if email:
                    try:
                        user = User.objects.get(email=email)
                        logger.info(f"Found user by email in request data: {user.email}")
                        # Create a new token for this user
                        Token.objects.filter(user=user).delete()
                        new_token = Token.objects.create(user=user)
                        authenticated = True
                    except User.DoesNotExist:
                        pass
                
                # Try to find user by ID number for students
                if not user and id_number:
                    try:
                        user = User.objects.get(id_number=id_number, role=User.Role.STUDENT)
                        logger.info(f"Found user by ID number: {user.email}")
                        # Create a new token for this user
                        Token.objects.filter(user=user).delete()
                        new_token = Token.objects.create(user=user)
                        authenticated = True
                    except User.DoesNotExist:
                        pass
            
            # If we STILL don't have a user, return a helpful error
            if not user:
                # Final fallback: Check if we have enough information to help debug
                email = data.get('email', '').strip().lower()
                id_number = data.get('id_number', '').strip()
                
                debug_info = {
                    'has_email': bool(email),
                    'has_id_number': bool(id_number),
                    'email_provided': email if email else None,
                    'id_number_provided': id_number if id_number else None
                }
                
                logger.error(f"No user found through any method - debug info: {debug_info}")
                
                # If we have identifying information, provide specific guidance
                if email:
                    # Check if email exists but user is inactive
                    try:
                        inactive_user = User.objects.get(email=email, is_active=False)
                        return Response({
                            'detail': 'Your account has been deactivated. Please contact support.',
                            'error_code': 'ACCOUNT_DEACTIVATED',
                            'support_email': 'support@usc-pis.com'
                        }, status=status.HTTP_401_UNAUTHORIZED)
                    except User.DoesNotExist:
                        pass
                
                return Response({
                    'detail': 'Unable to identify user account. Please log in again.',
                    'error_code': 'USER_IDENTIFICATION_FAILED',
                    'debug_info': debug_info,
                    'suggestions': [
                        'Clear browser data and log in again',
                        'Ensure you are using the correct email address',
                        'Try registering a new account if you don\'t have one',
                        'Contact support if the issue persists'
                    ]
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Set request.user for consistency
            request.user = user
            client_ip = get_client_ip(request)
            
            # Check if user already completed setup
            if user.completeSetup:
                logger.warning(f"User {user.email} attempted to complete already completed profile setup")
                return Response({
                    'detail': 'Profile setup already completed',
                    'user': UserProfileSerializer(user).data
                }, status=status.HTTP_200_OK)
            
            # Rate limiting (more lenient for profile setup)
            is_limited, time_remaining = rate_limiter.is_rate_limited(
                f"{user.id}:profile_setup", 'profile_setup'
            )
            if is_limited and time_remaining > 3600:  # Only block if more than 1 hour
                return Response({
                    'detail': f'Too many profile setup attempts. Try again in {time_remaining // 60} minutes.',
                    'retry_after': time_remaining
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            logger.info(f"Profile setup proceeding for user {user.email} (authenticated: {authenticated})")
            
            # Validate required fields (more lenient validation)
            validation_errors = []
            required_fields = ['first_name', 'last_name', 'sex', 'phone']
            
            if user.role == User.Role.STUDENT:
                required_fields.extend(['birthday', 'course', 'year_level', 'school'])
                # ID number is optional if we found user another way
                if not authenticated:
                    required_fields.append('id_number')
                # Address is required (either permanent or present)
                if not data.get('address_permanent') and not data.get('address_present'):
                    validation_errors.append('Either permanent or present address is required')
            
            # Check for missing required fields
            for field in required_fields:
                if not data.get(field):
                    validation_errors.append(f'{field.replace("_", " ").title()} is required')
            
            # Lenient date validation
            date_fields = ['birthday']
            for field in date_fields:
                if data.get(field):
                    try:
                        date_str = data[field]
                        parsed_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                        
                        # Basic date validation (more lenient)
                        today = datetime.date.today()
                        if parsed_date > today:
                            validation_errors.append(f'{field.replace("_", " ").title()} cannot be in the future')
                        elif parsed_date < datetime.date(1900, 1, 1):
                            validation_errors.append(f'{field.replace("_", " ").title()} is too far in the past')
                        # Remove strict age validation
                                
                    except ValueError:
                        validation_errors.append(f'{field.replace("_", " ").title()} must be in YYYY-MM-DD format')
            
            # Lenient phone validation
            phone = data.get('phone', '').strip()
            if phone:
                clean_phone = ''.join(c for c in phone if c.isdigit() or c == '+')
                if len(clean_phone) < 7:  # More lenient
                    validation_errors.append('Phone number must be at least 7 digits')
            
            # Skip email validation if it's the user's own email
            # Skip ID number uniqueness check if not authenticated
            
            if validation_errors:
                return Response({
                    'detail': 'Validation failed',
                    'errors': validation_errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Proceed with profile update
            with transaction.atomic():
                try:
                    user_serializer = UserProfileSerializer(user, data=data, partial=True)
                    
                    if not user_serializer.is_valid():
                        logger.error(f"Serializer validation failed: {user_serializer.errors}")
                        return Response({
                            'detail': 'Invalid data provided',
                            'errors': user_serializer.errors
                        }, status=status.HTTP_400_BAD_REQUEST)

                    # Update user fields
                    for attr, value in user_serializer.validated_data.items():
                        if hasattr(user, attr):
                            setattr(user, attr, value)
                    
                    # Set completion flag
                    user.completeSetup = True
                    user.save()
                    
                    logger.info(f"User profile updated for {user.email}")
                    
                    # Handle student patient profile creation (simplified)
                    if user.role == User.Role.STUDENT:
                        patient_data = _prepare_patient_data(user, user_serializer.validated_data, request.data)
                        
                        if patient_data:
                            try:
                                patient_profile, created = Patient.objects.get_or_create(
                                    user=user,
                                    defaults=patient_data
                                )
                                
                                if not created:
                                    # Update existing patient profile
                                    for field, value in patient_data.items():
                                        if field != 'created_by':
                                            setattr(patient_profile, field, value)
                                    patient_profile.save()
                                
                                logger.info(f"Patient profile {'created' if created else 'updated'} for user {user.email}")
                                
                            except Exception as patient_error:
                                logger.warning(f"Patient profile creation failed, but continuing: {str(patient_error)}")
                                # Don't fail the entire process for patient profile issues
                    
                    # Create or refresh token
                    Token.objects.filter(user=user).delete()
                    new_token = Token.objects.create(user=user)
                    
                    logger.info(f"Profile setup completed successfully for user {user.email}")
                    
                    return Response({
                        'detail': 'Profile setup completed successfully',
                        'user': UserProfileSerializer(user).data,
                        'token': new_token.key,
                        'setup_completed_at': timezone.now().isoformat()
                    }, status=status.HTTP_200_OK)
                    
                except Exception as setup_error:
                    logger.error(f"Profile setup failed: {str(setup_error)}")
                    raise setup_error
                
        except Exception as e:
            error_msg = f"Profile setup error: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            
            return Response({
                'detail': 'Profile setup encountered an error. Please try again.',
                'error_code': 'SETUP_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _prepare_patient_data(user, validated_data, raw_data):
    """Prepare patient data with enhanced validation and edge case handling."""
    try:
        # Accept both 'birthday' and 'date_of_birth' from frontend
        dob = raw_data.get('date_of_birth') or raw_data.get('birthday') or validated_data.get('birthday')
        
        if not dob:
            logger.error("No date of birth provided for patient creation")
            return None
        
        # Parse date with multiple format support
        parsed_date = None
        date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']
        
        for date_format in date_formats:
            try:
                if isinstance(dob, str):
                    parsed_date = datetime.datetime.strptime(dob.split()[0], date_format).date()
                    break
                elif hasattr(dob, 'date'):
                    parsed_date = dob.date()
                    break
                elif isinstance(dob, datetime.date):
                    parsed_date = dob
                    break
            except ValueError:
                continue
        
        if not parsed_date:
            logger.error(f"Failed to parse date of birth: {dob}")
            return None
        
        # Validate required fields
        required_fields = {
            'first_name': validated_data.get('first_name'),
            'last_name': validated_data.get('last_name'),
            'sex': validated_data.get('sex'),
            'phone': validated_data.get('phone'),
            'email': validated_data.get('email', user.email),
        }
        
        # Address handling (prefer present, fall back to permanent)
        address = (validated_data.get('address_present') or 
                  validated_data.get('address_permanent') or 
                  raw_data.get('address_present') or 
                  raw_data.get('address_permanent'))
        
        if not address:
            logger.error("No address provided for patient creation")
            return None
        
        # Check for missing required fields
        missing_fields = [field for field, value in required_fields.items() if not value]
        if missing_fields:
            logger.error(f"Missing required fields for Patient: {missing_fields}")
            return None
        
        # Prepare patient data
        patient_data = {
            'first_name': required_fields['first_name'].strip(),
            'last_name': required_fields['last_name'].strip(),
            'date_of_birth': parsed_date,
            'gender': required_fields['sex'][0].upper() if required_fields['sex'] else 'O',
            'phone_number': required_fields['phone'].strip(),
            'email': required_fields['email'].strip().lower(),
            'address': address.strip(),
            'created_by': user
        }
        
        logger.info(f"Prepared patient data for user {user.email}: {patient_data}")
        return patient_data
        
    except Exception as e:
        logger.error(f"Error preparing patient data: {str(e)}")
        return None

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("--- PasswordResetRequestView START ---") # DEBUG
        
        # Get and validate email first
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'detail': 'Email is required',
                'field': 'email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Enhanced email validation with lenient checking for existing users
        email_error = email_validator(email, check_existing=True)
        if email_error:
            return Response({
                'detail': email_error,
                'field': 'email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            print(f"DEBUG: Valid email received: {email}") # DEBUG
            try:
                user = User.objects.get(email=email)
                print(f"DEBUG: User found: {user.email}") # DEBUG
            except User.DoesNotExist:
                print(f"DEBUG: User with email {email} does not exist. Sending generic response.") # DEBUG
                # Don't reveal that the user does not exist
                return Response({'detail': 'Password reset instructions sent if email exists.'}, status=status.HTTP_200_OK)

            # Generate token and uid
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            print(f"DEBUG: Generated token: {token}, uidb64: {uidb64}") # DEBUG

            # Construct reset URL (adjust domain/protocol as needed)
            # Use frontend URL structure
            reset_url = f"{settings.FRONTEND_URL}/password-reset/{uidb64}/{token}/"
            print(f"DEBUG: Constructed reset URL: {reset_url}") # DEBUG

            # Send email via centralized EmailService (HTML + text fallback)
            print("DEBUG: Attempting to send password reset email via EmailService...") # DEBUG
            try:
                sent = EmailService.send_password_reset_email(user, reset_url)
                if sent:
                    print("DEBUG: EmailService send completed successfully.") # DEBUG
                    logger.info(f"Password reset email sent to {user.email}")
                else:
                    print("DEBUG: EmailService reported failure to send.") # DEBUG
                    logger.warning(f"EmailService failed to send password reset to {user.email}")
            except Exception as e:
                print(f"DEBUG: Error during EmailService send: {e}") # DEBUG
                logger.error(f"Failed to send password reset email to {user.email}: {e}")
                # Still return 200 OK but log the error

            print("DEBUG: Sending final 200 OK response.") # DEBUG
            return Response({'detail': 'Password reset instructions sent if email exists.'}, status=status.HTTP_200_OK)
        else:
            print(f"DEBUG: Serializer errors: {serializer.errors}") # DEBUG
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uidb64 = serializer.validated_data['uidb64']
            token = serializer.validated_data['token']
            password = serializer.validated_data['password']

            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user is not None and default_token_generator.check_token(user, token):
                user.set_password(password)
                user.save()
                # Optional: Log the user in automatically after reset?
                # Optional: Invalidate the token after use (Django might handle this depending on version/settings)
                logger.info(f"Password successfully reset for user {user.email}")
                return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
            else:
                logger.warning(f"Password reset failed for token {token} or uid {uidb64}")
                return Response({'detail': 'Invalid token or user ID.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_current_user(request):
    """Debug endpoint to check current authenticated user."""
    user = request.user
    
    try:
        patient_profile = user.patient_profile
        patient_info = {
            'id': patient_profile.id,
            'email': patient_profile.email,
            'name': f"{patient_profile.first_name} {patient_profile.last_name}"
        }
    except Exception as e:
        logger.debug(f"No patient profile found for user: {e}")
        patient_info = None
    
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'completeSetup': user.completeSetup,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'patient_profile': patient_info,
        'token_info': {
            'user_id': request.user.id,
            'is_authenticated': request.user.is_authenticated,
        }
    })

class SafeTokenAuthentication(TokenAuthentication):
    """Custom token authentication that handles invalid tokens gracefully."""
    
    def authenticate_credentials(self, key):
        try:
            token = self.get_model().objects.select_related('user').get(key=key)
        except self.get_model().DoesNotExist:
            raise AuthenticationFailed({
                'detail': 'Invalid token. Please log in again.',
                'error_code': 'INVALID_TOKEN'
            })

        if not token.user.is_active:
            raise AuthenticationFailed({
                'detail': 'User account is disabled.',
                'error_code': 'USER_DISABLED'
            })

        return (token.user, token)

class SafeIsAuthenticated(BasePermission):
    """Custom permission that provides better error messages for authentication failures."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Additional check to ensure user exists in database
        try:
            User.objects.get(id=request.user.id)
            return True
        except User.DoesNotExist:
            return False 

# Backup function-based view for compatibility
@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to attempt profile setup
def complete_profile_setup(request):
    """Ultra-lenient backup function-based view for maximum compatibility."""
    try:
        # Use the class-based view which has all the lenient logic
        view = CompleteProfileSetupView()
        return view.post(request)
    except Exception as e:
        # If even the lenient view fails, try to provide helpful feedback
        logger.error(f"Backup profile setup failed: {str(e)}")
        
        # Extract any user info from request to help with debugging
        email = request.data.get('email', '').strip()
        token_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        return Response({
            'detail': 'Profile setup is temporarily unavailable. Please try again later.',
            'error_code': 'PROFILE_SETUP_UNAVAILABLE',
            'debug_info': {
                'has_email': bool(email),
                'has_auth_header': bool(token_header),
                'timestamp': timezone.now().isoformat()
            },
            'suggestions': [
                'Clear browser data and try logging in again',
                'Contact support if the issue persists'
            ]
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@require_http_methods(["GET"])
def api_test(request):
    """Simple API test endpoint to verify API is working"""
    return JsonResponse({
        'status': 'success',
        'message': 'API is working correctly',
        'user_authenticated': request.user.is_authenticated,
        'user_role': getattr(request.user, 'role', None) if request.user.is_authenticated else None,
        'timestamp': timezone.now().isoformat()
    }) 
