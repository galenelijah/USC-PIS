from django.shortcuts import render
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.http import StreamingHttpResponse, FileResponse
from django.conf import settings
import requests
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

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Securely download a document by proxying the request to the storage backend (e.g. Cloudinary).
        Forces download with Content-Disposition header.
        """
        document = self.get_object()
        
        # Security: get_object() already handles queryset filtering based on user permissions
        
        if not document.file:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
            
        file_url = document.file.url
        is_pdf = document.original_filename and document.original_filename.lower().endswith('.pdf')
        
        logger.info(f"Attempting secure download for document {document.id}. Original URL: {file_url}")
        
        try:
            # Determine if we should proxy from external URL or serve local file
            if file_url.startswith('http'):
                # Proxy from Cloudinary/S3
                # IMPORTANT: We MUST NOT pass the user's Auth token to Cloudinary.
                # Cloudinary will see an 'Authorization: Token xxx' header it doesn't recognize
                # and return a 401 Unauthorized, even if the file is public.
                external_headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                # Debug log to ensure no Auth token is leaking (only in logs, filtered for security)
                logger.info(f"Storage request headers: { {k: '***' if 'auth' in k.lower() else v for k, v in external_headers.items()} }")
                
                # Try the original URL first with CLEAN headers (no Auth token)
                # We use a fresh Session to ensure no headers leak from the incoming request
                with requests.Session() as session:
                    session.headers.clear()  # Force clear any default headers
                    response = session.get(file_url, stream=True, timeout=30, headers=external_headers)
                    
                    # If it's a PDF and we got a 404, try appending .pdf (common Cloudinary requirement for raw assets)
                    if response.status_code == 404 and is_pdf and not file_url.lower().endswith('.pdf'):
                        alt_url = f"{file_url}.pdf"
                        logger.info(f"Original URL 404ed, trying alternative PDF URL: {alt_url}")
                        response = session.get(alt_url, stream=True, timeout=30, headers=external_headers)
                        if response.status_code == 200:
                            file_url = alt_url
                
                if response.status_code != 200:
                    logger.error(f"External storage returned status {response.status_code} for {file_url}")
                    # Log first 100 chars of response body for debugging
                    try:
                        error_body = response.content[:100].decode('utf-8', errors='ignore')
                        logger.error(f"Storage error body: {error_body}")
                    except:
                        pass
                        
                    return Response({
                        'detail': f'Error retrieving file from storage (Status: {response.status_code})',
                        'storage_url': file_url if settings.DEBUG else 'hidden'
                    }, status=status.HTTP_502_BAD_GATEWAY)
                
                proxy_response = StreamingHttpResponse(
                    response.iter_content(chunk_size=8192),
                    content_type=document.content_type or response.headers.get('Content-Type', 'application/octet-stream')
                )
            else:
                # Local storage
                file_handle = document.file.open('rb')
                proxy_response = FileResponse(
                    file_handle, 
                    content_type=document.content_type or 'application/octet-stream'
                )
                
            # Set headers to force download
            filename = document.original_filename or f"document_{document.id}"
            # Ensure filename is safe and has extension if missing
            if '.' not in filename and document.content_type:
                import mimetypes
                ext = mimetypes.guess_extension(document.content_type)
                if ext:
                    filename += ext
                    
            proxy_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            proxy_response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            return proxy_response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching file from storage for document {document.id}: {str(e)}")
            return Response({'detail': 'Error retrieving file from storage.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.error(f"Download error for document {document.id}: {str(e)}")
            return Response({'detail': f'Error processing download: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
