from django import template
import re

register = template.Library()

@register.filter(name='is_simple')
def is_simple(value):
    """Check if value is a simple type (int, float, str, bool, date, datetime)"""
    from datetime import date, datetime
    return isinstance(value, (int, float, str, bool, date, datetime)) or value is None

@register.filter(name='is_list')
def is_list(value):
    """Check if value is a list or tuple"""
    return isinstance(value, (list, tuple))

@register.filter(name='is_dict')
def is_dict(value):
    """Check if value is a dictionary"""
    return isinstance(value, dict)

@register.filter(name='has_data')
def has_data(value):
    """Check if a list or dictionary has actual content"""
    if not value:
        return False
    if isinstance(value, (list, tuple, dict)):
        return len(value) > 0
    return True

@register.filter(name='get_item')
def get_item(dictionary, key):
    """Get an item from a dictionary using a key string"""
    if not isinstance(dictionary, dict):
        return ""
    return dictionary.get(key, "")

@register.filter(name='format_date')
def format_date(value, format_string="%b %d, %Y"):
    """Format a date string or object"""
    if not value:
        return "N/A"
    try:
        if isinstance(value, str):
            # Try to parse ISO format or YYYY-MM-DD
            from django.utils.dateparse import parse_date, parse_datetime
            dt = parse_datetime(value) or parse_date(value)
            if not dt:
                return value
            return dt.strftime(format_string)
        return value.strftime(format_string)
    except Exception:
        return str(value)

@register.filter(name='title_clean')
def title_clean(value):
    """Clean up underscores and title case a string"""
    if not isinstance(value, str):
        return str(value)
    # Replace underscores/hyphens with spaces
    cleaned = re.sub(r'[_|-]', ' ', value)
    return cleaned.title()
