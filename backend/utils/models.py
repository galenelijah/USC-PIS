from django.db import models
from django.utils import timezone
from django.conf import settings
import json


class BackupStatus(models.Model):
    """Track backup operations and their status"""
    
    BACKUP_TYPES = [
        ('database', 'Database Backup'),
        ('media', 'Media Files Backup'),
        ('full', 'Full System Backup'),
        ('verification', 'Backup Verification'),
        ('setup', 'Backup Setup'),
        ('heroku', 'Heroku Backup'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('in_progress', 'In Progress'),
        ('warning', 'Warning'),
    ]
    
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    file_size = models.BigIntegerField(
        null=True, 
        blank=True, 
        help_text="Total size of backup files in bytes"
    )
    checksum = models.CharField(
        max_length=64, 
        blank=True,
        help_text="MD5 checksum for integrity verification"
    )
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional backup information and settings"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who initiated the backup (if manual)"
    )
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Backup Status'
        verbose_name_plural = 'Backup Statuses'
        indexes = [
            models.Index(fields=['-started_at']),
            models.Index(fields=['backup_type', 'status']),
            models.Index(fields=['status', '-started_at']),
        ]

    def __str__(self):
        return f"{self.get_backup_type_display()} - {self.get_status_display()} ({self.started_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def duration(self):
        """Calculate backup duration"""
        if self.completed_at:
            return self.completed_at - self.started_at
        elif self.status == 'in_progress':
            return timezone.now() - self.started_at
        return None

    @property
    def duration_seconds(self):
        """Get duration in seconds"""
        duration = self.duration
        return duration.total_seconds() if duration else None

    @property
    def file_size_mb(self):
        """Get file size in MB"""
        return round(self.file_size / (1024 * 1024), 2) if self.file_size else None

    @property
    def is_recent(self):
        """Check if backup is recent (within last 24 hours)"""
        return (timezone.now() - self.started_at).days < 1

    @classmethod
    def get_latest_by_type(cls, backup_type):
        """Get the latest backup of a specific type"""
        return cls.objects.filter(backup_type=backup_type).first()

    @classmethod
    def get_successful_backups_last_week(cls):
        """Get successful backups from the last week"""
        week_ago = timezone.now() - timezone.timedelta(days=7)
        return cls.objects.filter(
            status='success',
            started_at__gte=week_ago
        )

    @classmethod
    def get_backup_health_summary(cls):
        """Get a summary of backup system health"""
        last_24h = timezone.now() - timezone.timedelta(hours=24)
        last_week = timezone.now() - timezone.timedelta(days=7)
        
        summary = {
            'last_24h_backups': cls.objects.filter(started_at__gte=last_24h).count(),
            'last_24h_successful': cls.objects.filter(
                started_at__gte=last_24h, 
                status='success'
            ).count(),
            'last_week_backups': cls.objects.filter(started_at__gte=last_week).count(),
            'last_week_successful': cls.objects.filter(
                started_at__gte=last_week, 
                status='success'
            ).count(),
            'latest_database_backup': cls.get_latest_by_type('database'),
            'latest_media_backup': cls.get_latest_by_type('media'),
            'latest_full_backup': cls.get_latest_by_type('full'),
            'latest_verification': cls.get_latest_by_type('verification'),
        }
        
        # Calculate health score
        recent_success_rate = 0
        if summary['last_week_backups'] > 0:
            recent_success_rate = summary['last_week_successful'] / summary['last_week_backups']
        
        summary['health_score'] = recent_success_rate
        summary['health_status'] = 'healthy' if recent_success_rate >= 0.8 else 'unhealthy'
        
        return summary


class BackupSchedule(models.Model):
    """Track scheduled backup configurations"""
    
    SCHEDULE_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('manual', 'Manual Only'),
    ]
    
    backup_type = models.CharField(max_length=20, choices=BackupStatus.BACKUP_TYPES)
    schedule_type = models.CharField(max_length=10, choices=SCHEDULE_TYPES)
    schedule_time = models.TimeField(
        help_text="Time of day to run the backup (UTC)"
    )
    is_active = models.BooleanField(default=True)
    retention_days = models.IntegerField(
        default=7,
        help_text="Number of days to retain backups"
    )
    configuration = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional backup configuration options"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['backup_type', 'schedule_type']
        verbose_name = 'Backup Schedule'
        verbose_name_plural = 'Backup Schedules'

    def __str__(self):
        return f"{self.get_backup_type_display()} - {self.get_schedule_type_display()} at {self.schedule_time}"

    @property
    def next_run_time(self):
        """Calculate next scheduled run time"""
        now = timezone.now()
        today = now.date()
        
        if self.schedule_type == 'daily':
            next_run = timezone.datetime.combine(today, self.schedule_time)
            if next_run <= now:
                next_run += timezone.timedelta(days=1)
        elif self.schedule_type == 'weekly':
            # Run on Sundays (adjust as needed)
            days_until_sunday = (6 - today.weekday()) % 7
            if days_until_sunday == 0:
                days_until_sunday = 7
            next_run = timezone.datetime.combine(
                today + timezone.timedelta(days=days_until_sunday), 
                self.schedule_time
            )
        elif self.schedule_type == 'monthly':
            # Run on the first day of next month
            if today.month == 12:
                next_month = today.replace(year=today.year + 1, month=1, day=1)
            else:
                next_month = today.replace(month=today.month + 1, day=1)
            next_run = timezone.datetime.combine(next_month, self.schedule_time)
        else:
            return None
        
        return timezone.make_aware(next_run) if timezone.is_naive(next_run) else next_run


class SystemHealthMetric(models.Model):
    """Track overall system health metrics including backups"""
    
    METRIC_TYPES = [
        ('backup_health', 'Backup System Health'),
        ('storage_usage', 'Storage Usage'),
        ('database_size', 'Database Size'),
        ('media_size', 'Media Files Size'),
        ('system_uptime', 'System Uptime'),
    ]
    
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    value = models.FloatField()
    unit = models.CharField(
        max_length=20,
        blank=True,
        help_text="Unit of measurement (MB, GB, %, hours, etc.)"
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metric details and context"
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_at']
        verbose_name = 'System Health Metric'
        verbose_name_plural = 'System Health Metrics'
        indexes = [
            models.Index(fields=['metric_type', '-recorded_at']),
            models.Index(fields=['-recorded_at']),
        ]

    def __str__(self):
        return f"{self.get_metric_type_display()}: {self.value} {self.unit} ({self.recorded_at.strftime('%Y-%m-%d %H:%M')})"

    @classmethod
    def record_backup_health(cls):
        """Record current backup system health"""
        health_summary = BackupStatus.get_backup_health_summary()
        
        cls.objects.create(
            metric_type='backup_health',
            value=health_summary['health_score'] * 100,  # Convert to percentage
            unit='%',
            details=health_summary
        )
        
        return health_summary

    @classmethod
    def get_latest_metric(cls, metric_type):
        """Get the latest value for a specific metric type"""
        return cls.objects.filter(metric_type=metric_type).first()