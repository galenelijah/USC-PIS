from django.shortcuts import render
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from django.db import transaction
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

    def create(self, request, *args, **kwargs):
        """Enhanced file upload with comprehensive security validation."""
        try:
            if 'file' not in request.FILES:
                return Response({
                    'detail': 'No file provided',
                    'error_code': 'NO_FILE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            filename_errors = FilenameValidator.validate_filename(uploaded_file.name)
            if filename_errors:
                return Response({
                    'detail': 'Invalid filename',
                    'errors': filename_errors,
                    'error_code': 'INVALID_FILENAME'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            safe_filename = FilenameValidator.sanitize_filename(uploaded_file.name)
            if safe_filename != uploaded_file.name:
                uploaded_file.name = safe_filename
            
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({
                    'detail': 'File validation failed',
                    'errors': validation_errors,
                    'error_code': 'VALIDATION_FAILED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            checksum = FileIntegrityChecker.generate_checksum(uploaded_file)
            
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    file_instance = serializer.save(
                        uploaded_by=request.user,
                        file=uploaded_file,
                        original_filename=uploaded_file.name,
                        file_size=uploaded_file.size,
                        checksum=checksum
                    )
                    return Response({
                        'detail': 'File uploaded successfully',
                        'file': UploadedFileSerializer(file_instance).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        queryset = UploadedFile.objects.all().order_by('-upload_date')
        if hasattr(user, 'role') and user.role in ['STUDENT', 'TEACHER']:
            queryset = queryset.filter(uploaded_by=user)
        return queryset

class PatientDocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing patient-specific documents.
    Only staff, doctors, and nurses can upload.
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
