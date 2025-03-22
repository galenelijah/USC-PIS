from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        if User.objects.filter(username=request.data.get('username')).exists():
            return Response({'detail': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.data.get('password') != request.data.get('password2'):
            return Response({'detail': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=request.data.get('username'),
                email=request.data.get('email'),
                password=request.data.get('password')
            )
            return Response({'detail': 'User created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        logger.info(f"Login attempt for username: {username}")

        if username is None or password is None:
            return Response({'detail': 'Please provide both username and password'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Try to get the user first
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            logger.warning(f"Login failed: User {username} does not exist")
            return Response({'detail': 'Invalid credentials'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Now try to authenticate
        user = authenticate(username=username, password=password)
        
        if not user:
            logger.warning(f"Login failed: Invalid password for user {username}")
            return Response({'detail': 'Invalid credentials'},
                          status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        logger.info(f"Login successful for user {username}")
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        }) 