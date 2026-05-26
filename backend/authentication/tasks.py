import logging
from celery import shared_task
from django.utils import timezone
from .models import User, AuditLog

logger = logging.getLogger(__name__)

@shared_task(name="authentication.tasks.log_activity_task")
def log_activity_task(actor_id, action_type, target_model, target_object_id, changes_summary, ip_address, user_agent):
    """
    Background task to persist audit logs without blocking the main request thread.
    """
    try:
        actor = None
        actor_email = "System/Anonymous"
        actor_role = "N/A"
        
        if actor_id:
            try:
                actor = User.objects.get(id=actor_id)
                actor_email = actor.email
                actor_role = actor.role
            except User.DoesNotExist:
                pass
                
        AuditLog.objects.create(
            actor=actor,
            actor_email=actor_email,
            actor_role=actor_role,
            action_type=action_type,
            target_model=target_model,
            target_object_id=str(target_object_id),
            changes_summary=changes_summary,
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        logger.error(f"Audit Log Task Error: {str(e)}")
