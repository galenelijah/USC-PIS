from django.shortcuts import render
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.http import StreamingHttpResponse, FileResponse
from django.conf import settings
import requests
import re
import os
from .models import UploadedFile, PatientDocument
from .serializers import UploadedFileSerializer, PatientDocumentSerializer
from .validators import FileSecurityValidator, FileIntegrityChecker, FilenameValidator
import logging

logger = logging.getLogger(__name__)

class FileUploadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows files to be viewed or uploaded.
    Requires authentication for all actions with comprehensive security validation.
    """
    queryset = UploadedFile.objects.all().order_by('-upload_date')
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        """Restrict to files uploaded by the user unless staff."""
        user = self.request.user
        if user.is_staff:
            return UploadedFile.objects.all().order_by('-upload_date')
        return UploadedFile.objects.filter(uploaded_by=user).order_by('-upload_date')

    def create(self, request, *args, **kwargs):
        """Enhanced secure file upload with validation."""
        try:
            if 'file' not in request.FILES:
                return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            
            # Security validation
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({'detail': 'File validation failed', 'errors': validation_errors}, 
                                status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    # Check for duplicates
                    existing_id = FileIntegrityChecker.check_duplicate_file(uploaded_file, request.user)
                    if existing_id:
                        return Response({
                            'detail': 'File already uploaded',
                            'file_id': existing_id
                        }, status=status.HTTP_200_OK)

                    instance = serializer.save(
                        uploaded_by=request.user,
                        original_filename=uploaded_file.name,
                        file_size=uploaded_file.size,
                        content_type=uploaded_file.content_type
                    )
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientDocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for patient documents (consultations, records, etc.)
    """
    queryset = PatientDocument.objects.all().order_by('-uploaded_at')
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def create(self, request, *args, **kwargs):
        # Restriction: Only non-students can upload
        if hasattr(request.user, 'role') and request.user.role in ['STUDENT', 'TEACHER']:
            return Response({
                'detail': 'Students and Teachers are not authorized to upload patient documents.'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            if 'file' not in request.FILES:
                return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            
            # Security validation
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({'detail': 'File validation failed', 'errors': validation_errors}, 
                                status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    doc_instance = serializer.save(
                        uploaded_by=request.user,
                        file=uploaded_file,
                        original_filename=uploaded_file.name,
                        file_size=uploaded_file.size,
                        content_type=uploaded_file.content_type
                    )
                    return Response(PatientDocumentSerializer(doc_instance).data, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Patient document upload error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        queryset = PatientDocument.objects.all().order_by('-uploaded_at')
        
        # Patients/Students/Teachers can only see their own documents
        if hasattr(user, 'role') and user.role in ['STUDENT', 'TEACHER']:
            from django.db.models import Q
            queryset = queryset.filter(Q(patient__user=user) | Q(uploaded_by=user))
        
        # Filter by patient_id if provided
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        # Filter by medical_record if provided
        medical_record = self.request.query_params.get('medical_record')
        if medical_record:
            queryset = queryset.filter(medical_record_id=medical_record)

        # Filter by dental_record if provided
        dental_record = self.request.query_params.get('dental_record')
        if dental_record:
            queryset = queryset.filter(dental_record_id=dental_record)
            
        return queryset

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Securely download a document.
        Uses the storage backend's open() method which handles authentication automatically.
        """
        document = self.get_object()
        
        # Security: get_object() already handles queryset filtering based on user permissions
        
        if not document.file:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            logger.info(f"Opening file for document {document.id} using storage backend")
            
            # Use Django's built-in file opening logic. 
            # If using CloudinaryStorage, this will fetch the file using API credentials automatically.
            # If using FileSystemStorage (local), it will read from local disk.
            file_handle = document.file.open('rb')
            
            # Create the response using FileResponse which is optimized for streaming
            proxy_response = FileResponse(
                file_handle, 
                content_type=document.content_type or 'application/octet-stream'
            )
                
            # Set headers to force download and name the file correctly
            filename = document.original_filename or f"document_{document.id}"
            # Ensure filename has extension if missing
            if '.' not in filename and document.content_type:
                import mimetypes
                ext = mimetypes.guess_extension(document.content_type)
                if ext:
                    filename += ext
                    
            proxy_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            proxy_response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            return proxy_response
            
        except Exception as e:
            logger.error(f"Download error for document {document.id}: {str(e)}")
            return Response({'detail': f'Error processing download: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
