from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserRegistrationSerializer, UserProfileSerializer, ChangePasswordSerializer
import logging
import traceback
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

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
                'user_id': user.pk,
                'email': user.email,
                'role': user.role,
                'completeSetup': user.completeSetup
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
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.serializer_class(user)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.serializer_class(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.serializer_class(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        # Check database connection
        with connection.cursor() as cursor:
            # Get table counts
            cursor.execute("""
                SELECT table_name, (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
                       (SELECT count(*) FROM information_schema.tables WHERE table_name = t.table_name) as row_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
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
            # Get the current user
            user = request.user
            
            # Log the received data for debugging
            print("Profile setup data:", request.data)
            
            # Update the user profile with submitted data
            user_serializer = UserProfileSerializer(user, data=request.data, partial=True)
            
            if user_serializer.is_valid():
                # Set completeSetup flag to True
                user_serializer.validated_data['completeSetup'] = True
                user_serializer.save()
                
                return Response({
                    'detail': 'Profile setup completed successfully',
                    'user': user_serializer.data
                }, status=status.HTTP_200_OK)
            else:
                print("Serializer errors:", user_serializer.errors)
                return Response({
                    'detail': 'Invalid data provided',
                    'errors': user_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Profile setup error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                'detail': f'An error occurred during profile setup: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 