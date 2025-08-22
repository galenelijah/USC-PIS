import os
import mimetypes
import hashlib
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
import logging
from typing import List, Dict, Optional, Tuple
import re

# Optional dependencies with fallbacks
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    magic = None

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    Image = None

logger = logging.getLogger(__name__)

class FileSecurityValidator:
    """Comprehensive file security validation."""
    
    # Maximum file sizes (in bytes)
    MAX_FILE_SIZES = {
        'image': 10 * 1024 * 1024,    # 10MB for images
        'document': 50 * 1024 * 1024,  # 50MB for documents
        'default': 25 * 1024 * 1024    # 25MB default
    }
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {
        'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
        'document': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
        'spreadsheet': ['.xls', '.xlsx', '.csv', '.ods'],
        'presentation': ['.ppt', '.pptx', '.odp'],
        'archive': ['.zip', '.rar', '.7z', '.tar', '.gz']
    }
    
    # Dangerous file extensions (always blocked)
    DANGEROUS_EXTENSIONS = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.app', '.deb', '.rpm', '.dmg', '.iso', '.msi', '.sh',
        '.ps1', '.asp', '.aspx', '.php', '.jsp', '.py', '.rb', '.pl'
    ]
    
    # MIME type mappings
    ALLOWED_MIME_TYPES = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/bmp': '.bmp',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt',
        'application/rtf': '.rtf',
        'application/zip': '.zip',
        'text/csv': '.csv'
    }
    
    # Suspicious file signatures (magic bytes)
    SUSPICIOUS_SIGNATURES = [
        b'\x4D\x5A',  # PE executable (MZ header)
        b'\x7F\x45\x4C\x46',  # ELF executable
        b'\xCA\xFE\xBA\xBE',  # Java class file
        b'\xFE\xED\xFA\xCE',  # Mach-O executable (32-bit)
        b'\xFE\xED\xFA\xCF',  # Mach-O executable (64-bit)
    ]
    
    @classmethod
    def validate_file(cls, uploaded_file: UploadedFile) -> List[str]:
        """
        Comprehensive file validation.
        Returns list of validation errors.
        """
        errors = []
        
        try:
            # Basic file checks
            errors.extend(cls._validate_file_basics(uploaded_file))
            
            # Extension validation
            errors.extend(cls._validate_extension(uploaded_file.name))
            
            # Size validation
            errors.extend(cls._validate_file_size(uploaded_file))
            
            # MIME type validation
            errors.extend(cls._validate_mime_type(uploaded_file))
            
            # Content validation
            errors.extend(cls._validate_file_content(uploaded_file))
            
            # Security checks
            errors.extend(cls._security_checks(uploaded_file))
            
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            errors.append("File validation failed due to technical error")
        
        return errors
    
    @classmethod
    def _validate_file_basics(cls, uploaded_file: UploadedFile) -> List[str]:
        """Basic file validation."""
        errors = []
        
        if not uploaded_file:
            errors.append("No file provided")
            return errors
        
        if not uploaded_file.name:
            errors.append("File must have a name")
        
        # Make empty file validation less strict - only error for files that are explicitly required
        # Allow empty files to be gracefully handled by the application logic
        if uploaded_file.size == 0:
            # Don't treat empty files as errors - let the application decide
            # This allows optional file fields to work properly
            pass
        
        # Check for null bytes in filename (potential security issue)
        if '\x00' in uploaded_file.name:
            errors.append("Invalid characters in filename")
        
        # Check filename length
        if len(uploaded_file.name) > 255:
            errors.append("Filename is too long (maximum 255 characters)")
        
        # Check for directory traversal attempts
        if '..' in uploaded_file.name or '/' in uploaded_file.name or '\\' in uploaded_file.name:
            errors.append("Invalid characters in filename")
        
        return errors
    
    @classmethod
    def _validate_extension(cls, filename: str) -> List[str]:
        """Validate file extension."""
        errors = []
        
        if not filename:
            return errors
        
        # Get file extension
        ext = os.path.splitext(filename.lower())[1]
        
        if not ext:
            errors.append("File must have an extension")
            return errors
        
        # Check for dangerous extensions
        if ext in cls.DANGEROUS_EXTENSIONS:
            errors.append(f"File type '{ext}' is not allowed for security reasons")
            return errors
        
        # Check if extension is in allowed list
        all_allowed = []
        for category_exts in cls.ALLOWED_EXTENSIONS.values():
            all_allowed.extend(category_exts)
        
        if ext not in all_allowed:
            errors.append(f"File type '{ext}' is not supported")
        
        return errors
    
    @classmethod
    def _validate_file_size(cls, uploaded_file: UploadedFile) -> List[str]:
        """Validate file size."""
        errors = []
        
        if not uploaded_file.size:
            return errors
        
        # Determine file category and size limit
        ext = os.path.splitext(uploaded_file.name.lower())[1]
        max_size = cls.MAX_FILE_SIZES['default']
        
        # Check category-specific limits
        if ext in cls.ALLOWED_EXTENSIONS['image']:
            max_size = cls.MAX_FILE_SIZES['image']
        elif ext in cls.ALLOWED_EXTENSIONS['document']:
            max_size = cls.MAX_FILE_SIZES['document']
        
        if uploaded_file.size > max_size:
            mb_size = uploaded_file.size / (1024 * 1024)
            max_mb = max_size / (1024 * 1024)
            errors.append(f"File size ({mb_size:.1f}MB) exceeds maximum allowed ({max_mb:.0f}MB)")
        
        return errors
    
    @classmethod
    def _validate_mime_type(cls, uploaded_file: UploadedFile) -> List[str]:
        """Validate MIME type."""
        errors = []
        
        try:
            # Get MIME type from file content
            uploaded_file.seek(0)
            file_content = uploaded_file.read(1024)  # Read first 1KB
            uploaded_file.seek(0)
            
            # Use python-magic for MIME detection
            if HAS_MAGIC:
                try:
                    detected_mime = magic.from_buffer(file_content, mime=True)
                except:
                    # Fallback to mimetypes
                    detected_mime, _ = mimetypes.guess_type(uploaded_file.name)
            else:
                # Fallback to mimetypes when python-magic is not available
                detected_mime, _ = mimetypes.guess_type(uploaded_file.name)
            
            if not detected_mime:
                errors.append("Could not determine file type")
                return errors
            
            # Check if MIME type is allowed
            if detected_mime not in cls.ALLOWED_MIME_TYPES:
                errors.append(f"File type '{detected_mime}' is not allowed")
            
            # Check MIME type vs extension consistency
            ext = os.path.splitext(uploaded_file.name.lower())[1]
            expected_ext = cls.ALLOWED_MIME_TYPES.get(detected_mime)
            
            if expected_ext and ext != expected_ext:
                errors.append(f"File extension '{ext}' does not match file content")
            
        except Exception as e:
            logger.error(f"MIME type validation error: {str(e)}")
            errors.append("Could not validate file type")
        
        return errors
    
    @classmethod
    def _validate_file_content(cls, uploaded_file: UploadedFile) -> List[str]:
        """Validate file content."""
        errors = []
        
        try:
            uploaded_file.seek(0)
            
            # Check for images
            ext = os.path.splitext(uploaded_file.name.lower())[1]
            if ext in cls.ALLOWED_EXTENSIONS['image']:
                errors.extend(cls._validate_image_content(uploaded_file))
            
            # Check for documents
            elif ext in cls.ALLOWED_EXTENSIONS['document']:
                errors.extend(cls._validate_document_content(uploaded_file))
            
        except Exception as e:
            logger.error(f"Content validation error: {str(e)}")
            errors.append("File content validation failed")
        
        return errors
    
    @classmethod
    def _validate_image_content(cls, uploaded_file: UploadedFile) -> List[str]:
        """Validate image file content."""
        errors = []
        
        if not HAS_PIL:
            # Cannot perform advanced image validation without PIL
            logger.warning("PIL not available - skipping advanced image validation")
            return errors
        
        try:
            uploaded_file.seek(0)
            with Image.open(uploaded_file) as img:
                # Check image format
                if img.format not in ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP']:
                    errors.append(f"Unsupported image format: {img.format}")
                
                # Check image dimensions (prevent decompression bombs)
                width, height = img.size
                if width > 10000 or height > 10000:
                    errors.append("Image dimensions too large (max 10000x10000)")
                
                # Check for suspicious image properties
                if width * height > 100000000:  # 100 megapixels
                    errors.append("Image resolution too high")
                
                # Verify image can be processed
                img.verify()
                
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            errors.append("Invalid or corrupted image file")
        finally:
            uploaded_file.seek(0)
        
        return errors
    
    @classmethod
    def _validate_document_content(cls, uploaded_file: UploadedFile) -> List[str]:
        """Validate document file content."""
        errors = []
        
        try:
            uploaded_file.seek(0)
            content = uploaded_file.read(1024)  # Read first 1KB
            uploaded_file.seek(0)
            
            # Check for embedded executables or suspicious content
            if any(sig in content for sig in cls.SUSPICIOUS_SIGNATURES):
                errors.append("File contains suspicious content")
            
            # Check for excessive null bytes (possible malicious padding)
            null_byte_count = content.count(b'\x00')
            if null_byte_count > len(content) * 0.5:  # More than 50% null bytes
                errors.append("File contains excessive null bytes")
            
        except Exception as e:
            logger.error(f"Document validation error: {str(e)}")
            errors.append("Document validation failed")
        
        return errors
    
    @classmethod
    def _security_checks(cls, uploaded_file: UploadedFile) -> List[str]:
        """Additional security checks."""
        errors = []
        
        try:
            uploaded_file.seek(0)
            content = uploaded_file.read(2048)  # Read first 2KB
            uploaded_file.seek(0)
            
            # Check for script injections in filenames
            dangerous_patterns = [
                r'<script', r'javascript:', r'vbscript:', r'onload=',
                r'onerror=', r'<iframe', r'<object', r'<embed'
            ]
            
            filename_lower = uploaded_file.name.lower()
            for pattern in dangerous_patterns:
                if re.search(pattern, filename_lower):
                    errors.append("Filename contains suspicious content")
                    break
            
            # Check for polyglot files (files that are valid in multiple formats)
            # These can be used to bypass security filters
            if content.startswith(b'%PDF') and b'<script' in content:
                errors.append("File appears to contain embedded scripts")
            
            # Check for zip bombs (nested archives)
            if uploaded_file.name.lower().endswith('.zip'):
                # Basic check for suspicious zip files
                if uploaded_file.size < 1024 and b'PK' in content:
                    # Very small zip file might be a zip bomb
                    errors.append("Suspicious archive file detected")
            
        except Exception as e:
            logger.error(f"Security check error: {str(e)}")
            errors.append("Security validation failed")
        
        return errors

