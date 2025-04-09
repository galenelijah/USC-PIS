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
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"User created successfully: {user.email}")
                return Response(
                    {'detail': 'User created successfully'},
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration error: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': 'Registration failed'},
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