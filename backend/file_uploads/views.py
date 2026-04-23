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
import mimetypes
from .models import UploadedFile, PatientDocument
from .serializers import UploadedFileSerializer, PatientDocumentSerializer
from .validators import FileSecurityValidator, FileIntegrityChecker, FilenameValidator
import logging

logger = logging.getLogger(__name__)

class FileUploadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows files to be viewed or uploaded.
    """
    queryset = UploadedFile.objects.all().order_by('-upload_date')
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return UploadedFile.objects.all().order_by('-upload_date')
        return UploadedFile.objects.filter(uploaded_by=user).order_by('-upload_date')

    def create(self, request, *args, **kwargs):
        try:
            if 'file' not in request.FILES:
                return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({'detail': 'File validation failed', 'errors': validation_errors}, 
                                status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    existing_id = FileIntegrityChecker.check_duplicate_file(uploaded_file, request.user)
                    if existing_id:
                        return Response({'detail': 'File already uploaded', 'file_id': existing_id}, status=status.HTTP_200_OK)

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
    API endpoint for patient documents.
    """
    queryset = PatientDocument.objects.all().order_by('-uploaded_at')
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, 'role') and request.user.role in ['STUDENT', 'TEACHER']:
            return Response({'detail': 'Not authorized to upload.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            if 'file' not in request.FILES:
                return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            validation_errors = FileSecurityValidator.validate_file(uploaded_file)
            if validation_errors:
                return Response({'detail': 'Validation failed', 'errors': validation_errors}, status=status.HTTP_400_BAD_REQUEST)

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
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        queryset = PatientDocument.objects.all().order_by('-uploaded_at')
        if hasattr(user, 'role') and user.role in ['STUDENT', 'TEACHER']:
            from django.db.models import Q
            queryset = queryset.filter(Q(patient__user=user) | Q(uploaded_by=user))
        
        for param in ['patient', 'medical_record', 'dental_record']:
            val = self.request.query_params.get(param)
            if val:
                queryset = queryset.filter(**{f"{param}_id": val})
        return queryset

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Securely download a document.
        Fix: Enforces .pdf extension to avoid Cloudinary on-the-fly transformation triggers (401 errors).
        """
        document = self.get_object()
        if not document.file:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            file_url = document.file.url
            is_pdf = (document.original_filename and document.original_filename.lower().endswith('.pdf')) or \
                     (document.file.name and document.file.name.lower().endswith('.pdf'))
            
            # CRITICAL FIX: If it's a PDF, Cloudinary MUST have the .pdf extension in the URL
            # otherwise it attempts an on-the-fly image transformation which triggers 401/403.
            if is_pdf and '.pdf' not in file_url.lower() and '?' not in file_url:
                file_url = f"{file_url}.pdf"
                logger.info(f"Fixed PDF URL for document {document.id}: {file_url}")

            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) USC-PIS/1.0'}
            
            with requests.Session() as session:
                session.headers.clear()
                
                # Fetch the file. Most Cloudinary files in /upload/ are public but require extension matching.
                response = session.get(file_url, stream=True, timeout=30, headers=headers)
                
                # Fallback: If still restricted, try a simple signed URL as a last resort
                if response.status_code in [401, 403] and settings.USE_CLOUDINARY and 'res.cloudinary.com' in file_url:
                    logger.info(f"Public access restricted ({response.status_code}), trying basic signed URL")
                    import cloudinary.utils
                    # Get public_id by splitting the URL (everything after /upload/v123/)
                    match = re.search(r'/upload/(?:v\d+/)?(.+)$', file_url)
                    if match:
                        public_id = match.group(1)
                        # Remove extension for signing if it's an image resource type
                        if '/image/' in file_url and '.' in public_id:
                            public_id = public_id.rsplit('.', 1)[0]
                            
                        res_type = 'raw' if '/raw/' in file_url else 'image'
                        signed_url = cloudinary.utils.cloudinary_url(
                            public_id, sign_url=True, resource_type=res_type, secure=True
                        )[0]
                        response = session.get(signed_url, stream=True, timeout=30, headers=headers)

                if response.status_code != 200:
                    logger.error(f"Retrieval failed for document {document.id} with status {response.status_code}")
                    return Response({'detail': f'Storage error: {response.status_code}'}, status=status.HTTP_502_BAD_GATEWAY)

                # Stream the response
                proxy_response = StreamingHttpResponse(
                    response.iter_content(chunk_size=8192),
                    content_type=document.content_type or response.headers.get('Content-Type', 'application/octet-stream')
                )
                
            filename = document.original_filename or f"document_{document.id}"
            # Ensure filename has extension if missing
            if '.' not in filename and document.content_type:
                ext = mimetypes.guess_extension(document.content_type)
                if ext: filename += ext

            proxy_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            proxy_response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return proxy_response
            
        except Exception as e:
            logger.error(f"Download error for document {document.id}: {str(e)}")
            return Response({'detail': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
