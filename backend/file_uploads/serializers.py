from rest_framework import serializers
from .models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    # Use FileField for uploads, it handles multipart data automatically with appropriate parsers
    file = serializers.FileField(max_length=None, use_url=True) 

    class Meta:
        model = UploadedFile
        fields = [
            'id',
            'uploaded_by', # Keep for potential internal use, but hide or make read-only
            'uploaded_by_email',
            'file', 
            'original_filename', 
            'description', 
            'upload_date', 
            'content_type',
            'file_size'
        ]
        read_only_fields = ['uploaded_by', 'upload_date', 'content_type', 'file_size', 'original_filename']

    def create(self, validated_data):
        # Extract the file from validated_data
        uploaded_file_instance = validated_data.get('file')
        
        # Add filename, content_type, and size during creation if available from the file object
        if uploaded_file_instance:
            validated_data['original_filename'] = uploaded_file_instance.name
            validated_data['content_type'] = uploaded_file_instance.content_type
            validated_data['file_size'] = uploaded_file_instance.size
        else:
            # Handle cases where file might be missing, though validation should catch this
            validated_data['original_filename'] = 'Unknown'
            validated_data['content_type'] = 'application/octet-stream'
            validated_data['file_size'] = 0

        return super().create(validated_data) 