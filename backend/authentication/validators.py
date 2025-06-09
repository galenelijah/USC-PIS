import re
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.conf import settings
import hashlib
import time
from typing import Optional, List, Dict, Tuple
import logging

# Optional dependencies
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    requests = None

logger = logging.getLogger(__name__)

class EnhancedEmailValidator:
    """Enhanced email validation with USC domain requirement."""
    
    # Required USC domain
    REQUIRED_DOMAIN = 'usc.edu.ph'
    
    # Common typos in USC email domain
    DOMAIN_TYPOS = {
        'usc.edu': 'usc.edu.ph',
        'usc.edu.com': 'usc.edu.ph',
        'usc.com': 'usc.edu.ph',
        'usc.org': 'usc.edu.ph',
        'usc.ph': 'usc.edu.ph',
        'usc.education.ph': 'usc.edu.ph',
        'usc.edu.philippines': 'usc.edu.ph',
        'uc.edu.ph': 'usc.edu.ph',
        'usec.edu.ph': 'usc.edu.ph',
        'usc.educ.ph': 'usc.edu.ph'
    }
    
    def __init__(self, require_usc_domain=True, allow_existing_users=True):
        self.require_usc_domain = require_usc_domain
        self.allow_existing_users = allow_existing_users
        self.base_validator = EmailValidator()
    
    def __call__(self, email: str, check_existing=False) -> Optional[str]:
        """
        Validate email with USC domain requirement.
        
        Args:
            email: Email address to validate
            check_existing: If True, allows existing users to bypass USC domain requirement
            
        Returns:
            None if valid, error message if invalid.
        """
        if not email:
            return "Email is required"
        
        # Normalize email
        email = email.strip().lower()
        
        # Basic format validation
        try:
            self.base_validator(email)
        except ValidationError:
            return "Invalid email format"
        
        # Check for Unicode issues
        try:
            email.encode('ascii')
        except UnicodeEncodeError:
            return "Email contains unsupported characters"
        
        # Extract domain
        try:
            local, domain = email.rsplit('@', 1)
        except ValueError:
            return "Invalid email format"
        
        # Check if user already exists (for login scenarios)
        if check_existing and self.allow_existing_users:
            if self._user_exists(email):
                # Existing user - only validate format, not domain
                return self._validate_existing_user_email(local, domain)
        
        # Check for common typos in USC domain
        if domain in self.DOMAIN_TYPOS:
            suggested = self.DOMAIN_TYPOS[domain]
            return f"Did you mean {local}@{suggested}?"
        
        # USC domain requirement (only for new users or when explicitly required)
        if self.require_usc_domain and domain != self.REQUIRED_DOMAIN:
            return f"Only USC email addresses (@{self.REQUIRED_DOMAIN}) are allowed"
        
        # Check for suspicious patterns in local part
        if self._is_suspicious_local_part(local):
            return "Email address appears to be invalid"
        
        return None
    
    def _user_exists(self, email: str) -> bool:
        """Check if user with this email already exists in database."""
        try:
            from .models import User
            return User.objects.filter(email=email).exists()
        except Exception as e:
            logger.error(f"Error checking if user exists: {e}")
            return False
    
    def _validate_existing_user_email(self, local: str, domain: str) -> Optional[str]:
        """Validate email for existing users (more lenient validation)."""
        # Basic validation for existing users
        if self._is_suspicious_local_part(local, lenient=True):
            return "Email address appears to be invalid"
        return None
    
    def _is_suspicious_local_part(self, local: str, lenient: bool = False) -> bool:
        """Check for suspicious email local part patterns."""
        # Too many dots
        max_dots = 5 if lenient else 3
        if local.count('.') > max_dots:
            return True
        
        # Consecutive dots
        if '..' in local:
            return True
        
        # Starts or ends with dot
        if local.startswith('.') or local.endswith('.'):
            return True
        
        # Allow USC student ID formats (8-digit numbers are common USC student IDs)
        if len(local) == 8 and local.isdigit():
            # This is likely a USC student ID - allow it
            return False
        
        # Allow other common USC ID formats (7-9 digit numbers)
        if 7 <= len(local) <= 9 and local.isdigit():
            # This is likely a USC student/employee ID - allow it
            return False
        
        # Too many numbers (likely generated) - more lenient for existing users
        digit_count = sum(1 for c in local if c.isdigit())
        threshold = 0.8 if lenient else 0.7
        if digit_count > len(local) * threshold:
            return True
        
        # Allow more characters for existing users
        allowed_pattern = r'^[a-zA-Z0-9._+-]+$' if lenient else r'^[a-zA-Z0-9._-]+$'
        if not re.match(allowed_pattern, local):
            return True
        
        # Local part too short or too long
        max_length = 50 if lenient else 30
        if len(local) < 2 or len(local) > max_length:
            return True
        
        return False

