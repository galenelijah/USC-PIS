import os
import logging
import threading
import time
from datetime import datetime, timedelta
from django.core.cache import cache
from django.db import connection, connections
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from typing import Dict, List, Optional, Callable, Tuple
import json
import gc
import shutil
import tempfile

# Optional dependencies
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    psutil = None

logger = logging.getLogger(__name__)

class DatabaseHealthMonitor:
    """Monitor database health and performance."""
    
    def __init__(self):
        self.connection_threshold = 80  # Percentage of max connections
        self.query_time_threshold = 5.0  # Seconds
        self.check_interval = 60  # Seconds
        self.monitoring = False
        self.alerts_sent = set()
        
    def start_monitoring(self):
        """Start continuous database monitoring."""
        if self.monitoring:
            return
            
        self.monitoring = True
        monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()
        logger.info("Database health monitoring started")
    
    def stop_monitoring(self):
        """Stop database monitoring."""
        self.monitoring = False
        logger.info("Database health monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.monitoring:
            try:
                health_status = self.check_health()
                self._handle_health_status(health_status)
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Database monitoring error: {e}")
                time.sleep(30)  # Wait longer on error
    
    def check_health(self) -> Dict:
        """Comprehensive database health check."""
        health_status = {
            'timestamp': timezone.now().isoformat(),
            'overall_status': 'healthy',
            'checks': {}
        }
        
        try:
            # Connection check
            health_status['checks']['connection'] = self._check_connections()
            
            # Query performance check
            health_status['checks']['performance'] = self._check_query_performance()
            
            # Database size check
            health_status['checks']['storage'] = self._check_database_size()
            
            # Lock check
            health_status['checks']['locks'] = self._check_database_locks()
            
            # Index health check
            health_status['checks']['indexes'] = self._check_index_health()
            
            # Determine overall status
            failed_checks = [check for check in health_status['checks'].values() 
                           if check['status'] != 'healthy']
            
            if failed_checks:
                critical_failures = [check for check in failed_checks 
                                   if check.get('severity') == 'critical']
                if critical_failures:
                    health_status['overall_status'] = 'critical'
                else:
                    health_status['overall_status'] = 'warning'
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            health_status['overall_status'] = 'error'
            health_status['error'] = str(e)
        
        # Cache the status
        cache.set('db_health_status', health_status, timeout=300)
        
        return health_status
    
    def _check_connections(self) -> Dict:
        """Check database connection health."""
        try:
            with connection.cursor() as cursor:
                # Check connection count (PostgreSQL)
                if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                    cursor.execute("""
                        SELECT count(*) as active_connections,
                               setting::int as max_connections
                        FROM pg_stat_activity, pg_settings 
                        WHERE pg_settings.name = 'max_connections'
                        GROUP BY setting
                    """)
                    result = cursor.fetchone()
                    if result:
                        active, max_conn = result
                        usage_percent = (active / max_conn) * 100
                        
                        status = 'healthy'
                        if usage_percent > 90:
                            status = 'critical'
                        elif usage_percent > self.connection_threshold:
                            status = 'warning'
                        
                        return {
                            'status': status,
                            'active_connections': active,
                            'max_connections': max_conn,
                            'usage_percent': usage_percent,
                            'severity': 'critical' if status == 'critical' else 'warning'
                        }
                
                # Fallback for other databases
                return {
                    'status': 'healthy',
                    'message': 'Connection check passed'
                }
                
        except Exception as e:
            logger.error(f"Connection check failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'severity': 'critical'
            }
    
    def _check_query_performance(self) -> Dict:
        """Check query performance."""
        try:
            start_time = time.time()
            
            with connection.cursor() as cursor:
                # Simple performance test query
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            query_time = time.time() - start_time
            
            status = 'healthy'
            severity = 'info'
            
            if query_time > self.query_time_threshold:
                status = 'warning'
                severity = 'warning'
            
            if query_time > self.query_time_threshold * 2:
                status = 'critical'
                severity = 'critical'
            
            return {
                'status': status,
                'query_time': query_time,
                'threshold': self.query_time_threshold,
                'severity': severity
            }
            
        except Exception as e:
            logger.error(f"Performance check failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'severity': 'critical'
            }
    
    def _check_database_size(self) -> Dict:
        """Check database size and growth."""
        try:
            with connection.cursor() as cursor:
                if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                    cursor.execute("""
                        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                               pg_database_size(current_database()) as size_bytes
                    """)
                    result = cursor.fetchone()
                    if result:
                        size_pretty, size_bytes = result
                        
                        # Check if size is concerning (>80% of available space)
                        # This is a simplified check - in production, you'd want more sophisticated monitoring
                        if HAS_PSUTIL:
                            disk_usage = psutil.disk_usage('/')
                            usage_percent = (size_bytes / disk_usage.total) * 100
                            
                            status = 'healthy'
                            if usage_percent > 80:
                                status = 'critical'
                            elif usage_percent > 60:
                                status = 'warning'
                            
                            return {
                                'status': status,
                                'size': size_pretty,
                                'size_bytes': size_bytes,
                                'disk_usage_percent': usage_percent
                            }
                        else:
                            # psutil not available - just return size info
                            return {
                                'status': 'healthy',
                                'size': size_pretty,
                                'size_bytes': size_bytes,
                                'message': 'Disk usage check not available (psutil not installed)'
                            }
                
                return {
                    'status': 'healthy',
                    'message': 'Size check not available for this database type'
                }
                
        except Exception as e:
            logger.error(f"Size check failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _check_database_locks(self) -> Dict:
        """Check for problematic database locks."""
        try:
            with connection.cursor() as cursor:
                if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                    cursor.execute("""
                        SELECT count(*) as lock_count
                        FROM pg_locks 
                        WHERE NOT granted
                    """)
                    result = cursor.fetchone()
                    if result:
                        lock_count = result[0]
                        
                        status = 'healthy'
                        if lock_count > 10:
                            status = 'warning'
                        if lock_count > 50:
                            status = 'critical'
                        
                        return {
                            'status': status,
                            'blocked_locks': lock_count,
                            'severity': 'warning' if status != 'healthy' else 'info'
                        }
                
                return {
                    'status': 'healthy',
                    'message': 'Lock check not available for this database type'
                }
                
        except Exception as e:
            logger.error(f"Lock check failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _check_index_health(self) -> Dict:
        """Check index health and unused indexes."""
        try:
            with connection.cursor() as cursor:
                if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                    cursor.execute("""
                        SELECT count(*) as unused_indexes
                        FROM pg_stat_user_indexes 
                        WHERE idx_scan = 0 AND schemaname = 'public'
                    """)
                    result = cursor.fetchone()
                    if result:
                        unused_count = result[0]
                        
                        status = 'healthy'
                        if unused_count > 200:  # More reasonable threshold for development
                            status = 'warning'
                        
                        return {
                            'status': status,
                            'unused_indexes': unused_count,
                            'message': f'Found {unused_count} unused indexes'
                        }
                
                return {
                    'status': 'healthy',
                    'message': 'Index check not available for this database type'
                }
                
        except Exception as e:
            logger.error(f"Index check failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _handle_health_status(self, health_status: Dict):
        """Handle health status and send alerts if needed."""
        if health_status['overall_status'] in ['critical', 'error']:
            alert_key = f"db_critical_{datetime.now().strftime('%Y%m%d%H')}"
            
            if alert_key not in self.alerts_sent:
                self._send_alert(health_status)
                self.alerts_sent.add(alert_key)
                
                # Clean old alerts
                current_hour = datetime.now().strftime('%Y%m%d%H')
                self.alerts_sent = {key for key in self.alerts_sent 
                                  if key.endswith(current_hour)}
    
    def _send_alert(self, health_status: Dict):
        """Send alert for critical database issues."""
        try:
            if hasattr(settings, 'ADMINS') and settings.ADMINS:
                subject = f"USC-PIS Database Alert - {health_status['overall_status'].upper()}"
                message = f"""
Database Health Alert

Status: {health_status['overall_status']}
Timestamp: {health_status['timestamp']}

Failed Checks:
{json.dumps(health_status['checks'], indent=2)}

Please investigate immediately.
                """
                
                admin_emails = [email for name, email in settings.ADMINS]
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True
                )
                
                logger.critical(f"Database health alert sent: {health_status['overall_status']}")
                
        except Exception as e:
            logger.error(f"Failed to send database alert: {e}")

class SystemResourceMonitor:
    """Monitor system resources (CPU, Memory, Disk)."""
    
    def __init__(self):
        self.cpu_threshold = 80  # Percentage
        self.memory_threshold = 80  # Percentage  
        self.disk_threshold = 90  # Percentage
        self.monitoring = False
    
    def start_monitoring(self):
        """Start system resource monitoring."""
        if self.monitoring:
            return
            
        self.monitoring = True
        monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()
        logger.info("System resource monitoring started")
    
    def stop_monitoring(self):
        """Stop system monitoring."""
        self.monitoring = False
    
    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.monitoring:
            try:
                resource_status = self.check_resources()
                self._handle_resource_status(resource_status)
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Resource monitoring error: {e}")
                time.sleep(60)
    
    def check_resources(self) -> Dict:
        """Check system resources."""
        if not HAS_PSUTIL:
            logger.warning("psutil not available - system resource monitoring disabled")
            return {
                'timestamp': time.time(),
                'overall_status': 'unavailable',
                'message': 'System resource monitoring not available (psutil not installed)'
            }
        
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Process count
            process_count = len(psutil.pids())
            
            # Load average (Unix systems)
            load_avg = None
            try:
                load_avg = os.getloadavg()
            except (AttributeError, OSError):
                pass
            
            status = {
                'timestamp': timezone.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'status': 'healthy' if cpu_percent < self.cpu_threshold else 'warning'
                },
                'memory': {
                    'percent': memory.percent,
                    'available_gb': memory.available / (1024**3),
                    'total_gb': memory.total / (1024**3),
                    'status': 'healthy' if memory.percent < self.memory_threshold else 'warning'
                },
                'disk': {
                    'percent': (disk.used / disk.total) * 100,
                    'free_gb': disk.free / (1024**3),
                    'total_gb': disk.total / (1024**3),
                    'status': 'healthy' if (disk.used / disk.total) * 100 < self.disk_threshold else 'critical'
                },
                'processes': process_count,
                'load_average': load_avg
            }
            
            # Overall status
            statuses = [status['cpu']['status'], status['memory']['status'], status['disk']['status']]
            if 'critical' in statuses:
                status['overall_status'] = 'critical'
            elif 'warning' in statuses:
                status['overall_status'] = 'warning'
            else:
                status['overall_status'] = 'healthy'
            
            # Cache the status
            cache.set('system_resource_status', status, timeout=60)
            
            return status
            
        except Exception as e:
            logger.error(f"Resource check failed: {e}")
            return {
                'timestamp': timezone.now().isoformat(),
                'overall_status': 'error',
                'error': str(e)
            }
    
    def _handle_resource_status(self, resource_status: Dict):
        """Handle resource status and take action if needed."""
        if resource_status.get('overall_status') == 'critical':
            # Log critical resource usage
            logger.critical(f"Critical resource usage: {resource_status}")
            
            # Attempt automated recovery
            self._attempt_recovery(resource_status)
    
    def _attempt_recovery(self, resource_status: Dict):
        """Attempt automated recovery for resource issues."""
        try:
            # Memory cleanup
            if resource_status.get('memory', {}).get('status') == 'critical':
                # Force garbage collection
                gc.collect()
                
                # Clear Django cache
                cache.clear()
                
                logger.info("Performed memory cleanup")
            
            # Disk cleanup (basic)
            if resource_status.get('disk', {}).get('status') == 'critical':
                # Clean temporary files
                self._clean_temp_files()
                
                logger.info("Performed disk cleanup")
                
        except Exception as e:
            logger.error(f"Recovery attempt failed: {e}")
    
    def _clean_temp_files(self):
        """Clean temporary files."""
        try:
            temp_dir = tempfile.gettempdir()
            
            # Clean files older than 1 day in temp directory
            cutoff_time = time.time() - (24 * 60 * 60)  # 24 hours ago
            
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        if os.path.getmtime(file_path) < cutoff_time:
                            os.remove(file_path)
                    except (OSError, IOError):
                        continue
                        
        except Exception as e:
            logger.error(f"Temp file cleanup failed: {e}")

class PerformanceMonitor:
    """Monitor application performance metrics."""
    
    def __init__(self):
        self.request_times = []
        self.error_counts = {}
        self.monitoring = False
    
    def record_request(self, request_time: float, endpoint: str, status_code: int):
        """Record request performance."""
        try:
            # Keep only last 1000 requests
            if len(self.request_times) >= 1000:
                self.request_times.pop(0)
            
            self.request_times.append({
                'time': request_time,
                'endpoint': endpoint,
                'status_code': status_code,
                'timestamp': timezone.now()
            })
            
            # Track error counts
            if status_code >= 400:
                hour_key = timezone.now().strftime('%Y%m%d%H')
                if hour_key not in self.error_counts:
                    self.error_counts[hour_key] = 0
                self.error_counts[hour_key] += 1
                
                # Clean old error counts
                current_hour = timezone.now().strftime('%Y%m%d%H')
                cutoff_hour = (timezone.now() - timedelta(hours=24)).strftime('%Y%m%d%H')
                self.error_counts = {k: v for k, v in self.error_counts.items() 
                                   if k >= cutoff_hour}
            
        except Exception as e:
            logger.error(f"Performance recording failed: {e}")
    
    def get_performance_stats(self) -> Dict:
        """Get performance statistics."""
        try:
            if not self.request_times:
                return {'status': 'no_data'}
            
            recent_requests = [r for r in self.request_times 
                             if (timezone.now() - r['timestamp']).seconds < 3600]  # Last hour
            
            if not recent_requests:
                return {'status': 'no_recent_data'}
            
            response_times = [r['time'] for r in recent_requests]
            
            stats = {
                'timestamp': timezone.now().isoformat(),
                'total_requests': len(recent_requests),
                'avg_response_time': sum(response_times) / len(response_times),
                'max_response_time': max(response_times),
                'min_response_time': min(response_times),
                'error_rate': len([r for r in recent_requests if r['status_code'] >= 400]) / len(recent_requests),
                'status_codes': {}
            }
            
            # Count status codes
            for request in recent_requests:
                code = request['status_code']
                stats['status_codes'][code] = stats['status_codes'].get(code, 0) + 1
            
            # Determine status
            if stats['avg_response_time'] > 2.0 or stats['error_rate'] > 0.1:
                stats['status'] = 'warning'
            elif stats['avg_response_time'] > 5.0 or stats['error_rate'] > 0.2:
                stats['status'] = 'critical'
            else:
                stats['status'] = 'healthy'
            
            return stats
            
        except Exception as e:
            logger.error(f"Performance stats calculation failed: {e}")
            return {'status': 'error', 'error': str(e)}

# Global monitor instances
db_monitor = DatabaseHealthMonitor()
resource_monitor = SystemResourceMonitor()
performance_monitor = PerformanceMonitor()

def start_all_monitoring():
    """Start all monitoring systems."""
    db_monitor.start_monitoring()
    resource_monitor.start_monitoring()
    logger.info("All monitoring systems started")

def stop_all_monitoring():
    """Stop all monitoring systems."""
    db_monitor.stop_monitoring()
    resource_monitor.stop_monitoring()
    logger.info("All monitoring systems stopped")

def get_system_health() -> Dict:
    """Get comprehensive system health status."""
    try:
        db_health = cache.get('db_health_status', {'status': 'unknown'})
        resource_health = cache.get('system_resource_status', {'overall_status': 'unknown'})
        performance_stats = performance_monitor.get_performance_stats()
        
        overall_status = 'healthy'
        statuses = [
            db_health.get('overall_status', 'unknown'),
            resource_health.get('overall_status', 'unknown'),
            performance_stats.get('status', 'unknown')
        ]
        
        if 'critical' in statuses or 'error' in statuses:
            overall_status = 'critical'
        elif 'warning' in statuses:
            overall_status = 'warning'
        elif 'unknown' in statuses:
            overall_status = 'unknown'
        
        return {
            'overall_status': overall_status,
            'timestamp': timezone.now().isoformat(),
            'database': db_health,
            'resources': resource_health,
            'performance': performance_stats
        }
        
    except Exception as e:
        logger.error(f"System health check failed: {e}")
        return {
            'timestamp': timezone.now().isoformat(),
            'overall_status': 'error',
            'error': str(e)
        } 