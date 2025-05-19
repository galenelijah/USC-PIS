from django.test import TestCase
from .models import UploadedFile
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

# Create your tests here.

class UploadedFileModelTest(TestCase):
    def test_create_uploaded_file(self):
        user = get_user_model().objects.create_user(email='file@example.com', password='testpass')
        file = SimpleUploadedFile('test.txt', b'file_content')
        uploaded = UploadedFile.objects.create(
            uploaded_by=user,
            file=file,
            original_filename='test.txt',
            description='A test file',
            content_type='text/plain',
            file_size=12
        )
        self.assertEqual(uploaded.original_filename, 'test.txt')
