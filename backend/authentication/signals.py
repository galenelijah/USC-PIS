from django.db import connection
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.apps import apps
from django.contrib.auth.signals import user_logged_in, user_logged_out

from .models import User, AuditLog
from .middleware import get_current_user, get_current_ip, get_current_user_agent
from .tasks import log_activity_task


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

def should_log_model(model):
    """ Exclude specific models from being logged to avoid recursion or noise """
    excluded_models = [AuditLog, 'Session', 'ContentFile', 'Migration', 'ContentType', 'LogEntry']
    if model.__name__ in excluded_models:
        return False
    # Only log models from our core apps
    logged_apps = ['authentication', 'patients', 'health_info', 'medical_certificates', 'feedback', 'reports', 'notifications']
    return model._meta.app_label in logged_apps

@receiver(post_save)
def audit_log_save(sender, instance, created, **kwargs):
    if not should_log_model(sender):
        return

    actor = get_current_user()
    actor_id = actor.id if actor and actor.is_authenticated else None
    
    action_type = 'CREATE' if created else 'UPDATE'
    target_model = sender.__name__
    target_object_id = getattr(instance, 'pk', 'N/A')
    
    # Overview of changes (basic implementation)
    changes = {}
    if not created:
        # For updates, we could store 'Updated' status. 
        # Deep diffing is expensive, so we log the representation.
        changes = {'status': 'modified', 'description': str(instance)}
    else:
        changes = {'status': 'new', 'description': str(instance)}

    log_activity_task.delay(
        actor_id, action_type, target_model, target_object_id, 
        changes, get_current_ip(), get_current_user_agent()
    )

@receiver(post_delete)
def audit_log_delete(sender, instance, **kwargs):
    if not should_log_model(sender):
        return

    actor = get_current_user()
    actor_id = actor.id if actor and actor.is_authenticated else None
    
    action_type = 'DELETE'
    target_model = sender.__name__
    target_object_id = getattr(instance, 'pk', 'N/A')
    
    changes = {'status': 'deleted', 'description': str(instance)}

    log_activity_task.delay(
        actor_id, action_type, target_model, target_object_id, 
        changes, get_current_ip(), get_current_user_agent()
    )

@receiver(user_logged_in)
def audit_log_login(sender, request, user, **kwargs):
    log_activity_task.delay(
        user.id, 'LOGIN', 'User', user.id, 
        {'status': 'success'}, get_current_ip(), get_current_user_agent()
    )

@receiver(user_logged_out)
def audit_log_logout(sender, request, user, **kwargs):
    if user:
        log_activity_task.delay(
            user.id, 'LOGOUT', 'User', user.id, 
            {'status': 'success'}, get_current_ip(), get_current_user_agent()
        )