class PasswordSecurityValidator:
    """Enhanced password validation with security edge cases."""
    
    # Common leaked passwords (sample - in production, use a proper leaked password database)
    COMMON_PASSWORDS = {
        '123456', 'password', '123456789', '12345678', '12345',
        '1234567', '1234567890', 'qwerty', 'abc123', 'million2',
        '000000', '1234', 'iloveyou', 'aaron431', 'password1',
        'qqww1122', '123', 'omgpop', '123321', '654321'
    }
    
    def __init__(self, min_length=8, require_special=True, check_breaches=False):
        self.min_length = min_length
        self.require_special = require_special
        self.check_breaches = check_breaches
    
    def validate(self, password: str, user_data: Dict = None) -> List[str]:
        """
        Comprehensive password validation.
        Returns list of error messages.
        """
        errors = []
        
        if not password:
            errors.append("Password is required")
            return errors
        
        # Length check
        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters long")
        
        # Character variety checks
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        # Common password check
        if password.lower() in self.COMMON_PASSWORDS:
            errors.append("This password is too common and has been compromised")
        
        # Sequential characters
        if self._has_sequential_chars(password):
            errors.append("Password cannot contain sequential characters")
        
        # Repeated characters
        if self._has_excessive_repetition(password):
            errors.append("Password cannot have excessive character repetition")
        
        # User data similarity
        if user_data and self._similar_to_user_data(password, user_data):
            errors.append("Password cannot be similar to your personal information")
        
        # Breach check (if enabled)
        if self.check_breaches and self._check_password_breach(password):
            errors.append("This password has been found in data breaches")
        
        return errors
    
    def _has_sequential_chars(self, password: str) -> bool:
        """Check for sequential characters like 123 or abc."""
        sequences = ['123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop']
        for seq in sequences:
            for i in range(len(seq) - 2):
                if seq[i:i+3] in password.lower():
                    return True
        return False
    
    def _has_excessive_repetition(self, password: str) -> bool:
        """Check for excessive character repetition."""
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                return True
        return False
    
    def _similar_to_user_data(self, password: str, user_data: Dict) -> bool:
        """Check if password is similar to user data."""
        password_lower = password.lower()
        
        # Check against common user fields
        fields_to_check = ['email', 'first_name', 'last_name', 'username']
        
        for field in fields_to_check:
            if field in user_data and user_data[field]:
                value = str(user_data[field]).lower()
                if len(value) > 3 and value in password_lower:
                    return True
        
        return False
    
    def _check_password_breach(self, password: str) -> bool:
        """Check if password has been breached using Have I Been Pwned API."""
        if not HAS_REQUESTS:
            # requests not available - skip breach check
            logger.warning("requests library not available - skipping password breach check")
            return False
        
        try:
            # Hash the password
            sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
            prefix = sha1_hash[:5]
            suffix = sha1_hash[5:]
            
            # Query Have I Been Pwned API
            url = f"https://api.pwnedpasswords.com/range/{prefix}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                hashes = response.text.splitlines()
                for hash_line in hashes:
                    hash_suffix, count = hash_line.split(':')
                    if hash_suffix == suffix:
                        return True
            
        except Exception as e:
            logger.warning(f"Password breach check failed: {e}")
        
        return False

