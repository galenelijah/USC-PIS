# Alternative: Cloudinary for media storage

# Add to requirements.txt:
# cloudinary==1.36.0
# django-cloudinary-storage==0.3.0

# Add to settings.py:
import cloudinary
import cloudinary.uploader
import cloudinary.api

if not DEBUG and os.environ.get('USE_CLOUDINARY') == 'True':
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
        secure=True
    )
    
    # Add to INSTALLED_APPS
    # INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    
    # Media files storage
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'