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
        """
        document = self.get_object()
        
        if not document.file:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            file_url = document.file.url
            is_pdf = document.original_filename and document.original_filename.lower().endswith('.pdf')
            
            # If it's a Cloudinary URL, we need to handle signing correctly
            if 'res.cloudinary.com' in file_url and settings.USE_CLOUDINARY:
                import cloudinary.utils
                
                # Cloudinary is picky. If a PDF is in /image/, it needs image signing.
                # If it's in /raw/, it needs raw signing.
                res_type = 'raw' if '/raw/' in file_url else 'image'
                
                # Extract public_id and version
                path_match = re.search(r'/(?:upload|private|authenticated)/(?:v(\d+)/)?(.+)$', file_url)
                if path_match:
                    version = path_match.group(1)
                    public_id = path_match.group(2)
                    fmt = None
                    
                    # Extension logic for signing
                    if res_type == 'image':
                        if '.' in public_id:
                            public_id, fmt = public_id.rsplit('.', 1)
                        elif is_pdf:
                            fmt = 'pdf'
                    else:
                        # Raw assets need the extension in the ID
                        if is_pdf and not public_id.lower().endswith('.pdf'):
                            public_id = f"{public_id}.pdf"
                    
                    logger.info(f"Generating signature: ID={public_id}, Type={res_type}, Fmt={fmt}, Ver={version}")
                    file_url = cloudinary.utils.cloudinary_url(
                        public_id, 
                        sign_url=True, 
                        resource_type=res_type,
                        version=version,
                        format=fmt,
                        secure=True
                    )[0]

            # Fetch and stream
            headers = {'User-Agent': 'Mozilla/5.0'}
            # Use a clean session to avoid Auth token leakage
            with requests.Session() as session:
                session.headers.clear()
                response = session.get(file_url, stream=True, timeout=30, headers=headers)
                
                # 404 Fallback for PDFs (adding .pdf)
                if response.status_code == 404 and is_pdf and '.pdf' not in file_url:
                    response = session.get(f"{file_url}.pdf", stream=True, timeout=30, headers=headers)
                
                if response.status_code != 200:
                    return Response({
                        'detail': f'Storage error: {response.status_code}',
                        'url': 'hidden'
                    }, status=status.HTTP_502_BAD_GATEWAY)

                proxy_response = StreamingHttpResponse(
                    response.iter_content(chunk_size=8192),
                    content_type=document.content_type or response.headers.get('Content-Type', 'application/octet-stream')
                )
                
            filename = document.original_filename or f"document_{document.id}"
            proxy_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            proxy_response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return proxy_response
            
        except Exception as e:
            logger.error(f"Download error: {str(e)}")
            return Response({'detail': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
