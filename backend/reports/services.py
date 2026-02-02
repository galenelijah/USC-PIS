import os
import json
import csv
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q, F, Case, When, IntegerField, FloatField, Value
from django.utils import timezone
from django.template import Template, Context
from django.conf import settings
from django.core.cache import cache
from django.db import connection, models
from io import BytesIO, StringIO
from patients.models import Patient, MedicalRecord, DentalRecord
from authentication.models import User
from feedback.models import Feedback
from health_info.models import HealthCampaign, CampaignFeedback
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

class ReportDataService:
    """Service for collecting and processing data for reports"""
    
    @staticmethod
    def _get_cache_key(prefix, date_start, date_end, filters):
        """Generate cache key for report data"""
        key_parts = [
            prefix,
            date_start.strftime('%Y%m%d') if date_start else 'no_start',
            date_end.strftime('%Y%m%d') if date_end else 'no_end',
            str(hash(str(sorted(filters.items())))) if filters else 'no_filters'
        ]
        return '_'.join(key_parts)
    
    @staticmethod
    def get_patient_summary_data(date_start=None, date_end=None, filters=None):
        """Get patient summary data (Single Patient OR Aggregate)"""
        # Support for Single Patient Report
        if filters and filters.get('patient_id'):
            patient_id = filters.get('patient_id')
            try:
                patient = Patient.objects.select_related('user').get(id=patient_id)
                medical_records = patient.medical_records.all().order_by('-created_at')[:5]
                dental_records = patient.dental_records.all().order_by('-created_at')[:5]
                
                # Calculate age
                today = timezone.now().date()
                age = 0
                if patient.date_of_birth:
                    age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))

                return {
                    'report_date': timezone.now().strftime('%b %d, %Y'),
                    'patient': {
                        'first_name': patient.first_name,
                        'last_name': patient.last_name,
                        'student_id': getattr(patient.user, 'id_number', 'N/A') if patient.user else 'N/A',
                        'email': patient.email,
                        'contact_number': getattr(patient.user, 'phone', patient.phone_number) if patient.user else patient.phone_number,
                        'date_of_birth': patient.date_of_birth,
                        'age': age,
                        'gender': patient.get_gender_display(),
                        'blood_type': 'N/A', # Not currently tracked
                        'allergies': getattr(patient.user, 'allergies', 'None') if patient.user else 'None',
                        'medical_conditions': getattr(patient.user, 'existing_medical_condition', 'None') if patient.user else 'None',
                        'current_medications': getattr(patient.user, 'medications', 'None') if patient.user else 'None',
                    },
                    'medical_records': medical_records,
                    'dental_records': dental_records
                }
            except Patient.DoesNotExist:
                logger.error(f"Patient {patient_id} not found for report")
                pass # Fall through to aggregate

        cache_key = ReportDataService._get_cache_key('patient_summary', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # Build optimized query
        queryset = Patient.objects.select_related('user').prefetch_related('medical_records', 'dental_records')
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Apply additional filters
        if filters:
            if filters.get('gender'):
                queryset = queryset.filter(gender=filters['gender'])
        
        # Aggregate data in single query
        aggregate_data = queryset.aggregate(
            total_patients=Count('id'),
            new_registrations=Count('id', filter=Q(created_at__gte=timezone.now() - timedelta(days=30))),
            patients_with_medical_records=Count('id', filter=Q(medical_records__isnull=False), distinct=True),
            patients_with_dental_records=Count('id', filter=Q(dental_records__isnull=False), distinct=True)
        )
        
        # Gender distribution
        gender_distribution = list(queryset.values('gender').annotate(count=Count('id')).order_by('gender'))
        
        # Age calculation using database functions (PostgreSQL compatible)
        from django.db import connection
        today = timezone.now().date()
        
        # Use raw SQL for proper age group calculation with cross-database support
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        CASE 
                            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 18 THEN '0-17'
                            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 25 THEN '18-25'
                            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 26 AND 35 THEN '26-35'
                            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 36 AND 45 THEN '36-45'
                            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 46 AND 60 THEN '46-60'
                            ELSE '60+'
                        END as age_group,
                        COUNT(*) as count
                    FROM patients_patient p
                    LEFT JOIN authentication_user u ON p.user_id = u.id
                    WHERE p.date_of_birth IS NOT NULL
                    GROUP BY age_group
                    ORDER BY age_group
                """)
            else:
                cursor.execute("""
                    SELECT 
                        CASE 
                            WHEN CAST((julianday('now') - julianday(date_of_birth)) / 365.25 AS INTEGER) < 18 THEN '0-17'
                            WHEN CAST((julianday('now') - julianday(date_of_birth)) / 365.25 AS INTEGER) BETWEEN 18 AND 25 THEN '18-25'
                            WHEN CAST((julianday('now') - julianday(date_of_birth)) / 365.25 AS INTEGER) BETWEEN 26 AND 35 THEN '26-35'
                            WHEN CAST((julianday('now') - julianday(date_of_birth)) / 365.25 AS INTEGER) BETWEEN 36 AND 45 THEN '36-45'
                            WHEN CAST((julianday('now') - julianday(date_of_birth)) / 365.25 AS INTEGER) BETWEEN 46 AND 60 THEN '46-60'
                            ELSE '60+'
                        END as age_group,
                        COUNT(*) as count
                    FROM patients_patient p
                    LEFT JOIN authentication_user u ON p.user_id = u.id
                    WHERE p.date_of_birth IS NOT NULL
                    GROUP BY age_group
                    ORDER BY age_group
                """)
            
            age_distribution_results = cursor.fetchall()
        
        # Convert to dict for easier frontend usage
        age_groups = {}
        for age_group, count in age_distribution_results:
            age_groups[age_group] = count
        
        # Ensure all age groups are present
        for group in ['0-17', '18-25', '26-35', '36-45', '46-60', '60+']:
            if group not in age_groups:
                age_groups[group] = 0
        
        data = {
            **aggregate_data,
            'gender_distribution': gender_distribution,
            'age_distribution': age_groups,
            'active_patients': queryset.filter(
                Q(medical_records__created_at__gte=timezone.now() - timedelta(days=90)) |
                Q(dental_records__created_at__gte=timezone.now() - timedelta(days=90))
            ).distinct().count()
        }
        
        # Cache for 1 hour
        cache.set(cache_key, data, 3600)
        return data
    
    @staticmethod
    def get_visit_trends_data(date_start=None, date_end=None, filters=None):
        """Get visit trends data with optimized queries and caching"""
        cache_key = ReportDataService._get_cache_key('visit_trends', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # Combine medical and dental records for comprehensive visit data
        medical_qs = MedicalRecord.objects.annotate(visit_type=Value('Medical', output_field=models.CharField()))
        dental_qs = DentalRecord.objects.annotate(visit_type=Value('Dental', output_field=models.CharField()))
        
        # Apply date filters
        if date_start:
            medical_qs = medical_qs.filter(created_at__gte=date_start)
            dental_qs = dental_qs.filter(created_at__gte=date_start)
        if date_end:
            medical_qs = medical_qs.filter(created_at__lte=date_end)
            dental_qs = dental_qs.filter(created_at__lte=date_end)
        
        # Get trends using database aggregation for better performance (PostgreSQL compatible)
        with connection.cursor() as cursor:
            # Monthly trends query - database agnostic
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        DATE_TRUNC('month', created_at)::date as month,
                        COUNT(*) as visits,
                        'Medical' as type
                    FROM patients_medicalrecord 
                    WHERE created_at >= %s AND created_at <= %s
                    GROUP BY month
                    UNION ALL
                    SELECT 
                        DATE_TRUNC('month', created_at)::date as month,
                        COUNT(*) as visits,
                        'Dental' as type
                    FROM patients_dentalrecord 
                    WHERE created_at >= %s AND created_at <= %s
                    GROUP BY month
                    ORDER BY month
                """, [
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now(),
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now()
                ])
            else:
                # SQLite fallback
                cursor.execute("""
                    SELECT 
                        DATE(created_at, 'start of month') as month,
                        COUNT(*) as visits,
                        'Medical' as type
                    FROM patients_medicalrecord 
                    WHERE created_at >= ? AND created_at <= ?
                    GROUP BY month
                    UNION ALL
                    SELECT 
                        DATE(created_at, 'start of month') as month,
                        COUNT(*) as visits,
                        'Dental' as type
                    FROM patients_dentalrecord 
                    WHERE created_at >= ? AND created_at <= ?
                    GROUP BY month
                    ORDER BY month
                """, [
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now(),
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now()
                ])
            
            monthly_data = cursor.fetchall()
        
        # Process monthly trends
        monthly_trends = {}
        for month_str, visits, visit_type in monthly_data:
            # Handle both string and date objects
            if isinstance(month_str, str):
                month_key = month_str
            else:
                # Convert date object to string
                month_key = month_str.strftime('%Y-%m-%d') if month_str else str(month_str)
            
            if month_key not in monthly_trends:
                monthly_trends[month_key] = {'medical': 0, 'dental': 0, 'total': 0}
            monthly_trends[month_key][visit_type.lower()] = visits
            monthly_trends[month_key]['total'] += visits
        
        # Convert to list format
        monthly_list = []
        for month, data in sorted(monthly_trends.items()):
            # Ensure month is in YYYY-MM format
            if len(month) > 7:
                month_formatted = month[:7]  # YYYY-MM format
            else:
                month_formatted = month
            monthly_list.append({
                'month': month_formatted,
                'medical_visits': data['medical'],
                'dental_visits': data['dental'],
                'total_visits': data['total']
            })
        
        # Visit distribution by day of week and hour (PostgreSQL compatible)
        hour_distribution = []
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        EXTRACT(HOUR FROM created_at)::integer as hour,
                        COUNT(*) as visits
                    FROM (
                        SELECT created_at FROM patients_medicalrecord
                        WHERE created_at >= %s AND created_at <= %s
                        UNION ALL
                        SELECT created_at FROM patients_dentalrecord
                        WHERE created_at >= %s AND created_at <= %s
                    ) combined
                    GROUP BY hour
                    ORDER BY hour
                """, [
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now(),
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now()
                ])
            else:
                # SQLite fallback
                cursor.execute("""
                    SELECT 
                        CAST(strftime('%H', created_at) AS INTEGER) as hour,
                        COUNT(*) as visits
                    FROM (
                        SELECT created_at FROM patients_medicalrecord
                        WHERE created_at >= ? AND created_at <= ?
                        UNION ALL
                        SELECT created_at FROM patients_dentalrecord
                        WHERE created_at >= ? AND created_at <= ?
                    ) combined
                    GROUP BY hour
                    ORDER BY hour
                """, [
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now(),
                    date_start or timezone.now() - timedelta(days=365),
                    date_end or timezone.now()
                ])
            
            for hour, visits in cursor.fetchall():
                hour_distribution.append({'hour': hour, 'visits': visits})
        
        # Aggregated statistics
        total_medical = medical_qs.count()
        total_dental = dental_qs.count()
        total_visits = total_medical + total_dental
        
        # Most common diagnoses and treatments
        common_diagnoses = list(medical_qs.exclude(
            diagnosis__isnull=True
        ).exclude(
            diagnosis__exact=''
        ).values('diagnosis').annotate(
            count=Count('id')
        ).order_by('-count')[:10])
        
        data = {
            'total_visits': total_visits,
            'total_medical_visits': total_medical,
            'total_dental_visits': total_dental,
            'monthly_trends': monthly_list,
            'hour_distribution': hour_distribution,
            'common_diagnoses': common_diagnoses,
            'average_daily_visits': round(total_visits / max(1, 
                ((date_end or timezone.now()) - (date_start or timezone.now() - timedelta(days=365))).days
            ), 1),
            'peak_hour': max(hour_distribution, key=lambda x: x['visits'])['hour'] if hour_distribution else None
        }
        
        # Cache for 30 minutes
        cache.set(cache_key, data, 1800)
        return data
    
    @staticmethod
    def get_treatment_outcomes_data(date_start=None, date_end=None, filters=None):
        """Get treatment outcomes data"""
        queryset = MedicalRecord.objects.all()
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Treatment effectiveness (simplified)
        total_treatments = queryset.count()
        follow_up_required = queryset.filter(
            treatment_plan__icontains='follow-up'
        ).count()
        
        # Common diagnoses
        diagnoses = queryset.exclude(
            diagnosis__isnull=True
        ).exclude(
            diagnosis__exact=''
        ).values('diagnosis').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Treatment types
        treatment_types = queryset.exclude(
            treatment_performed__isnull=True
        ).exclude(
            treatment_performed__exact=''
        ).values('treatment_performed').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return {
            'total_treatments': total_treatments,
            'follow_up_rate': (follow_up_required / max(1, total_treatments)) * 100,
            'common_diagnoses': list(diagnoses),
            'treatment_types': list(treatment_types),
            'success_rate': 85.0  # This would need more complex calculation
        }
    
    @staticmethod
    def get_feedback_analysis_data(date_start=None, date_end=None, filters=None):
        """Get feedback analysis data with enhanced analytics and caching"""
        cache_key = ReportDataService._get_cache_key('feedback_analysis', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        queryset = Feedback.objects.select_related('patient', 'medical_record')
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Apply filters
        if filters:
            if filters.get('rating_min'):
                queryset = queryset.filter(rating__gte=filters['rating_min'])
            if filters.get('rating_max'):
                queryset = queryset.filter(rating__lte=filters['rating_max'])
        
        # Aggregate all statistics in one query for better performance
        aggregate_data = queryset.aggregate(
            total_feedback=Count('id'),
            average_rating=Avg('rating'),
            recommendation_count=Count('id', filter=Q(recommend__iexact='yes')),
            courtesy_count=Count('id', filter=Q(courteous__iexact='yes')),
            general_feedback_count=Count('id', filter=Q(medical_record__isnull=True)),
            visit_feedback_count=Count('id', filter=Q(medical_record__isnull=False))
        )
        
        total_feedback = aggregate_data['total_feedback']
        
        if total_feedback == 0:
            return {
                'total_feedback': 0,
                'average_rating': 0,
                'rating_distribution': [],
                'satisfaction_trends': [],
                'recommendation_rate': 0,
                'courtesy_rate': 0,
                'feedback_types': {'general': 0, 'visit_specific': 0}
            }
        
        # Rating distribution
        rating_dist = list(queryset.values('rating').annotate(count=Count('id')).order_by('rating'))
        
        # Ensure all ratings 1-5 are present
        rating_dict = {r['rating']: r['count'] for r in rating_dist}
        for i in range(1, 6):
            if i not in rating_dict:
                rating_dict[i] = 0
        
        rating_distribution = [{'rating': k, 'count': v} for k, v in sorted(rating_dict.items())]
        
        # Monthly satisfaction trends using database aggregation (PostgreSQL compatible)
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        DATE_TRUNC('month', created_at)::date as month,
                        AVG(rating) as avg_rating,
                        COUNT(*) as feedback_count,
                        COUNT(CASE WHEN recommend = 'yes' THEN 1 END) as recommend_count,
                        COUNT(CASE WHEN courteous = 'yes' THEN 1 END) as courtesy_count
                    FROM feedback_feedback 
                    WHERE created_at >= %s AND created_at <= %s
                    GROUP BY month
                    ORDER BY month
                """, [
                    date_start or timezone.now() - timedelta(days=180),
                    date_end or timezone.now()
                ])
            else:
                # SQLite fallback
                cursor.execute("""
                    SELECT 
                        DATE(created_at, 'start of month') as month,
                        AVG(rating) as avg_rating,
                        COUNT(*) as feedback_count,
                        COUNT(CASE WHEN recommend = 'yes' THEN 1 END) as recommend_count,
                        COUNT(CASE WHEN courteous = 'yes' THEN 1 END) as courtesy_count
                    FROM feedback_feedback 
                    WHERE created_at >= ? AND created_at <= ?
                    GROUP BY month
                    ORDER BY month
                """, [
                    date_start or timezone.now() - timedelta(days=180),
                    date_end or timezone.now()
                ])
            
            satisfaction_trends = []
            for row in cursor.fetchall():
                month, avg_rating, count, recommend, courtesy = row
                # Handle both string and date objects
                if isinstance(month, str):
                    month_formatted = month[:7]  # YYYY-MM format
                else:
                    # Convert date object to string
                    month_formatted = month.strftime('%Y-%m') if month else str(month)[:7]
                
                satisfaction_trends.append({
                    'month': month_formatted,
                    'average_rating': round(avg_rating or 0, 1),
                    'feedback_count': count,
                    'recommendation_rate': round((recommend / max(1, count)) * 100, 1),
                    'courtesy_rate': round((courtesy / max(1, count)) * 100, 1)
                })
        
        # Response time analysis (if medical record feedback) - PostgreSQL compatible
        response_time_stats = None
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        AVG(EXTRACT(EPOCH FROM (f.created_at - mr.created_at))/86400) as avg_response_days,
                        COUNT(*) as count
                    FROM feedback_feedback f
                    JOIN patients_medicalrecord mr ON f.medical_record_id = mr.id
                    WHERE f.created_at >= %s AND f.created_at <= %s
                    AND f.medical_record_id IS NOT NULL
                """, [
                    date_start or timezone.now() - timedelta(days=180),
                    date_end or timezone.now()
                ])
            else:
                # SQLite fallback
                cursor.execute("""
                    SELECT 
                        AVG(julianday(f.created_at) - julianday(mr.created_at)) as avg_response_days,
                        COUNT(*) as count
                    FROM feedback_feedback f
                    JOIN patients_medicalrecord mr ON f.medical_record_id = mr.id
                    WHERE f.created_at >= ? AND f.created_at <= ?
                    AND f.medical_record_id IS NOT NULL
                """, [
                    date_start or timezone.now() - timedelta(days=180),
                    date_end or timezone.now()
                ])
            
            row = cursor.fetchone()
            if row and row[1] > 0:
                response_time_stats = {
                    'average_response_days': round(row[0] or 0, 1),
                    'feedback_with_visits': row[1]
                }
        
        data = {
            'total_feedback': total_feedback,
            'average_rating': round(aggregate_data['average_rating'] or 0, 1),
            'rating_distribution': rating_distribution,
            'satisfaction_trends': satisfaction_trends,
            'recommendation_rate': round((aggregate_data['recommendation_count'] / max(1, total_feedback)) * 100, 1),
            'courtesy_rate': round((aggregate_data['courtesy_count'] / max(1, total_feedback)) * 100, 1),
            'feedback_types': {
                'general': aggregate_data['general_feedback_count'],
                'visit_specific': aggregate_data['visit_feedback_count']
            },
            'response_time_stats': response_time_stats,
            'satisfaction_score': round(((aggregate_data['average_rating'] or 0) / 5) * 100, 1)  # Convert to percentage
        }
        
        # Cache for 15 minutes (feedback changes frequently)
        cache.set(cache_key, data, 900)
        return data
    
    @staticmethod
    def get_comprehensive_analytics_data(date_start=None, date_end=None, filters=None):
        """Get comprehensive system analytics combining all data sources"""
        cache_key = ReportDataService._get_cache_key('comprehensive_analytics', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # Get data from all services
        patient_data = ReportDataService.get_patient_summary_data(date_start, date_end, filters)
        visit_data = ReportDataService.get_visit_trends_data(date_start, date_end, filters)
        feedback_data = ReportDataService.get_feedback_analysis_data(date_start, date_end, filters)
        
        # System utilization metrics
        with connection.cursor() as cursor:
            # User activity analysis
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT 
                        u.role,
                        COUNT(*) as user_count,
                        COUNT(CASE WHEN u.last_login >= %s THEN 1 END) as active_users
                    FROM authentication_user u
                    GROUP BY u.role
                """, [timezone.now() - timedelta(days=30)])
            else:
                cursor.execute("""
                    SELECT 
                        u.role,
                        COUNT(*) as user_count,
                        COUNT(CASE WHEN u.last_login >= ? THEN 1 END) as active_users
                    FROM authentication_user u
                    GROUP BY u.role
                """, [timezone.now() - timedelta(days=30)])
            
            user_activity = []
            for role, total, active in cursor.fetchall():
                user_activity.append({
                    'role': role,
                    'total_users': total,
                    'active_users': active,
                    'activity_rate': round((active / max(1, total)) * 100, 1)
                })
        
        # Health trends analysis
        health_metrics = {
            'patient_growth_rate': 0,
            'visit_frequency_trend': 0,
            'satisfaction_trend': 0
        }
        
        # Calculate growth rates if we have historical data
        if patient_data['total_patients'] > 0 and visit_data['total_visits'] > 0:
            # Simplified growth calculation
            health_metrics['patient_growth_rate'] = round(
                (patient_data['new_registrations'] / max(1, patient_data['total_patients'])) * 100, 1
            )
            
            if visit_data['monthly_trends']:
                recent_visits = sum(m['total_visits'] for m in visit_data['monthly_trends'][-3:])  # Last 3 months
                older_visits = sum(m['total_visits'] for m in visit_data['monthly_trends'][:3])   # First 3 months
                if older_visits > 0:
                    health_metrics['visit_frequency_trend'] = round(
                        ((recent_visits - older_visits) / older_visits) * 100, 1
                    )
        
        # System efficiency metrics
        efficiency_metrics = {
            'avg_records_per_patient': round(
                visit_data['total_visits'] / max(1, patient_data['total_patients']), 1
            ),
            'feedback_response_rate': round(
                (feedback_data['total_feedback'] / max(1, visit_data['total_visits'])) * 100, 1
            ),
            'patient_satisfaction': feedback_data['satisfaction_score'],
            'system_adoption': round(
                (patient_data['active_patients'] / max(1, patient_data['total_patients'])) * 100, 1
            )
        }
        
        data = {
            'overview': {
                'total_patients': patient_data['total_patients'],
                'total_visits': visit_data['total_visits'],
                'total_feedback': feedback_data['total_feedback'],
                'average_satisfaction': feedback_data['average_rating'],
                'active_patients': patient_data.get('active_patients', 0)
            },
            'demographics': {
                'age_distribution': patient_data['age_distribution'],
                'gender_distribution': patient_data['gender_distribution']
            },
            'activity_trends': {
                'visit_trends': visit_data['monthly_trends'][:12],  # Last 12 months
                'satisfaction_trends': feedback_data['satisfaction_trends'][:12]
            },
            'user_activity': user_activity,
            'health_metrics': health_metrics,
            'efficiency_metrics': efficiency_metrics,
            'peak_usage': {
                'peak_hour': visit_data.get('peak_hour'),
                'busiest_day_type': 'Weekday',  # Would need more analysis
                'average_daily_visits': visit_data.get('average_daily_visits', 0)
            }
        }
        
        # Cache for 2 hours
        cache.set(cache_key, data, 7200)
        return data

