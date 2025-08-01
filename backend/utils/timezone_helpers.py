"""
Timezone helper utilities for USC-PIS system.
Ensures consistent timestamp handling across the backend.
"""

from django.utils import timezone
from django.conf import settings
import pytz
from datetime import datetime
from typing import Optional, Union


# Philippines timezone constant
PHILIPPINES_TZ = pytz.timezone('Asia/Manila')


def get_current_time_ph() -> datetime:
    """
    Get current time in Philippines timezone.
    
    Returns:
        datetime: Current datetime in Asia/Manila timezone
    """
    return timezone.now().astimezone(PHILIPPINES_TZ)


def convert_to_ph_time(dt: Union[datetime, str]) -> Optional[datetime]:
    """
    Convert any datetime to Philippines timezone.
    
    Args:
        dt: Datetime object or ISO string to convert
        
    Returns:
        datetime: Converted datetime in Asia/Manila timezone, or None if invalid
    """
    if not dt:
        return None
    
    try:
        # Handle string input
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        
        # Make timezone-aware if naive
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.utc)
        
        # Convert to Philippines timezone
        return dt.astimezone(PHILIPPINES_TZ)
    
    except (ValueError, TypeError) as e:
        print(f"Error converting datetime {dt}: {e}")
        return None


def format_for_api(dt: Optional[datetime]) -> Optional[str]:
    """
    Format datetime for API response in ISO format.
    
    Args:
        dt: Datetime to format
        
    Returns:
        str: ISO formatted datetime string, or None if invalid
    """
    if not dt:
        return None
    
    try:
        # Ensure datetime is timezone-aware
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, PHILIPPINES_TZ)
        
        return dt.isoformat()
    
    except (ValueError, TypeError) as e:
        print(f"Error formatting datetime {dt}: {e}")
        return None


def validate_timestamp_fields(instance, fields: list) -> dict:
    """
    Validate that timestamp fields on a model instance are timezone-aware.
    
    Args:
        instance: Model instance to check
        fields: List of field names to validate
        
    Returns:
        dict: Validation results with any issues found
    """
    issues = []
    fixes_applied = []
    
    for field_name in fields:
        try:
            field_value = getattr(instance, field_name, None)
            if field_value:
                if timezone.is_naive(field_value):
                    # Convert naive datetime to timezone-aware
                    aware_datetime = timezone.make_aware(field_value, PHILIPPINES_TZ)
                    setattr(instance, field_name, aware_datetime)
                    fixes_applied.append(f"Made {field_name} timezone-aware")
                
                # Check if timezone is appropriate
                elif field_value.tzinfo != pytz.UTC and str(field_value.tzinfo) != 'Asia/Manila':
                    issues.append(f"{field_name} has unexpected timezone: {field_value.tzinfo}")
        
        except AttributeError:
            issues.append(f"Field {field_name} does not exist on {instance.__class__.__name__}")
    
    return {
        'issues': issues,
        'fixes_applied': fixes_applied,
        'is_valid': len(issues) == 0
    }


class TimestampMixin:
    """
    Mixin class to add consistent timestamp handling to Django models.
    Can be added to existing models to ensure proper timezone handling.
    """
    
    def save(self, *args, **kwargs):
        """Override save to ensure timestamp fields are timezone-aware."""
        # Get all datetime fields
        datetime_fields = []
        for field in self._meta.get_fields():
            if hasattr(field, 'get_internal_type') and field.get_internal_type() == 'DateTimeField':
                datetime_fields.append(field.name)
        
        # Validate timestamp fields
        validation_result = validate_timestamp_fields(self, datetime_fields)
        
        if validation_result['fixes_applied']:
            print(f"Applied timestamp fixes to {self.__class__.__name__}: {validation_result['fixes_applied']}")
        
        if validation_result['issues']:
            print(f"Timestamp issues in {self.__class__.__name__}: {validation_result['issues']}")
        
        super().save(*args, **kwargs)


def get_system_info() -> dict:
    """
    Get current system timezone information for debugging.
    
    Returns:
        dict: System timezone information
    """
    current_time = timezone.now()
    ph_time = get_current_time_ph()
    
    return {
        'django_timezone': settings.TIME_ZONE,
        'use_tz': settings.USE_TZ,
        'current_utc': current_time.isoformat(),
        'current_ph': ph_time.isoformat(),
        'ph_timezone_name': str(PHILIPPINES_TZ),
        'system_timezone': str(current_time.tzinfo)
    }


# Utility function for API views
def ensure_timezone_aware(data: dict, datetime_fields: list) -> dict:
    """
    Ensure all datetime fields in API data are timezone-aware.
    
    Args:
        data: Dictionary of data from API request
        datetime_fields: List of field names that should be datetime
        
    Returns:
        dict: Data with timezone-aware datetime fields
    """
    for field_name in datetime_fields:
        if field_name in data and data[field_name]:
            converted = convert_to_ph_time(data[field_name])
            if converted:
                data[field_name] = converted
    
    return data