"""
Comprehensive health check system for USC-PIS
"""
import logging
import time
from django.db import connection, connections
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from .models import BackupStatus
from patients.models import Patient, MedicalRecord
from authentication.models import User

logger = logging.getLogger('system.health')

class HealthChecker:
    """Comprehensive system health monitoring"""
    
    def __init__(self):
        self.checks = {
            'database': self.check_database,
            'cache': self.check_cache,
            'backup_system': self.check_backup_system,
            'email_system': self.check_email_system,
            'file_storage': self.check_file_storage,
            'performance': self.check_performance,
            'security': self.check_security,
        }
    
    def run_all_checks(self):
        """Run all health checks and return comprehensive status"""
        results = {}
        overall_status = 'healthy'
        
        for check_name, check_func in self.checks.items():
            try:
                start_time = time.time()
                result = check_func()
                duration = time.time() - start_time
                
                results[check_name] = {
                    **result,
                    'check_duration': f"{duration:.3f}s"
                }
                
                if result['status'] == 'unhealthy':
                    overall_status = 'unhealthy'
                elif result['status'] == 'warning' and overall_status == 'healthy':
                    overall_status = 'warning'
                    
            except Exception as e:
                logger.error(f"Health check '{check_name}' failed: {str(e)}")
                results[check_name] = {
                    'status': 'unhealthy',
                    'message': f"Check failed: {str(e)}",
                    'check_duration': 'failed'
                }
                overall_status = 'unhealthy'
        
        return {
            'overall_status': overall_status,
            'timestamp': timezone.now().isoformat(),
            'checks': results,
            'summary': self._generate_summary(results)
        }
    
    def check_database(self):
        """Check database connectivity and performance"""
        try:
            # Test primary database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            
            if result[0] != 1:
                return {'status': 'unhealthy', 'message': 'Database query failed'}
            
            # Check database performance
            start_time = time.time()
            patient_count = Patient.objects.count()
            user_count = User.objects.count()
            record_count = MedicalRecord.objects.count()
            query_time = time.time() - start_time
            
            # Warning if queries take too long
            status = 'warning' if query_time > 1.0 else 'healthy'
            
            return {
                'status': status,
                'message': f'Database operational - {patient_count} patients, {user_count} users, {record_count} records',
                'metrics': {
                    'patients': patient_count,
                    'users': user_count,
                    'medical_records': record_count,
                    'query_time': f"{query_time:.3f}s"
                }
            }
            
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Database error: {str(e)}'}
    
    def check_cache(self):
        """Check cache system functionality"""
        try:
            # Test cache read/write
            test_key = 'health_check_test'
            test_value = f'test_{int(time.time())}'
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            cache.delete(test_key)
            
            if retrieved_value != test_value:
                return {'status': 'unhealthy', 'message': 'Cache read/write failed'}
            
            return {
                'status': 'healthy',
                'message': 'Cache system operational',
                'metrics': {
                    'backend': getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', 'Unknown')
                }
            }
            
        except Exception as e:
            return {'status': 'warning', 'message': f'Cache error: {str(e)}'}
    
    def check_backup_system(self):
        """Check backup system health"""
        try:
            # Check recent backup status
            recent_backups = BackupStatus.objects.filter(
                created_at__gte=timezone.now() - timezone.timedelta(days=7)
            ).order_by('-created_at')[:5]
            
            if not recent_backups.exists():
                return {
                    'status': 'warning',
                    'message': 'No backups found in last 7 days',
                    'metrics': {'recent_backups': 0}
                }
            
            successful_backups = recent_backups.filter(status='completed').count()
            failed_backups = recent_backups.filter(status='failed').count()
            
            if failed_backups > successful_backups:
                status = 'unhealthy'
                message = f'More failed ({failed_backups}) than successful ({successful_backups}) backups'
            elif failed_backups > 0:
                status = 'warning'
                message = f'{successful_backups} successful, {failed_backups} failed backups in last 7 days'
            else:
                status = 'healthy'
                message = f'{successful_backups} successful backups in last 7 days'
            
            return {
                'status': status,
                'message': message,
                'metrics': {
                    'total_backups': recent_backups.count(),
                    'successful_backups': successful_backups,
                    'failed_backups': failed_backups,
                    'last_backup': recent_backups.first().created_at.isoformat() if recent_backups.exists() else None
                }
            }
            
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Backup system error: {str(e)}'}
    
    def check_email_system(self):
        """Check email system configuration"""
        try:
            email_backend = getattr(settings, 'EMAIL_BACKEND', 'Not configured')
            
            if 'console' in email_backend.lower():
                status = 'warning'
                message = 'Email using console backend (development mode)'
            elif not getattr(settings, 'EMAIL_HOST_PASSWORD', None):
                status = 'warning'
                message = 'Email host password not configured'
            else:
                status = 'healthy'
                message = 'Email system configured'
            
            return {
                'status': status,
                'message': message,
                'metrics': {
                    'backend': email_backend,
                    'host': getattr(settings, 'EMAIL_HOST', 'Not set'),
                    'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')
                }
            }
            
        except Exception as e:
            return {'status': 'warning', 'message': f'Email system check error: {str(e)}'}
    
    def check_file_storage(self):
        """Check file storage system"""
        try:
            # Check if Cloudinary is configured
            cloudinary_configured = bool(getattr(settings, 'CLOUDINARY_STORAGE', None))
            
            if cloudinary_configured:
                status = 'healthy'
                message = 'Cloudinary storage configured'
            else:
                status = 'warning'
                message = 'Local file storage only (ephemeral on Heroku)'
            
            return {
                'status': status,
                'message': message,
                'metrics': {
                    'cloudinary_configured': cloudinary_configured,
                    'media_root': getattr(settings, 'MEDIA_ROOT', 'Not set'),
                    'static_root': getattr(settings, 'STATIC_ROOT', 'Not set')
                }
            }
            
        except Exception as e:
            return {'status': 'warning', 'message': f'File storage check error: {str(e)}'}
    
    def check_performance(self):
        """Check system performance metrics"""
        try:
            # Check middleware configuration
            middleware = getattr(settings, 'MIDDLEWARE', [])
            rate_limiting_enabled = any('RateLimitMiddleware' in mw for mw in middleware)
            security_headers_enabled = any('SecurityHeadersMiddleware' in mw for mw in middleware)
            
            # Check debug mode (should be False in production)
            debug_mode = getattr(settings, 'DEBUG', True)
            
            performance_issues = []
            if debug_mode:
                performance_issues.append('DEBUG mode enabled (should be False in production)')
            if not rate_limiting_enabled:
                performance_issues.append('Rate limiting not enabled')
            if not security_headers_enabled:
                performance_issues.append('Security headers middleware not enabled')
            
            if performance_issues:
                status = 'warning'
                message = f'Performance issues: {", ".join(performance_issues)}'
            else:
                status = 'healthy'
                message = 'Performance configuration optimal'
            
            return {
                'status': status,
                'message': message,
                'metrics': {
                    'debug_mode': debug_mode,
                    'rate_limiting': rate_limiting_enabled,
                    'security_headers': security_headers_enabled,
                    'middleware_count': len(middleware)
                }
            }
            
        except Exception as e:
            return {'status': 'warning', 'message': f'Performance check error: {str(e)}'}
    
    def check_security(self):
        """Check security configuration"""
        try:
            security_issues = []
            
            # Check critical security settings
            if getattr(settings, 'DEBUG', True):
                security_issues.append('DEBUG mode enabled')
            
            if not getattr(settings, 'SECURE_SSL_REDIRECT', False):
                security_issues.append('SSL redirect not enforced')
            
            if not getattr(settings, 'SECURE_HSTS_SECONDS', 0):
                security_issues.append('HSTS not configured')
            
            rate_limit_enabled = getattr(settings, 'RATE_LIMIT_ENABLED', False)
            if not rate_limit_enabled:
                security_issues.append('Rate limiting disabled')
            
            # Check allowed hosts
            allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
            if '*' in allowed_hosts:
                security_issues.append('Wildcard in ALLOWED_HOSTS')
            
            if security_issues:
                status = 'warning'
                message = f'Security issues: {", ".join(security_issues)}'
            else:
                status = 'healthy'
                message = 'Security configuration optimal'
            
            return {
                'status': status,
                'message': message,
                'metrics': {
                    'issues_count': len(security_issues),
                    'rate_limiting': rate_limit_enabled,
                    'allowed_hosts_count': len(allowed_hosts),
                    'hsts_enabled': bool(getattr(settings, 'SECURE_HSTS_SECONDS', 0))
                }
            }
            
        except Exception as e:
            return {'status': 'warning', 'message': f'Security check error: {str(e)}'}
    
    def _generate_summary(self, results):
        """Generate a summary of health check results"""
        healthy_count = sum(1 for r in results.values() if r['status'] == 'healthy')
        warning_count = sum(1 for r in results.values() if r['status'] == 'warning')
        unhealthy_count = sum(1 for r in results.values() if r['status'] == 'unhealthy')
        
        return {
            'total_checks': len(results),
            'healthy': healthy_count,
            'warnings': warning_count,
            'unhealthy': unhealthy_count,
            'health_percentage': round((healthy_count / len(results)) * 100, 1) if results else 0
        }


def quick_health_check():
    """Quick health check for API endpoints"""
    try:
        # Quick database check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'message': 'System operational'
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'message': f'System error: {str(e)}'
        }