class ReportExportService:
    """Service for exporting reports in different formats"""
    
    @staticmethod
    def export_to_html(report_data, template_content, title="Report", extra_context=None):
        """Render an HTML report using a Django template string.

        Returns UTF-8 encoded HTML bytes.
        """
        try:
            from django.template import Template, Context
            context = {
                'title': title,
                'generated_at': timezone.now(),
                'report_data': report_data,
            }
            if extra_context:
                context.update(extra_context)

            tpl = Template(template_content or "<html><body><pre>{{ report_data|safe }}</pre></body></html>")
            html = tpl.render(Context(context))
            return html.encode('utf-8')
        except Exception as e:
            logger.error(f"Error rendering HTML report: {str(e)}")
            # Fallback to JSON if template rendering fails
            try:
                return ReportExportService.export_to_json(report_data, title)
            except Exception:
                return None

    @staticmethod
    def export_to_pdf(report_data, template_content, title="Report"):
        """Export report to PDF using xhtml2pdf (with HTML templates) or ReportLab fallback"""
        try:
            # 1. Try HTML-to-PDF conversion using xhtml2pdf if template is provided
            if template_content:
                try:
                    from xhtml2pdf import pisa
                    from django.template import Template, Context
                    
                    # Prepare context - flatten report_data if it's a dict to make variables accessible directly
                    context_data = {
                        'title': title,
                        'generated_at': timezone.now(),
                        'report_data': report_data,
                    }
                    
                    # Flatten report_data into context for easier access in templates (e.g. {{ total_patients }} instead of {{ report_data.total_patients }})
                    if isinstance(report_data, dict):
                        context_data.update(report_data)
                    
                    tpl = Template(template_content)
                    html = tpl.render(Context(context_data))
                    
                    # Convert to PDF
                    buffer = BytesIO()
                    pisa_status = pisa.CreatePDF(html, dest=buffer)
                    
                    if not pisa_status.err:
                        return buffer.getvalue()
                    else:
                        logger.error(f"xhtml2pdf error: {pisa_status.err}")
                except ImportError:
                    logger.warning("xhtml2pdf not installed, falling back to ReportLab")
                except Exception as e:
                    logger.error(f"HTML-to-PDF conversion failed: {str(e)}")
            
            # 2. Fallback to ReportLab (Programmatic generation)
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from io import BytesIO
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
            )
            story.append(Paragraph(title, title_style))
            
            # Generation date
            date_style = ParagraphStyle(
                'DateStyle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.grey,
            )
            story.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
            story.append(Spacer(1, 20))
            
            # Process report data into readable format
            if isinstance(report_data, dict):
                for key, value in report_data.items():
                    # Section header
                    story.append(Paragraph(str(key).replace('_', ' ').title(), styles['Heading2']))
                    
                    if isinstance(value, (list, tuple)):
                        # Create table for list data
                        if value and isinstance(value[0], dict):
                            # Table from dict list
                            if len(value) > 0:
                                headers = list(value[0].keys())
                                table_data = [headers]
                                for item in value[:10]:  # Limit to 10 rows
                                    table_data.append([str(item.get(h, '')) for h in headers])
                                
                                table = Table(table_data)
                                table.setStyle(TableStyle([
                                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                                ]))
                                story.append(table)
                        else:
                            # Simple list
                            for item in value[:10]:  # Limit to 10 items
                                story.append(Paragraph(f"• {str(item)}", styles['Normal']))
                    elif isinstance(value, dict):
                        # Nested dictionary
                        for sub_key, sub_value in value.items():
                            story.append(Paragraph(f"{str(sub_key).replace('_', ' ').title()}: {str(sub_value)}", styles['Normal']))
                    else:
                        # Simple value
                        story.append(Paragraph(str(value), styles['Normal']))
                    
                    story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF data
            buffer.seek(0)
            return buffer.getvalue()
            
        except ImportError:
            # Fallback if ReportLab is not available
            logger.warning("ReportLab not available, using text fallback for PDF")
            try:
                content = f"""USC-PIS REPORT
{title}
Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}

REPORT DATA:
{json.dumps(report_data, indent=2, default=str)}

End of Report
"""
                return content.encode('utf-8')
            except Exception as e:
                logger.error(f"Error in PDF fallback: {str(e)}")
                return None
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return None
    
    @staticmethod
    def export_to_excel(report_data, title="Report"):
        """Export report to Excel using openpyxl for proper .xlsx format"""
        try:
            # Try using openpyxl for proper Excel format
            try:
                from openpyxl import Workbook
                from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
                from openpyxl.utils import get_column_letter
                
                wb = Workbook()
                ws = wb.active
                ws.title = "Report Data"
                
                # Setup styles
                header_font = Font(name='Arial', bold=True, size=14, color='FFFFFF')
                header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
                subheader_font = Font(name='Arial', bold=True, size=12)
                subheader_fill = PatternFill(start_color='E7E6E6', end_color='E7E6E6', fill_type='solid')
                border = Border(left=Side(style='thin'), right=Side(style='thin'), 
                               top=Side(style='thin'), bottom=Side(style='thin'))
                
                row = 1
                
                # Title
                ws.cell(row=row, column=1, value=title)
                ws.cell(row=row, column=1).font = Font(name='Arial', bold=True, size=16)
                row += 1
                
                # Generation date
                ws.cell(row=row, column=1, value="Generated At:")
                ws.cell(row=row, column=2, value=timezone.now().strftime('%Y-%m-%d %H:%M:%S'))
                row += 2
                
                # Process report data
                for key, value in report_data.items():
                    if isinstance(value, (int, float, str)):
                        # Summary data
                        ws.cell(row=row, column=1, value=str(key).replace('_', ' ').title())
                        ws.cell(row=row, column=1).font = subheader_font
                        ws.cell(row=row, column=2, value=value)
                        row += 1
                    elif isinstance(value, dict):
                        # Dictionary data (e.g. nested objects)
                        ws.cell(row=row, column=1, value=str(key).replace('_', ' ').title())
                        ws.cell(row=row, column=1).font = subheader_font
                        ws.cell(row=row, column=1).fill = subheader_fill
                        row += 1
                        
                        for sub_key, sub_value in value.items():
                            ws.cell(row=row, column=1, value=str(sub_key).replace('_', ' ').title())
                            ws.cell(row=row, column=2, value=str(sub_value))
                            row += 1
                        row += 1
                    elif isinstance(value, list) and value:
                        # Table data
                        ws.cell(row=row, column=1, value=str(key).replace('_', ' ').title())
                        ws.cell(row=row, column=1).font = subheader_font
                        ws.cell(row=row, column=1).fill = subheader_fill
                        row += 1
                        
                        if isinstance(value[0], dict):
                            # Headers
                            headers = list(value[0].keys())
                            for col, header in enumerate(headers, 1):
                                cell = ws.cell(row=row, column=col, value=header.replace('_', ' ').title())
                                cell.font = header_font
                                cell.fill = header_fill
                                cell.border = border
                                cell.alignment = Alignment(horizontal='center')
                            row += 1
                            
                            # Data rows
                            for item in value[:100]:  # Limit to 100 rows for performance
                                for col, header in enumerate(headers, 1):
                                    cell = ws.cell(row=row, column=col, value=str(item.get(header, '')))
                                    cell.border = border
                                row += 1
                        else:
                            # Simple list
                            for item in value[:50]:  # Limit to 50 items
                                ws.cell(row=row, column=1, value=str(item))
                                row += 1
                        
                        row += 1  # Empty row
                
                # Auto-adjust column widths
                for col in range(1, ws.max_column + 1):
                    max_length = 0
                    column = get_column_letter(col)
                    for row_cells in ws[column]:
                        try:
                            if len(str(row_cells.value)) > max_length:
                                max_length = len(str(row_cells.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)  # Cap at 50 characters
                    ws.column_dimensions[column].width = adjusted_width
                
                # Save to bytes
                buffer = BytesIO()
                wb.save(buffer)
                buffer.seek(0)
                return buffer.getvalue()
                
            except ImportError:
                # Fallback to CSV format if openpyxl not available
                logger.warning("openpyxl not available, using CSV format for Excel export")
                output = StringIO()
                
                # Write title and metadata
                writer = csv.writer(output)
                writer.writerow([title])
                writer.writerow(['Generated At', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])
                writer.writerow([])  # Empty row
                
                # Write summary data
                writer.writerow(['Summary'])
                for key, value in report_data.items():
                    if isinstance(value, (int, float, str)):
                        writer.writerow([str(key).replace('_', ' ').title(), value])
                
                writer.writerow([])  # Empty row
                
                # Write detailed data tables
                for key, value in report_data.items():
                    if isinstance(value, list) and value:
                        writer.writerow([str(key).replace('_', ' ').title()])
                        if isinstance(value[0], dict):
                            # Write headers
                            headers = list(value[0].keys())
                            writer.writerow([header.replace('_', ' ').title() for header in headers])
                            
                            # Write data
                            for item in value:
                                row = [item.get(header, '') for header in headers]
                                writer.writerow(row)
                        
                        writer.writerow([])  # Empty row
                
                csv_content = output.getvalue()
                output.close()
                return csv_content.encode('utf-8')
        
        except Exception as e:
            logger.error(f"Error generating Excel: {str(e)}")
            return None
    
    @staticmethod
    def export_to_csv(report_data, title="Report"):
        """Export report to CSV"""
        try:
            output = StringIO()
            
            # Find the main data table
            main_data = None
            for key, value in report_data.items():
                if isinstance(value, list) and value and isinstance(value[0], dict):
                    main_data = value
                    break
            
            if main_data:
                # Use built-in csv module
                headers = list(main_data[0].keys())
                writer = csv.DictWriter(output, fieldnames=headers)
                writer.writeheader()
                writer.writerows(main_data)
            else:
                # If no tabular data, create a simple key-value CSV
                writer = csv.writer(output)
                writer.writerow(['Metric', 'Value'])
                for key, value in report_data.items():
                    if isinstance(value, (int, float, str)):
                        writer.writerow([key.replace('_', ' ').title(), value])
            
            csv_content = output.getvalue()
            output.close()
            return csv_content.encode('utf-8')
        
        except Exception as e:
            logger.error(f"Error generating CSV: {str(e)}")
            return None
    
    @staticmethod
    def export_to_json(report_data, title="Report"):
        """Export report to JSON"""
        try:
            output_data = {
                'title': title,
                'generated_at': timezone.now().isoformat(),
                'data': report_data
            }
            return json.dumps(output_data, indent=2, default=str).encode('utf-8')
        except Exception as e:
            logger.error(f"Error generating JSON: {str(e)}")
            return None

class ReportGenerationService:
    """Main service for generating reports"""
    
    def __init__(self):
        self.data_service = ReportDataService()
        self.export_service = ReportExportService()
    
    def generate_patient_summary_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate patient summary report"""
        data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
        
        template_content = """
        <html>
        <head>
            <title>Patient Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4472C4; color: white; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Patient Summary Report</h1>
                <p>Generated on: {{ generated_at|date:"Y-m-d H:i:s" }}</p>
            </div>
            
            <div class="metric">
                <h3>Total Patients: {{ report_data.total_patients }}</h3>
            </div>
            
            <div class="metric">
                <h3>New Registrations (Last 30 Days): {{ report_data.new_registrations }}</h3>
            </div>
            
            <h3>Gender Distribution</h3>
            <table>
                <tr><th>Gender</th><th>Count</th></tr>
                {% for item in report_data.gender_distribution %}
                <tr><td>{{ item.gender }}</td><td>{{ item.count }}</td></tr>
                {% endfor %}
            </table>
        </body>
        </html>
        """
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_content, "Patient Summary Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Patient Summary Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Patient Summary Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Patient Summary Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Patient Summary Report")
        
        return None
    
    def generate_visit_trends_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate visit trends report"""
        data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Visit Trends Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Visit Trends Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Visit Trends Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Visit Trends Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Visit Trends Report")
        
        return None
    
    def generate_treatment_outcomes_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate treatment outcomes report"""
        data = self.data_service.get_treatment_outcomes_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Treatment Outcomes Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Treatment Outcomes Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Treatment Outcomes Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Treatment Outcomes Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Treatment Outcomes Report")
        
        return None
    
    def generate_feedback_analysis_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate feedback analysis report"""
        data = self.data_service.get_feedback_analysis_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Feedback Analysis Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Feedback Analysis Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Feedback Analysis Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Feedback Analysis Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Feedback Analysis Report")
        
        return None
    
    def generate_comprehensive_analytics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate comprehensive analytics report"""
        data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Comprehensive Analytics Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Comprehensive Analytics Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Comprehensive Analytics Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Comprehensive Analytics Report")
        
        return None
    
    def generate_medical_statistics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate medical statistics report"""
        # Get data from multiple sources to populate the full template
        patient_data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
        visit_data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        
        # Merge data to match template expectations
        data = {
            **patient_data,
            **visit_data,
            # Map fields to match template variable names
            'total_consultations': visit_data.get('total_visits', 0),
            'medical_consultations': visit_data.get('total_medical_visits', 0),
            'followup_visits': 0, # Not currently tracked separately in aggregate
            'emergency_cases': 0, # Not currently tracked separately
            'referrals_count': 0, # Not currently tracked
            'top_condition': visit_data.get('common_diagnoses', [{'diagnosis': 'N/A'}])[0]['diagnosis'] if visit_data.get('common_diagnoses') else 'None',
            'top_diagnoses': [
                {
                    'name': d['diagnosis'],
                    'case_count': d['count'],
                    'percentage': (d['count'] / max(1, visit_data.get('total_medical_visits', 1))) * 100,
                    'avg_age': 0, # Requires deeper query
                    'gender_ratio': 'N/A'
                } for d in visit_data.get('common_diagnoses', [])
            ],
            'monthly_trends': [
                {
                    'name': m['month'],
                    'total': m['total_visits'],
                    'medical': m['medical_visits'],
                    'emergency': 0,
                    'followup': 0
                } for m in visit_data.get('monthly_trends', [])
            ]
        }
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Medical Statistics Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Medical Statistics Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Medical Statistics Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Medical Statistics Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Medical Statistics Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        
        return None
    
    def generate_dental_statistics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate dental statistics report"""
        # Use visit trends data focusing on dental records
        data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_html, "Dental Statistics Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Dental Statistics Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Dental Statistics Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Dental Statistics Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                data,
                template_html,
                title="Dental Statistics Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        
        return None
    
    def generate_campaign_performance_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        """Generate campaign performance report"""
        # Use comprehensive analytics data for campaign performance
        data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
        
        # Add campaign-specific data
        campaign_data = {
            'campaign_overview': data.get('overview', {}),
            'user_engagement': data.get('user_activity', []),
            'health_metrics': data.get('health_metrics', {}),
            'system_efficiency': data.get('efficiency_metrics', {})
        }
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(campaign_data, template_html, "Campaign Performance Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(campaign_data, "Campaign Performance Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(campaign_data, "Campaign Performance Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(campaign_data, "Campaign Performance Report")
        elif export_format == 'HTML' and template_html:
            return self.export_service.export_to_html(
                campaign_data,
                template_html,
                title="Campaign Performance Report",
                extra_context={
                    'date_range_start': date_start,
                    'date_range_end': date_end,
                    'filters': filters or {}
                }
            )
        
        return None 
