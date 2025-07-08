from django.core.mail import send_mail, EmailMessage
from django.template import Template, Context
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.db import models
from datetime import datetime, timedelta
import logging
import json
from typing import List, Dict, Any, Optional

from .models import (
    Notification, 
    NotificationTemplate, 
    NotificationLog, 
    NotificationPreference,
    NotificationCampaign
)
from authentication.models import User
from patients.models import Patient

logger = logging.getLogger(__name__)


class NotificationTemplateService:
    """Service for managing notification templates"""
    
    @staticmethod
    def render_template(template: NotificationTemplate, context_data: Dict[str, Any]) -> Dict[str, str]:
        """Render template with provided context data"""
        try:
            subject_template = Template(template.subject_template)
            body_template = Template(template.body_template)
            
            context = Context(context_data)
            
            rendered_subject = subject_template.render(context)
            rendered_body = body_template.render(context)
            
            return {
                'subject': rendered_subject,
                'body': rendered_body,
                'success': True
            }
        except Exception as e:
            logger.error(f"Template rendering failed: {str(e)}")
            return {
                'subject': template.subject_template,
                'body': template.body_template,
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_default_context(user: User, patient: Optional[Patient] = None) -> Dict[str, Any]:
        """Get default context variables for templates"""
        context = {
            'user_name': f"{user.first_name} {user.last_name}",
            'user_first_name': user.first_name,
            'user_last_name': user.last_name,
            'user_email': user.email,
            'clinic_name': 'USC Health Services',
            'clinic_phone': '(032) 123-4567',
            'clinic_email': 'health@usc.edu.ph',
            'current_date': timezone.now().strftime('%B %d, %Y'),
            'current_time': timezone.now().strftime('%I:%M %p'),
        }
        
        if patient:
            context.update({
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'patient_first_name': patient.first_name,
                'patient_last_name': patient.last_name,
                'patient_email': patient.email,
                'patient_phone': patient.phone_number,
            })
        
        return context


class EmailService:
    """Service for sending email notifications"""
    
    @staticmethod
    def send_notification_email(notification: Notification) -> Dict[str, Any]:
        """Send email notification"""
        try:
            # Check if email is enabled for user
            prefs = NotificationPreference.objects.filter(user=notification.recipient).first()
            if prefs and not prefs.email_enabled:
                return {
                    'success': False,
                    'error': 'Email notifications disabled for user',
                    'skipped': True
                }
            
            # Check if specific notification type is enabled
            if prefs and not prefs.is_notification_type_enabled(notification.notification_type):
                return {
                    'success': False,
                    'error': f'{notification.notification_type} notifications disabled for user',
                    'skipped': True
                }
            
            # Create email message
            email = EmailMessage(
                subject=notification.title,
                body=EmailService._create_email_body(notification),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[notification.recipient.email],
            )
            
            # Set content type to HTML
            email.content_subtype = 'html'
            
            # Send email
            result = email.send()
            
            if result:
                notification.mark_as_sent()
                EmailService._log_email_success(notification, email)
                return {
                    'success': True,
                    'message_id': getattr(email, 'message_id', None)
                }
            else:
                EmailService._log_email_failure(notification, 'Failed to send email')
                return {
                    'success': False,
                    'error': 'Failed to send email'
                }
                
        except Exception as e:
            logger.error(f"Email sending failed for notification {notification.id}: {str(e)}")
            EmailService._log_email_failure(notification, str(e))
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _create_email_body(notification: Notification) -> str:
        """Create HTML email body"""
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{notification.title}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .message {{ background-color: white; padding: 20px; border-radius: 5px; margin: 10px 0; }}
                .priority-{notification.priority.lower()} {{ border-left: 4px solid {'#f44336' if notification.priority == 'URGENT' else '#ff9800' if notification.priority == 'HIGH' else '#2196f3' if notification.priority == 'MEDIUM' else '#4caf50'}; }}
                .action-button {{ 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #1976d2; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 15px 0;
                }}
                .footer {{ text-align: center; color: #666; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>USC Health Services</h1>
                    <p>Patient Information System</p>
                </div>
                <div class="content">
                    <div class="message priority-{notification.priority.lower()}">
                        <h2>{notification.title}</h2>
                        <p><strong>Priority:</strong> {notification.get_priority_display()}</p>
                        <div>{notification.message.replace(chr(10), '<br>')}</div>
                        
                        {f'<a href="{notification.action_url}" class="action-button">{notification.action_text}</a>' if notification.action_url and notification.action_text else ''}
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated message from USC Health Services.</p>
                    <p>If you have questions, please contact us at health@usc.edu.ph or (032) 123-4567.</p>
                    <p>To manage your notification preferences, log in to the USC Patient Information System.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_body
    
    @staticmethod
    def _log_email_success(notification: Notification, email: EmailMessage):
        """Log successful email sending"""
        NotificationLog.objects.create(
            notification=notification,
            action='SENT',
            details=f'Email sent successfully to {notification.recipient.email}',
            email_message_id=getattr(email, 'message_id', ''),
            metadata={'email_to': notification.recipient.email}
        )
    
    @staticmethod
    def _log_email_failure(notification: Notification, error_message: str):
        """Log email sending failure"""
        NotificationLog.objects.create(
            notification=notification,
            action='FAILED',
            details=f'Email sending failed: {error_message}',
            error_message=error_message,
            metadata={'email_to': notification.recipient.email}
        )


class NotificationService:
    """Main service for managing notifications"""
    
    @staticmethod
    def create_notification(
        recipient: User,
        notification_type: str,
        title: str,
        message: str,
        priority: str = 'MEDIUM',
        delivery_method: str = 'BOTH',
        scheduled_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        patient: Optional[Patient] = None,
        template: Optional[NotificationTemplate] = None,
        action_url: Optional[str] = None,
        action_text: Optional[str] = None,
        metadata: Optional[Dict] = None,
        created_by: Optional[User] = None
    ) -> Notification:
        """Create a new notification"""
        
        notification = Notification.objects.create(
            recipient=recipient,
            patient=patient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            delivery_method=delivery_method,
            scheduled_at=scheduled_at,
            expires_at=expires_at,
            template=template,
            action_url=action_url,
            action_text=action_text,
            metadata=metadata or {},
            created_by=created_by
        )
        
        # Log creation
        NotificationLog.objects.create(
            notification=notification,
            action='CREATED',
            details=f'Notification created for {recipient.email}'
        )
        
        # If not scheduled, send immediately
        if not scheduled_at:
            NotificationService.send_notification(notification)
        else:
            NotificationLog.objects.create(
                notification=notification,
                action='SCHEDULED',
                details=f'Notification scheduled for {scheduled_at}'
            )
        
        return notification
    
    @staticmethod
    def create_from_template(
        template: NotificationTemplate,
        recipient: User,
        context_data: Dict[str, Any],
        priority: str = 'MEDIUM',
        delivery_method: str = 'BOTH',
        scheduled_at: Optional[datetime] = None,
        patient: Optional[Patient] = None,
        created_by: Optional[User] = None
    ) -> Notification:
        """Create notification from template"""
        
        # Render template
        rendered = NotificationTemplateService.render_template(template, context_data)
        
        return NotificationService.create_notification(
            recipient=recipient,
            notification_type=template.template_type,
            title=rendered['subject'],
            message=rendered['body'],
            priority=priority,
            delivery_method=delivery_method,
            scheduled_at=scheduled_at,
            patient=patient,
            template=template,
            metadata={'template_rendered': rendered['success']},
            created_by=created_by
        )
    
    @staticmethod
    def send_notification(notification: Notification) -> Dict[str, Any]:
        """Send a notification via configured delivery methods"""
        results = {'email': None, 'in_app': None}
        
        # Check if notification is expired
        if notification.is_expired:
            notification.status = 'CANCELLED'
            notification.save()
            return {'success': False, 'error': 'Notification has expired'}
        
        # Send email if configured
        if notification.delivery_method in ['EMAIL', 'BOTH']:
            results['email'] = EmailService.send_notification_email(notification)
        
        # Mark as delivered for in-app (always available for reading)
        if notification.delivery_method in ['IN_APP', 'BOTH']:
            notification.mark_as_delivered()
            results['in_app'] = {'success': True, 'message': 'In-app notification delivered'}
        
        # Update overall status
        if results['email'] and not results['email'].get('success', False):
            notification.mark_as_failed()
        elif not notification.is_read and notification.status not in ['DELIVERED', 'READ']:
            notification.mark_as_delivered()
        
        return results
    
    @staticmethod
    def send_scheduled_notifications():
        """Send all scheduled notifications that are due"""
        now = timezone.now()
        
        pending_notifications = Notification.objects.filter(
            status='PENDING',
            scheduled_at__lte=now
        ).exclude(expires_at__lt=now)
        
        results = []
        for notification in pending_notifications:
            try:
                result = NotificationService.send_notification(notification)
                results.append({'notification_id': notification.id, 'result': result})
            except Exception as e:
                logger.error(f"Failed to send scheduled notification {notification.id}: {str(e)}")
                notification.mark_as_failed()
                results.append({'notification_id': notification.id, 'error': str(e)})
        
        return results
    
    @staticmethod
    def retry_failed_notifications():
        """Retry failed notifications that haven't exceeded max retries"""
        failed_notifications = Notification.objects.filter(
            status='FAILED',
            retry_count__lt=models.F('max_retries')
        )
        
        results = []
        for notification in failed_notifications:
            try:
                notification.status = 'PENDING'
                notification.retry_count += 1
                notification.last_retry_at = timezone.now()
                notification.save()
                
                result = NotificationService.send_notification(notification)
                results.append({'notification_id': notification.id, 'result': result})
                
                # Log retry attempt
                NotificationLog.objects.create(
                    notification=notification,
                    action='RETRY',
                    details=f'Retry attempt #{notification.retry_count}'
                )
                
            except Exception as e:
                logger.error(f"Retry failed for notification {notification.id}: {str(e)}")
                notification.mark_as_failed()
                results.append({'notification_id': notification.id, 'error': str(e)})
        
        return results


class CampaignService:
    """Service for managing notification campaigns"""
    
    @staticmethod
    def create_campaign_notifications(campaign: NotificationCampaign) -> Dict[str, Any]:
        """Create notifications for all campaign recipients"""
        
        if campaign.status != 'ACTIVE':
            return {'success': False, 'error': 'Campaign is not active'}
        
        # Get target audience
        recipients = CampaignService._get_campaign_recipients(campaign)
        
        created_count = 0
        failed_count = 0
        
        with transaction.atomic():
            for recipient in recipients:
                try:
                    # Get context data for template
                    context_data = NotificationTemplateService.get_default_context(recipient)
                    
                    # Add custom context if needed
                    context_data.update({
                        'campaign_name': campaign.name,
                        'campaign_description': campaign.description,
                    })
                    
                    # Create notification
                    notification = NotificationService.create_from_template(
                        template=campaign.template,
                        recipient=recipient,
                        context_data=context_data,
                        scheduled_at=campaign.scheduled_start,
                        created_by=campaign.created_by
                    )
                    
                    created_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to create notification for recipient {recipient.id}: {str(e)}")
                    failed_count += 1
            
            # Update campaign statistics
            campaign.total_recipients = len(recipients)
            campaign.sent_count = created_count
            campaign.failed_count = failed_count
            campaign.save()
        
        return {
            'success': True,
            'created_count': created_count,
            'failed_count': failed_count,
            'total_recipients': len(recipients)
        }
    
    @staticmethod
    def _get_campaign_recipients(campaign: NotificationCampaign) -> List[User]:
        """Get list of recipients for campaign based on audience type"""
        
        if campaign.audience_type == 'ALL_USERS':
            return list(User.objects.filter(is_active=True))
        
        elif campaign.audience_type == 'ALL_PATIENTS':
            patient_user_ids = Patient.objects.values_list('user_id', flat=True)
            return list(User.objects.filter(id__in=patient_user_ids, is_active=True))
        
        elif campaign.audience_type == 'ROLE_BASED':
            return list(User.objects.filter(role__in=campaign.target_roles, is_active=True))
        
        elif campaign.audience_type == 'CUSTOM_LIST':
            return list(campaign.target_users.filter(is_active=True))
        
        elif campaign.audience_type == 'PATIENT_CONDITION':
            # This would require additional logic based on patient conditions
            # For now, return all patients
            patient_user_ids = Patient.objects.values_list('user_id', flat=True)
            return list(User.objects.filter(id__in=patient_user_ids, is_active=True))
        
        return []
    
    @staticmethod
    def update_campaign_statistics(campaign: NotificationCampaign):
        """Update campaign statistics based on notification statuses"""
        
        # Get all notifications for this campaign
        campaign_notifications = Notification.objects.filter(
            template=campaign.template,
            created_at__gte=campaign.created_at
        )
        
        # Update counts
        campaign.sent_count = campaign_notifications.filter(status__in=['SENT', 'DELIVERED', 'READ']).count()
        campaign.delivered_count = campaign_notifications.filter(status__in=['DELIVERED', 'READ']).count()
        campaign.read_count = campaign_notifications.filter(status='READ').count()
        campaign.failed_count = campaign_notifications.filter(status='FAILED').count()
        
        campaign.save()
        
        return {
            'sent_count': campaign.sent_count,
            'delivered_count': campaign.delivered_count,
            'read_count': campaign.read_count,
            'failed_count': campaign.failed_count,
            'success_rate': campaign.success_rate,
            'engagement_rate': campaign.engagement_rate
        }