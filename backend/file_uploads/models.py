from django.db import models
from django.conf import settings
import os

class UploadedFile(models.Model):
    """Stores files uploaded by users."""
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Keep file even if user is deleted, but set uploader to NULL
        null=True,
        related_name='uploaded_files'
    )
    file = models.FileField(upload_to='user_uploads/') # Files will be stored in MEDIA_ROOT/user_uploads/
    original_filename = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    content_type = models.CharField(max_length=100, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True) # Size in bytes

    def save(self, *args, **kwargs):
        # Automatically set original_filename if not provided
        if not self.original_filename and self.file:
            self.original_filename = os.path.basename(self.file.name)
        
        # Automatically set file_size if not provided
        if self.file and self.file_size is None:
            try:
                self.file_size = self.file.size
            except Exception as e:
                # Handle cases where file size cannot be determined (e.g., before saving to storage)
                print(f"Could not determine file size for {self.original_filename}: {e}")
                self.file_size = 0 # Or None if you prefer

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_filename} (Uploaded by: {self.uploaded_by.email if self.uploaded_by else 'Unknown'})"
