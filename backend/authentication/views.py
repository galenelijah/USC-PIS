from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import logging
import traceback

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            password2 = request.data.get('password2')

            logger.info(f"Registration attempt for email: {email}")

            if not email or not password or not password2:
                return Response(
                    {'detail': 'Please provide email and password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                return Response(
                    {'detail': 'Email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if password != password2:
                return Response(
                    {'detail': 'Passwords do not match'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            logger.info(f"User created successfully: {email}")
            return Response(
                {'detail': 'User created successfully'},
                status=status.HTTP_201_CREATED
            )
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
            # Log the entire request data for debugging
            logger.info(f"Login request data: {request.data}")

            email = request.data.get('username')  # Frontend sends email as username
            password = request.data.get('password')

            logger.info(f"Login attempt for email: {email}")

            if not email or not password:
                return Response(
                    {'detail': 'Please provide both email and password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # First check if user exists
                user = User.objects.get(username=email)
                logger.info(f"Found user with email: {email}")
            except User.DoesNotExist:
                logger.warning(f"No user found with email: {email}")
                return Response(
                    {'detail': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Try to authenticate
            authenticated_user = authenticate(username=email, password=password)
            logger.info(f"Authentication result for {email}: {authenticated_user is not None}")
            
            if authenticated_user is None:
                logger.warning(f"Authentication failed for email: {email}")
                return Response(
                    {'detail': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Create or get token
            token, created = Token.objects.get_or_create(user=authenticated_user)
            logger.info(f"Login successful for email: {email}")
            
            return Response({
                'token': token.key,
                'user_id': authenticated_user.pk,
                'email': authenticated_user.email
            })
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': 'An error occurred during login. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 