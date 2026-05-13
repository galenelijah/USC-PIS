from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

@shared_task(name="feedback.tasks.process_feedback_reminders")
def process_feedback_reminders():
    """
    Periodic task to send automated feedback request emails 
    for visits that occurred approximately 24 hours ago.
    """
    logger.info("Starting automated feedback reminders task")
    try:
        # We run for 24 hours ago. 
        # The command itself handles the 1-hour window precision.
        call_command('auto_send_feedback_emails', hours=24)
        logger.info("Successfully completed automated feedback reminders task")
        return True
    except Exception as e:
        logger.error(f"Error in process_feedback_reminders task: {str(e)}")
        return False
