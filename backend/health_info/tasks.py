from celery import shared_task
from django.contrib.auth import get_user_model
from .models import HealthCampaign
from notifications.models import Notification
from utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

@shared_task(name="health_info.tasks.send_campaign_notifications_task")
def send_campaign_notifications_task(campaign_id):
    """
    Background task to send in-app and email notifications for an active campaign.
    This prevents the main request from timing out when notifying many users.
    """
    try:
        campaign = HealthCampaign.objects.get(id=campaign_id)
        if campaign.status != 'ACTIVE':
            logger.info(f"Campaign {campaign_id} is no longer ACTIVE. Skipping notifications.")
            return False

        User = get_user_model()
        target_users = User.objects.filter(is_active=True)
        
        sent_count = 0
        email_count = 0
        
        for user in target_users:
            try:
                # Idempotency check: Don't notify the same user for the same campaign activation
                exists = Notification.objects.filter(
                    recipient=user,
                    notification_type="HEALTH_CAMPAIGN",
                    metadata__campaign_id=campaign.id,
                    metadata__action='active_alert'
                ).exists()
                
                if not exists:
                    # Determine if user is a patient
                    patient_profile = getattr(user, 'patient_profile', None)
                    is_patient = patient_profile is not None
                    delivery_method = 'BOTH' if is_patient else 'IN_APP'
                    
                    # Create In-App notification
                    Notification.objects.create(
                        recipient=user,
                        patient=patient_profile,
                        title=f"Health Update: {campaign.title}",
                        message=f"New health campaign active: {campaign.summary or campaign.title}. Check the Health Insights for details!",
                        notification_type="HEALTH_CAMPAIGN",
                        delivery_method=delivery_method,
                        status='DELIVERED',
                        metadata={'campaign_id': campaign.id, 'action': 'active_alert'}
                    )
                    sent_count += 1

                    # Handle Email for patients
                    if is_patient:
                        context = {
                            'user': user,
                            'campaign': campaign,
                            'campaign_title': campaign.title,
                            'campaign_description': campaign.description,
                            'campaign_summary': campaign.summary,
                        }
                        success = EmailService.send_template_email(
                            template_name='health_alert',
                            context=context,
                            recipient_email=user.email,
                            subject=f"Health Update: {campaign.title}"
                        )
                        if success:
                            email_count += 1
                            
            except Exception as e:
                logger.warning(f"Failed to process campaign notification for {user.email}: {e}")

        logger.info(f"Campaign {campaign_id} notifications complete: {sent_count} in-app, {email_count} emails.")
        return True

    except HealthCampaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found for notification task.")
        return False
    except Exception as e:
        logger.error(f"Error in send_campaign_notifications_task: {e}", exc_info=True)
        return False