class RateLimiter:
    """Rate limiting for authentication attempts."""
    
    def __init__(self, max_attempts=5, window_minutes=15, lockout_minutes=30):
        self.max_attempts = max_attempts
        self.window_seconds = window_minutes * 60
        self.lockout_seconds = lockout_minutes * 60
    
    def is_rate_limited(self, identifier: str, action: str = 'login') -> Tuple[bool, int]:
        """
        Check if identifier is rate limited.
        Returns (is_limited, seconds_until_reset)
        """
        cache_key = f"rate_limit:{action}:{identifier}"
        lockout_key = f"lockout:{action}:{identifier}"
        
        # Check if currently locked out
        lockout_time = cache.get(lockout_key)
        if lockout_time:
            time_remaining = lockout_time - int(time.time())
            if time_remaining > 0:
                return True, time_remaining
            else:
                cache.delete(lockout_key)
        
        # Get current attempts
        attempts = cache.get(cache_key, [])
        current_time = int(time.time())
        
        # Remove attempts outside the window
        attempts = [attempt_time for attempt_time in attempts 
                   if current_time - attempt_time < self.window_seconds]
        
        # Check if rate limited
        if len(attempts) >= self.max_attempts:
            # Set lockout
            cache.set(lockout_key, current_time + self.lockout_seconds, 
                     timeout=self.lockout_seconds)
            return True, self.lockout_seconds
        
        return False, 0
    
    def record_attempt(self, identifier: str, action: str = 'login', success: bool = False):
        """Record an authentication attempt."""
        cache_key = f"rate_limit:{action}:{identifier}"
        
        if success:
            # Clear attempts on successful authentication
            cache.delete(cache_key)
            return
        
        # Add failed attempt
        attempts = cache.get(cache_key, [])
        current_time = int(time.time())
        attempts.append(current_time)
        
        # Keep only attempts within the window
        attempts = [attempt_time for attempt_time in attempts 
                   if current_time - attempt_time < self.window_seconds]
        
        cache.set(cache_key, attempts, timeout=self.window_seconds)

class SessionManager:
    """Enhanced session management with edge case handling."""
    
    @staticmethod
    def handle_concurrent_logins(user, max_sessions=3):
        """Handle concurrent login sessions."""
        from django.contrib.sessions.models import Session
        from rest_framework.authtoken.models import Token
        
        # Get all active tokens for the user
        tokens = Token.objects.filter(user=user)
        
        if tokens.count() > max_sessions:
            # Keep only the most recent tokens
            tokens_to_delete = tokens.order_by('-created')[max_sessions:]
            for token in tokens_to_delete:
                token.delete()
            
            logger.info(f"Cleaned up {len(tokens_to_delete)} old sessions for user {user.email}")
    
    @staticmethod
    def is_token_expired(token, max_age_hours=24):
        """Check if token is expired."""
        from django.utils import timezone
        from datetime import timedelta
        
        if not token.created:
            return True
        
        expiry_time = token.created + timedelta(hours=max_age_hours)
        return timezone.now() > expiry_time
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired tokens."""
        from rest_framework.authtoken.models import Token
        from django.utils import timezone
        from datetime import timedelta
        
        expiry_time = timezone.now() - timedelta(hours=24)
        expired_tokens = Token.objects.filter(created__lt=expiry_time)
        count = expired_tokens.count()
        expired_tokens.delete()
        
        logger.info(f"Cleaned up {count} expired tokens")
        return count

# Validation instances with USC domain requirement
email_validator = EnhancedEmailValidator(require_usc_domain=True, allow_existing_users=True)
password_validator = PasswordSecurityValidator(min_length=8, require_special=True, check_breaches=True)
rate_limiter = RateLimiter(max_attempts=5, window_minutes=15, lockout_minutes=30)

# Separate validator for strict USC-only validation (for new registrations)
strict_email_validator = EnhancedEmailValidator(require_usc_domain=True, allow_existing_users=False) 