class FileIntegrityChecker:
    """Check file integrity and generate checksums."""
    
    @staticmethod
    def generate_checksum(uploaded_file: UploadedFile, algorithm: str = 'sha256') -> str:
        """Generate file checksum."""
        try:
            uploaded_file.seek(0)
            
            if algorithm == 'md5':
                hasher = hashlib.md5()
            elif algorithm == 'sha1':
                hasher = hashlib.sha1()
            else:  # default to sha256
                hasher = hashlib.sha256()
            
            for chunk in uploaded_file.chunks():
                hasher.update(chunk)
            
            uploaded_file.seek(0)
            return hasher.hexdigest()
            
        except Exception as e:
            logger.error(f"Checksum generation error: {str(e)}")
            return None
    
    @staticmethod
    def check_duplicate_file(uploaded_file: UploadedFile, user) -> Optional[str]:
        """Check if file already exists for user."""
        try:
            from .models import UploadedFile as FileModel
            
            checksum = FileIntegrityChecker.generate_checksum(uploaded_file)
            if not checksum:
                return None
            
            # Check for existing file with same checksum
            existing_file = FileModel.objects.filter(
                uploaded_by=user,
                checksum=checksum
            ).first()
            
            if existing_file:
                return existing_file.id
            
            return None
            
        except Exception as e:
            logger.error(f"Duplicate check error: {str(e)}")
            return None

