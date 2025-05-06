from django.shortcuts import render
from rest_framework import viewsets, permissions, parsers
from .models import UploadedFile
from .serializers import UploadedFileSerializer

# Create your views here.

class FileUploadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows files to be viewed or uploaded.
    Requires authentication for all actions.
    """
    queryset = UploadedFile.objects.all().order_by('-upload_date')
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated] # Allow any authenticated user
    # Ensure support for file uploads (multipart/form-data)
    parser_classes = [parsers.MultiPartParser, parsers.FormParser] 

    def perform_create(self, serializer):
        """Associate the uploaded file with the current user."""
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        """
        Optionally restricts the returned files to a given user,
        by filtering against a `username` query parameter in the URL.
        (Example: allow users to view only their own uploads, if needed later)
        For now, allows authenticated users to see all uploads.
        """
        # queryset = UploadedFile.objects.all().order_by('-upload_date')
        # username = self.request.query_params.get('username')
        # if username is not None:
        #     queryset = queryset.filter(uploaded_by__username=username)
        
        # Allow any authenticated user to list all files for now
        return UploadedFile.objects.all().order_by('-upload_date') 
