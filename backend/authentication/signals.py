from django.db import connection
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import User


SENSITIVE_FIELDS = [
    'illness',
    'existing_medical_condition',
    'medications',
    'allergies',
    'emergency_contact_number',
]


@receiver(post_save, sender=User)
def encrypt_sensitive_user_fields(sender, instance: User, **kwargs):
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

