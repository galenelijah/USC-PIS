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
        email = request.data.get('email')
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.data.get('password') != request.data.get('password2'):
            return Response({'detail': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
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
        email = request.data.get('username')  # Frontend sends email as username
        password = request.data.get('password')

        logger.info(f"Login attempt for email: {email}")

        if email is None or password is None:
            return Response({'detail': 'Please provide both email and password'},
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            # Find user by email (which is also username)
            user = User.objects.get(email=email)
            # Authenticate with email as username
            authenticated_user = authenticate(username=email, password=password)
            
            if authenticated_user is None:
                logger.warning(f"Login failed: Invalid password for email {email}")
                return Response({'detail': 'Invalid credentials'},
                              status=status.HTTP_401_UNAUTHORIZED)

            token, _ = Token.objects.get_or_create(user=authenticated_user)
            logger.info(f"Login successful for email {email}")
            
            return Response({
                'token': token.key,
                'user_id': authenticated_user.pk,
                'email': authenticated_user.email
            })
            
        except User.DoesNotExist:
            logger.warning(f"Login failed: No user with email {email}")
            return Response({'detail': 'Invalid credentials'},
                          status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({'detail': 'An error occurred during login'},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR) 