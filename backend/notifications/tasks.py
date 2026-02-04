from celery import shared_task
from django.conf import settings
from .models import Notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(notification_id):
    """
    Celery task to send email notifications asynchronously.
    """
    from .services import EmailService
    try:
        # Get notification
        try:
            notification = Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            logger.error(f"Notification {notification_id} not found for email task")
            return {'success': False, 'error': 'Notification not found'}

        # Send email using existing service
        logger.info(f"Processing async email for notification {notification_id}")
        result = EmailService.send_notification_email(notification)
        
        return result

    except Exception as e:
        logger.error(f"Async email task failed for notification {notification_id}: {str(e)}")
        return {'success': False, 'error': str(e)}
