from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserRegistrationSerializer, UserProfileSerializer, ChangePasswordSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
import logging
import traceback
from django.http import JsonResponse
from django.db import connection
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

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email(request):
    email = request.data.get('email', '')
    exists = User.objects.filter(email=email).exists()
    return Response({'exists': exists})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        try:
            # Log the received data
            print("Registration request data:", request.data)
            
            # Get required fields from the request
            email = request.data.get('email')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            role = request.data.get('role', 'STUDENT')
            
            # Basic validation
            if not email or not password or not password2:
                return Response(
                    {'detail': 'Email, password, and password confirmation are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if password != password2:
                return Response(
                    {'detail': "Passwords don't match"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {'detail': 'A user with this email already exists.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user directly
            from django.db import transaction
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    role=role,
                    first_name='',  # Empty default
                    last_name='',   # Empty default
                    completeSetup=False
                )
            
            logger.info(f"User created successfully: {user.email}")
            return Response(
                {'detail': 'User created successfully'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            import traceback
            error_msg = f"Registration error: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            return Response(
                {'detail': f'Registration failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    if request.method == 'POST':
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            if not email or not password:
                return Response(
                    {'detail': 'Please provide both email and password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = authenticate(request, username=email, password=password)
            
            if user is None:
                return Response(
                    {'detail': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                return Response(
                    {'detail': 'Account is disabled'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data
            })
        except Exception as e:
            logger.error(f"Login error: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': 'An error occurred during login'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
    try:
        with connection.cursor() as cursor:
            # Get table counts, column counts, and approximate row counts
            # Use GREATEST(0, pc.reltuples) to show 0 instead of -1 if table not analyzed
            cursor.execute("""
                SELECT
                    t.table_name,
                    COUNT(c.column_name) AS column_count,
                    GREATEST(0, pc.reltuples)::bigint AS approximate_row_count
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
    """
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile_setup(request):
    if request.method == 'POST':
        try:
            user = request.user
            print("Profile setup data:", request.data)
            
            user_serializer = UserProfileSerializer(user, data=request.data, partial=True)
            
            if user_serializer.is_valid():
                # Set completeSetup flag to True directly on the user model and save
                for attr, value in user_serializer.validated_data.items():
                    setattr(user, attr, value)
                user.completeSetup = True
                user.save()

                updated_user = user  # Use the updated user instance

                # If the user is a STUDENT, update their Patient profile
                if updated_user.role == User.Role.STUDENT:
                    # Accept both 'birthday' and 'date_of_birth' from frontend
                    dob = request.data.get('date_of_birth') or request.data.get('birthday') or user_serializer.validated_data.get('birthday')
                    print(f"DEBUG: Received date_of_birth: {dob}")
                    required_fields = {
                        'first_name': user_serializer.validated_data.get('first_name'),
                        'last_name': user_serializer.validated_data.get('last_name'),
                        'date_of_birth': dob,
                        'sex': user_serializer.validated_data.get('sex'),
                        'phone': user_serializer.validated_data.get('phone'),
                        'email': user_serializer.validated_data.get('email', updated_user.email),
                        'address': user_serializer.validated_data.get('address_present') or user_serializer.validated_data.get('address_permanent')
                    }

                    # Convert date_of_birth string to Python date object
                    dob_str = required_fields['date_of_birth']
                    dob = None
                    if isinstance(dob_str, str):
                        try:
                            dob = datetime.datetime.strptime(dob_str, '%Y-%m-%d').date()
                        except Exception as e:
                            print(f"DEBUG: Failed to parse date_of_birth: {dob_str} ({e})")
                            dob = None
                    else:
                        dob = dob_str  # Already a date object
                    required_fields['date_of_birth'] = dob
                    print(f"DEBUG: Final date_of_birth value to save: {dob} (type: {type(dob)})")
                    # Check for missing required fields again
                    missing_fields = [field for field, value in required_fields.items() if not value]
                    if missing_fields:
                        print(f"Missing required fields for Patient: {missing_fields}")
                        return Response({
                            'detail': 'Missing or invalid required fields for patient profile',
                            'missing_fields': missing_fields
                        }, status=status.HTTP_400_BAD_REQUEST)

                    try:
                        patient_profile, created = Patient.objects.get_or_create(
                            user=updated_user,
                            defaults={
                                'first_name': required_fields['first_name'],
                                'last_name': required_fields['last_name'],
                                'date_of_birth': required_fields['date_of_birth'],
                                'gender': required_fields['sex'][0].upper(),
                                'phone_number': required_fields['phone'],
                                'email': required_fields['email'],
                                'address': required_fields['address'],
                            }
                        )
                        print(f"{'Created' if created else 'Updated'} patient profile for user {updated_user.email}")

                        # Map fields from UserProfileSerializer to Patient model (for updates)
                        patient_profile.first_name = required_fields['first_name']
                        patient_profile.last_name = required_fields['last_name']
                        patient_profile.date_of_birth = required_fields['date_of_birth']
                        patient_profile.gender = required_fields['sex'][0].upper()
                        patient_profile.phone_number = required_fields['phone']
                        patient_profile.email = required_fields['email']
                        patient_profile.address = required_fields['address']

                        # Save the patient profile
                        patient_profile.save()
                        print(f"Successfully saved patient profile: {patient_profile}")

                    except Exception as e:
                        print(f"Error saving patient profile: {str(e)}")
                        return Response({
                            'detail': f'Error saving patient profile: {str(e)}'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                return Response({
                    'detail': 'Profile setup completed successfully',
                    'user': UserProfileSerializer(updated_user).data
                }, status=status.HTTP_200_OK)
            else:
                print("Serializer errors:", user_serializer.errors)
                return Response({
                    'detail': 'Invalid data provided',
                    'errors': user_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import traceback
            error_msg = f"Profile setup error: {str(e)}"
            print(f"{error_msg}\n{traceback.format_exc()}")
            return Response({
                'detail': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("--- PasswordResetRequestView START ---") # DEBUG
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

            # Send email
            subject = 'Password Reset Request'
            message = render_to_string('emails/password_reset_email.html', {
                'user': user,
                'reset_url': reset_url,
            })
            print("DEBUG: Attempting to send email...") # DEBUG
            try:
                send_mail(
                    subject,
                    message, # Use HTML message as plain text for now, or use html_message arg
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                    # html_message=message # Uncomment if using HTML email
                )
                print("DEBUG: send_mail function completed.") # DEBUG
                logger.info(f"Password reset email sent to {user.email}")
            except Exception as e:
                print(f"DEBUG: Error during send_mail: {e}") # DEBUG
                logger.error(f"Failed to send password reset email to {user.email}: {e}")
                # Still return 200 OK but log the error
                # return Response({'detail': 'Error sending password reset email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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