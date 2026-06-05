from django.db import connection
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.apps import apps
from django.contrib.auth.signals import user_logged_in, user_logged_out
import logging

from .models import User, AuditLog
from .middleware import (
    get_current_user, get_current_ip, get_current_user_agent,
    get_current_path, get_current_method
)
from .tasks import log_activity_task

logger = logging.getLogger(__name__)


SENSITIVE_FIELDS = [
    'illness',
    'existing_medical_condition',
    'medications',
    'allergies',
    'emergency_contact_number',
    'blood_type',
]


@receiver(post_save, sender=User)
def encrypt_sensitive_user_fields(sender, instance: User, **kwargs):
    if connection.vendor != 'postgresql':
        return
    key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
    if not key:
        return
    try:
        with connection.cursor() as cursor:
            for field in SENSITIVE_FIELDS:
                value = getattr(instance, field, None)
                if value:
                    enc_col = f"{field}_enc"
                    # Use pgp_sym_encrypt on the DB side; cast to bytea explicitly
                    cursor.execute(
                        f"UPDATE authentication_user SET {enc_col} = pgp_sym_encrypt(%s, %s)::bytea WHERE id=%s",
                        [value, key, instance.id]
                    )
    except Exception:
        # Fail-safe: do not block save if encryption fails (e.g., SQLite dev)
        return

# --- AUDIT LOGGING SIGNALS ---

def is_whitelisted_action():
    actor = get_current_user()
    path = get_current_path()
    method = get_current_method()
    
    if not actor or not actor.is_authenticated:
        return False
        
    # If no path/method (e.g. internal task without request context), skip
    if not path or not method:
        return False
        
    # Whitelist prefixes
    allowed_prefixes = [
        '/api/auth/',
        '/api/patients/',
        '/api/medical-certificates/',
        '/api/health-info/',
        '/api/reports/',
    ]
    
    if not any(path.startswith(prefix) for prefix in allowed_prefixes):
        return False
        
    # Whitelist methods
    if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
        return True
        
    # Special case: allow GET for downloads (Clinical exports)
    if method == 'GET' and '/download' in path:
        return True
        
    return False

def should_log_model(model):
    """ Exclude specific models from being logged to avoid recursion or noise """
    excluded_models = ['AuditLog', 'Session', 'ContentFile', 'Migration', 'ContentType', 'LogEntry', 'NotificationPreference']
    if model.__name__ in excluded_models or model.__name__.startswith('Historical'):
        return False
    # Only log models from our core apps (Explicitly excluding notifications and utils)
    logged_apps = ['authentication', 'patients', 'health_info', 'medical_certificates', 'feedback', 'reports']
    return model._meta.app_label in logged_apps

@receiver(post_save)
def audit_log_save(sender, instance, created, **kwargs):
    if not should_log_model(sender):
        return

    # Fail-safe for early migrations
    if not connection.introspection.table_names() or 'authentication_auditlog' not in connection.introspection.table_names():
        return

    # Apply strict filtering (Human Actor + Whitelisted Route/Method)
    if not is_whitelisted_action():
        return

    actor = get_current_user()
    actor_id = actor.id
    
    action_type = 'CREATE' if created else 'UPDATE'
    target_model = sender.__name__
    target_object_id = getattr(instance, 'pk', 'N/A')

    # Special Case: Suppression for Noisy Progress Updates (Report Generation)
    if target_model == 'GeneratedReport' and not created:
        update_fields = kwargs.get('update_fields')
        if update_fields and list(update_fields) == ['progress_percentage']:
            return
    
    # Detailed diffing for updates
    changes = {}
    if not created:
        if hasattr(instance, 'history'):
            try:
                # Simple history might still be processing its own signal,
                # but we can try to get the latest two records
                history = instance.history.all()[:2]
                if len(history) >= 2:
                    new_record = history[0]
                    old_record = history[1]
                    delta = new_record.diff_against(old_record)
                    for change in delta.changes:
                        # Exclude noisy or sensitive fields (including automated system flags)
                        if change.field in ['updated_at', 'last_login', 'password', 'feedback_email_sent', 'feedback_reminder_sent', 'last_notified']:
                            continue
                        changes[change.field] = {
                            'old': str(change.old) if change.old is not None else None,
                            'new': str(change.new) if change.new is not None else None
                        }
                
                # Special Case: Report Export (Download)
                if target_model == 'GeneratedReport' and 'download_count' in changes:
                    action_type = 'EXPORT'

                # If no fields changed in our filtered list (and not a special action), skip logging redundant updates
                if not changes and action_type == 'UPDATE':
                    return
            except Exception as e:
                logger.warning(f"Audit diffing failed: {str(e)}")
                changes = {'status': 'modified', 'description': str(instance)}
        else:
            # Fallback for models without history (like GeneratedReport)
            changes = {'status': 'modified', 'description': str(instance)}
            
            # Special Case: Report Generation & Export
            if target_model == 'GeneratedReport':
                path = get_current_path()
                if path and '/download' in path:
                    action_type = 'EXPORT'
                else:
                    action_type = 'GENERATE'
    else:
        # For creation, log key fields or just the description
        changes = {'status': 'new', 'description': str(instance)}
        
        # Special Case: Report Generation
        if target_model == 'GeneratedReport':
            action_type = 'GENERATE'

    try:
        log_activity_task.delay(
            actor_id, action_type, target_model, target_object_id, 
            changes, get_current_ip(), get_current_user_agent()
        )
    except Exception as e:
        logger.error(f"Failed to queue audit log: {e}")

@receiver(post_delete)
def audit_log_delete(sender, instance, **kwargs):
    if not should_log_model(sender):
        return

    # Fail-safe for early migrations
    if not connection.introspection.table_names() or 'authentication_auditlog' not in connection.introspection.table_names():
        return

    # Apply strict filtering (Human Actor + Whitelisted Route/Method)
    if not is_whitelisted_action():
        return

    actor = get_current_user()
    actor_id = actor.id
    
    action_type = 'DELETE'
    target_model = sender.__name__
    target_object_id = getattr(instance, 'pk', 'N/A')
    
    changes = {'status': 'deleted', 'description': str(instance)}

    try:
        log_activity_task.delay(
            actor_id, action_type, target_model, target_object_id, 
            changes, get_current_ip(), get_current_user_agent()
        )
    except Exception as e:
        logger.error(f"Failed to queue audit log (delete): {e}")

@receiver(user_logged_in)
def audit_log_login(sender, request, user, **kwargs):
    try:
        log_activity_task.delay(
            user.id, 'LOGIN', 'User', user.id, 
            {'status': 'success'}, get_current_ip(), get_current_user_agent()
        )
    except Exception as e:
        logger.error(f"Failed to queue audit log (login): {e}")

@receiver(user_logged_out)
def audit_log_logout(sender, request, user, **kwargs):
    if user:
        try:
            log_activity_task.delay(
                user.id, 'LOGOUT', 'User', user.id, 
                {'status': 'success'}, get_current_ip(), get_current_user_agent()
            )
        except Exception as e:
            logger.error(f"Failed to queue audit log (logout): {e}")

