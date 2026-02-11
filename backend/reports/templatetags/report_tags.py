from django import template
import re

register = template.Library()

@register.filter(name='is_simple')
def is_simple(value):
    """Check if value is a simple type (int, float, str, bool)"""
    return isinstance(value, (int, float, str, bool)) or value is None

@register.filter(name='is_list')
def is_list(value):
    """Check if value is a list or tuple"""
    return isinstance(value, (list, tuple))

@register.filter(name='is_dict')
def is_dict(value):
    """Check if value is a dictionary"""
    return isinstance(value, dict)

@register.filter(name='title_clean')
def title_clean(value):
    """Clean up underscores and title case a string"""
    if not isinstance(value, str):
        return str(value)
    # Replace underscores/hyphens with spaces
    cleaned = re.sub(r'[_|-]', ' ', value)
    return cleaned.title()