class FilenameValidator:
    """Validate and sanitize filenames."""
    
    # Reserved names in Windows
    RESERVED_NAMES = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]
    
    # Characters not allowed in filenames
    INVALID_CHARS = r'[<>:"/\\|?*\x00-\x1f]'
    
    @classmethod
    def validate_filename(cls, filename: str) -> List[str]:
        """Validate filename for security and compatibility."""
        errors = []
        
        if not filename:
            errors.append("Filename cannot be empty")
            return errors
        
        # Check for reserved names
        name_without_ext = os.path.splitext(filename)[0].upper()
        if name_without_ext in cls.RESERVED_NAMES:
            errors.append(f"Filename '{filename}' is reserved")
        
        # Check for invalid characters
        if re.search(cls.INVALID_CHARS, filename):
            errors.append("Filename contains invalid characters")
        
        # Check for leading/trailing spaces or dots
        if filename.startswith(' ') or filename.endswith(' '):
            errors.append("Filename cannot start or end with spaces")
        
        if filename.startswith('.') or filename.endswith('.'):
            errors.append("Filename cannot start or end with dots")
        
        # Check length
        if len(filename.encode('utf-8')) > 255:
            errors.append("Filename is too long")
        
        return errors
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage."""
        if not filename:
            return "unnamed_file"
        
        # Remove invalid characters
        sanitized = re.sub(cls.INVALID_CHARS, '_', filename)
        
        # Remove leading/trailing spaces and dots
        sanitized = sanitized.strip(' .')
        
        # Handle reserved names
        name_part, ext = os.path.splitext(sanitized)
        if name_part.upper() in cls.RESERVED_NAMES:
            sanitized = f"{name_part}_file{ext}"
        
        # Ensure not empty
        if not sanitized:
            sanitized = "unnamed_file"
        
        # Limit length
        if len(sanitized.encode('utf-8')) > 255:
            name_part, ext = os.path.splitext(sanitized)
            max_name_length = 255 - len(ext.encode('utf-8'))
            name_part = name_part.encode('utf-8')[:max_name_length].decode('utf-8', errors='ignore')
            sanitized = f"{name_part}{ext}"
        
        return sanitized

# Validator instances
file_security_validator = FileSecurityValidator()
file_integrity_checker = FileIntegrityChecker()
filename_validator = FilenameValidator() 