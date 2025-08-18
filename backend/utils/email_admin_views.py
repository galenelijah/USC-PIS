"""
Admin views for email automation and system monitoring
Provides web interface for managing email systems
"""
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from functools import wraps
from io import StringIO
import logging

from authentication.models import User
from patients.models import MedicalRecord, DentalRecord
from .email_service import EmailService
from .health_checks import HealthChecker

logger = logging.getLogger(__name__)

def admin_required(view_func):
    """Decorator to ensure only admin/staff can access email admin functions"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        if request.user.role not in ['ADMIN', 'STAFF', 'DOCTOR']:
            return JsonResponse({'error': 'Admin access required'}, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def email_system_status(request):
    """Get current email system status and configuration"""
    try:
        # Get email backend info
        email_backend = getattr(settings, 'EMAIL_BACKEND', 'Not configured')
        
        # Check if it's using console backend (development)
        is_development = 'console' in email_backend.lower()
        
        # Get recent email activity (approximate from recent visits)
        recent_visits = MedicalRecord.objects.filter(
            visit_date__gte=timezone.now().date() - timedelta(days=7)
        ).count()
        
        status = {
            'email_backend': email_backend,
            'is_development_mode': is_development,
            'smtp_host': getattr(settings, 'EMAIL_HOST', 'Not set'),
            'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set'),
            'recent_visits_7_days': recent_visits,
            'estimated_feedback_emails': recent_visits,  # Approximate
            'system_health': 'operational' if not is_development else 'development',
            'last_updated': timezone.now().isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'data': status
        })
        
    except Exception as e:
        logger.error(f"Error getting email system status: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def test_email_system(request):
    """Test email system by sending test emails"""
    try:
        data = request.data
        test_email = data.get('email')
        test_types = data.get('types', ['feedback'])  # Default to feedback only
        dry_run = data.get('dry_run', False)
        
        if not test_email:
            return JsonResponse({
                'success': False,
                'error': 'Email address required'
            }, status=400)
        
        results = {
            'sent': 0,
            'failed': 0,
            'skipped': 0,
            'details': []
        }
        
        # Test each requested email type
        for test_type in test_types:
            try:
                if test_type == 'feedback':
                    result = _test_feedback_email(test_email, dry_run)
                elif test_type == 'welcome':
                    result = _test_welcome_email(test_email, dry_run)
                elif test_type == 'certificate':
                    result = _test_certificate_email(test_email, dry_run)
                elif test_type == 'health_alert':
                    result = _test_health_alert_email(test_email, dry_run)
                else:
                    result = {
                        'success': False,
                        'message': f'Unknown test type: {test_type}'
                    }
                
                results['details'].append({
                    'type': test_type,
                    **result
                })
                
                if result.get('success'):
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                results['failed'] += 1
                results['details'].append({
                    'type': test_type,
                    'success': False,
                    'message': f'Error: {str(e)}'
                })
        
        return JsonResponse({
            'success': True,
            'data': results,
            'dry_run': dry_run
        })
        
    except Exception as e:
        logger.error(f"Error testing email system: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def send_feedback_emails(request):
    """Manually trigger feedback email sending"""
    try:
        data = request.data
        hours_ago = data.get('hours', 24)
        dry_run = data.get('dry_run', False)
        
        # Capture command output
        out = StringIO()
        
        try:
            if dry_run:
                call_command('auto_send_feedback_emails', 
                           f'--hours={hours_ago}', '--dry-run', stdout=out)
            else:
                call_command('auto_send_feedback_emails', 
                           f'--hours={hours_ago}', stdout=out)
        except Exception as cmd_error:
            return JsonResponse({
                'success': False,
                'error': f'Command failed: {str(cmd_error)}'
            }, status=500)
        
        output = out.getvalue()
        
        # Parse output for results
        sent_count = 0
        error_count = 0
        
        lines = output.split('\n')
        for line in lines:
            if 'Sent' in line and 'feedback emails' in line:
                try:
                    sent_count = int(line.split('Sent ')[1].split(' feedback')[0])
                except:
                    pass
            elif 'Errors encountered:' in line:
                try:
                    error_count = int(line.split('Errors encountered: ')[1])
                except:
                    pass
        
        return JsonResponse({
            'success': True,
            'data': {
                'sent_count': sent_count,
                'error_count': error_count,
                'hours_ago': hours_ago,
                'dry_run': dry_run,
                'output': output
            }
        })
        
    except Exception as e:
        logger.error(f"Error sending feedback emails: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def send_health_alert(request):
    """Manually trigger system health alert"""
    try:
        data = request.data
        alert_level = data.get('alert_level', 'warning')
        force_alert = data.get('force_alert', False)
        dry_run = data.get('dry_run', False)
        
        # Capture command output
        out = StringIO()
        
        cmd_args = [f'--alert-level={alert_level}']
        if force_alert:
            cmd_args.append('--force-alert')
        if dry_run:
            cmd_args.append('--dry-run')
        
        try:
            call_command('health_check_alerts', *cmd_args, stdout=out)
        except Exception as cmd_error:
            return JsonResponse({
                'success': False,
                'error': f'Command failed: {str(cmd_error)}'
            }, status=500)
        
        output = out.getvalue()
        
        # Check if alert was sent
        alert_sent = 'Alert email sent' in output or 'would be sent' in output
        
        return JsonResponse({
            'success': True,
            'data': {
                'alert_sent': alert_sent,
                'alert_level': alert_level,
                'force_alert': force_alert,
                'dry_run': dry_run,
                'output': output
            }
        })
        
    except Exception as e:
        logger.error(f"Error sending health alert: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def email_automation_stats(request):
    """Get statistics about email automation"""
    try:
        # Get recent visit stats for feedback emails
        now = timezone.now()
        
        # Visits in different time periods
        visits_today = MedicalRecord.objects.filter(
            visit_date=now.date()
        ).count()
        
        visits_yesterday = MedicalRecord.objects.filter(
            visit_date=now.date() - timedelta(days=1)
        ).count()
        
        visits_week = MedicalRecord.objects.filter(
            visit_date__gte=now.date() - timedelta(days=7)
        ).count()
        
        visits_month = MedicalRecord.objects.filter(
            visit_date__gte=now.date() - timedelta(days=30)
        ).count()
        
        # System health status
        health_checker = HealthChecker()
        health_status = health_checker.run_all_checks()
        
        stats = {
            'visits': {
                'today': visits_today,
                'yesterday': visits_yesterday,
                'last_7_days': visits_week,
                'last_30_days': visits_month
            },
            'estimated_feedback_emails': {
                'pending_today': visits_today,  # Assumes 24hr delay
                'pending_yesterday': visits_yesterday,
            },
            'system_health': {
                'overall_status': health_status['overall_status'],
                'health_percentage': health_status['summary']['health_percentage'],
                'healthy_checks': health_status['summary']['healthy'],
                'warning_checks': health_status['summary']['warnings'],
                'unhealthy_checks': health_status['summary']['unhealthy']
            },
            'last_updated': timezone.now().isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting email automation stats: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# Helper functions for email testing
def _test_feedback_email(email, dry_run):
    """Test feedback email"""
    try:
        if dry_run:
            return {
                'success': True,
                'message': f'Would send feedback email to {email}'
            }
        
        # Create mock medical record for testing
        class MockPatient:
            def __init__(self):
                self.user = MockUser()
                
            def get_full_name(self):
                return "Test Patient"
        
        class MockUser:
            def __init__(self):
                self.email = email
                self.first_name = "Test"
                
        class MockRecord:
            def __init__(self):
                self.patient = MockPatient()
                self.visit_date = timezone.now().date()
                self.id = 999
                self.diagnosis = "Test diagnosis"
                
        mock_record = MockRecord()
        success = EmailService.send_feedback_request_email(mock_record)
        
        return {
            'success': success,
            'message': f'Feedback email {"sent" if success else "failed"} to {email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error sending feedback email: {str(e)}'
        }

def _test_welcome_email(email, dry_run):
    """Test welcome email"""
    try:
        if dry_run:
            return {
                'success': True,
                'message': f'Would send welcome email to {email}'
            }
        
        # Create mock user for testing
        class MockUser:
            def __init__(self):
                self.email = email
                self.first_name = "Test"
                self.last_name = "User"
                
            def get_full_name(self):
                return f"{self.first_name} {self.last_name}"
        
        mock_user = MockUser()
        success = EmailService.send_welcome_email(mock_user)
        
        return {
            'success': success,
            'message': f'Welcome email {"sent" if success else "failed"} to {email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error sending welcome email: {str(e)}'
        }

def _test_certificate_email(email, dry_run):
    """Test certificate email"""
    try:
        if dry_run:
            return {
                'success': True,
                'message': f'Would send certificate email to {email}'
            }
        
        # Create mock certificate for testing
        class MockPatient:
            def __init__(self):
                self.user = MockUser()
                
        class MockUser:
            def __init__(self):
                self.email = email
                
        class MockCertificate:
            def __init__(self):
                self.patient = MockPatient()
                self.id = 999
                self.purpose = "Testing"
                self.created_at = timezone.now()
        
        mock_cert = MockCertificate()
        EmailService.send_medical_certificate_notification(mock_cert, 'created')
        
        return {
            'success': True,
            'message': f'Certificate email sent to {email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error sending certificate email: {str(e)}'
        }

def _test_health_alert_email(email, dry_run):
    """Test health alert email"""
    try:
        if dry_run:
            return {
                'success': True,
                'message': f'Would send health alert email to administrators'
            }
        
        # Run health check alert command
        out = StringIO()
        call_command('health_check_alerts', '--force-alert', stdout=out)
        
        output = out.getvalue()
        success = 'Alert email sent' in output
        
        return {
            'success': success,
            'message': f'Health alert email {"sent" if success else "failed"} to administrators'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error sending health alert email: {str(e)}'
        }