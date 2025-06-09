from django.shortcuts import render
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from django.db import transaction
from .models import UploadedFile
from .serializers import UploadedFileSerializer
from .validators import FileSecurityValidator, FileIntegrityChecker, FilenameValidator
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class FileUploadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows files to be viewed or uploaded.
    Requires authentication for all actions with comprehensive security validation.
    """
    queryset = UploadedFile.objects.all().order_by('-upload_date')
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Ensure support for file uploads (multipart/form-data)
    parser_classes = [parsers.MultiPartParser, parsers.FormParser] 

    def create(self, request, *args, **kwargs):
        """Enhanced file upload with comprehensive security validation."""
        try:
            # Check if file is provided
            if 'file' not in request.FILES:
                return Response({
                    'detail': 'No file provided',
                    'error_code': 'NO_FILE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            
            # Filename validation and sanitization
            filename_errors = FilenameValidator.validate_filename(uploaded_file.name)
            if filename_errors:
                return Response({
                    'detail': 'Invalid filename',
                    'errors': filename_errors,
                    'error_code': 'INVALID_FILENAME'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Sanitize filename
            safe_filename = FilenameValidator.sanitize_filename(uploaded_file.name)
            if safe_filename != uploaded_file.name:
                logger.info(f"Filename sanitized: '{uploaded_file.name}' -> '{safe_filename}'")
                uploaded_file.name = safe_filename
            
            # Comprehensive security validation
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({
                    'detail': 'File validation failed',
                    'errors': validation_errors,
                    'error_code': 'VALIDATION_FAILED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for duplicate files
            duplicate_file = FileIntegrityChecker.check_duplicate_file(uploaded_file, request.user)
            if duplicate_file:
                return Response({
                    'detail': 'Duplicate file detected',
                    'existing_file': duplicate_file,
                    'error_code': 'DUPLICATE_FILE'
                }, status=status.HTTP_409_CONFLICT)
            
            # Generate file checksum
            checksum = FileIntegrityChecker.generate_checksum(uploaded_file)
            
            # Create file record with transaction safety
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    # Save with additional metadata
                    file_instance = serializer.save(
                        uploaded_by=request.user,
                        file=uploaded_file,
                        original_filename=uploaded_file.name,
                        file_size=uploaded_file.size,
                        checksum=checksum
                    )
                    
                    logger.info(f"File uploaded successfully: {file_instance.id} by user {request.user.email}")
                    
                    return Response({
                        'detail': 'File uploaded successfully',
                        'file': UploadedFileSerializer(file_instance).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'detail': 'Invalid file data',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            return Response({
                'detail': 'An error occurred during file upload',
                'error_code': 'UPLOAD_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        """Associate the uploaded file with the current user."""
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        """
        Filter files based on user permissions.
        Students see only their own files, staff see all files.
        """
        user = self.request.user
        queryset = UploadedFile.objects.all().order_by('-upload_date')
        
        # Apply role-based filtering
        if hasattr(user, 'role'):
            if user.role == 'STUDENT':
                # Students see only their own uploads
                queryset = queryset.filter(uploaded_by=user)
            # Staff, doctors, nurses, and admins see all files
        else:
            # Fallback: users see only their own files
            queryset = queryset.filter(uploaded_by=user)
        
        # Optional username filter
        username = self.request.query_params.get('username')
        if username and user.is_staff:  # Only staff can filter by username
            queryset = queryset.filter(uploaded_by__username=username)
        
        return queryset 
