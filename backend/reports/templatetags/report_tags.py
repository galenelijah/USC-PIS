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

@register.filter(name='is_chart_url')
def is_chart_url(value):
    """Check if a string is a QuickChart URL to prevent diagnostic leaks in tables"""
    if not isinstance(value, str):
        return False
    return "quickchart.io/chart" in value or (value.startswith("http") and "/chart?" in value)

@register.filter(name='format_audit_summary')
def format_audit_summary(log):
    """Convert JSON changes_summary into a human-readable string for reports"""
    if not isinstance(log, dict):
        return "N/A"
    
    actor = log.get('actor_email') or 'System'
    action = log.get('action_type')
    model = log.get('target_model', 'Record')
    summary = log.get('changes_summary', {})
    target_id = log.get('target_object_id', 'N/A')

    if not isinstance(summary, dict):
        summary = {}

    description = summary.get('description', f'record #{target_id}')
    if 'Object' in str(description) or 'at 0x' in str(description):
        description = f'ID: {target_id}'

    # Handle basic actions
    if action == 'LOGIN': return f"{actor} successfully logged in."
    if action == 'LOGOUT': return f"{actor} logged out."
    if action == 'GENERATE': return f"{actor} generated the {description}."
    if action == 'EXPORT': return f"{actor} exported/downloaded the {description}."

    # Handle clinical mutations
    if action == 'CREATE':
        return f"{actor} created a new {model.lower()} ({description})."
    
    if action == 'UPDATE':
        # Filter out metadata fields
        changed_fields = [k for k in summary.keys() if k not in ['status', 'description']]
        if changed_fields:
            fields_str = ", ".join([f.replace('_', ' ') for f in changed_fields])
            return f"{actor} updated {fields_str} for {model.lower()} ({description})."
        return f"{actor} updated {model.lower()} ({description})."

    if action == 'DELETE':
        return f"{actor} removed {model.lower()} ({description}) from the system."

    return f"{actor} performed {action} on {model}."
