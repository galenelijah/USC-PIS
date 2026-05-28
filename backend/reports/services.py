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
import pandas as pd

logger = logging.getLogger(__name__)

class ReportDataService:
    """Service for collecting and processing data for reports"""
    
    @staticmethod
    def _apply_customization(data_list, filters):
        """Helper to prune fields and group data list based on filters"""
        if not data_list or not isinstance(data_list, list):
            return data_list
            
        selected_fields = filters.get('selected_fields')
        group_by = filters.get('group_by')
        
        # 1. Prune fields
        if selected_fields:
            pruned_list = []
            for item in data_list:
                if isinstance(item, dict):
                    # Always keep the group_by field if it exists, so grouping still works
                    effective_fields = set(selected_fields)
                    if group_by: effective_fields.add(group_by)
                    pruned_list.append({k: v for k, v in item.items() if k in effective_fields})
                else:
                    pruned_list.append(item)
            data_list = pruned_list
            
        # 2. Group data (returns a dict of lists if grouping is active)
        if group_by and data_list and isinstance(data_list[0], dict) and group_by in data_list[0]:
            grouped_data = {}
            for item in data_list:
                val = item.get(group_by)
                key = str(val) if val is not None else 'None/Other'
                if key not in grouped_data:
                    grouped_data[key] = []
                grouped_data[key].append(item)
            return grouped_data
            
        return data_list

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
        logger.info(f"Collecting patient summary data. Start: {date_start}, End: {date_end}, Filters: {filters}")
        try:
            # Support for Single Patient Report
            if filters and filters.get('patient_id'):
                patient_id = filters.get('patient_id')
                try:
                    patient_qs = Patient.objects.select_related('user')
                    pgp_key = getattr(settings, 'PGP_ENCRYPTION_KEY', None)
                    if connection.vendor == 'postgresql' and pgp_key:
                        from django.db.models.expressions import RawSQL
                        # Decrypt sensitive columns directly at the database level for reporting
                        patient_qs = patient_qs.annotate(
                            decrypted_allergies=RawSQL("pgp_sym_decrypt(authentication_user.allergies_enc, %s)::text", [pgp_key]),
                            decrypted_med_cond=RawSQL("pgp_sym_decrypt(authentication_user.existing_medical_condition_enc, %s)::text", [pgp_key]),
                            decrypted_meds=RawSQL("pgp_sym_decrypt(authentication_user.medications_enc, %s)::text", [pgp_key]),
                            decrypted_emerg_num=RawSQL("pgp_sym_decrypt(authentication_user.emergency_contact_number_enc, %s)::text", [pgp_key]),
                        )
                    patient = patient_qs.get(id=patient_id)
                    
                    # Convert records to values for consistent export across all formats
                    medical_records = list(patient.medical_records.all().order_by('-visit_date').values(
                        'visit_date', 'diagnosis', 'treatment', 'notes'
                    )[:10])
                    dental_records = list(patient.dental_records.all().order_by('-visit_date').values(
                        'visit_date', 'procedure_performed', 'diagnosis', 'treatment_performed', 'notes'
                    )[:10])
                    consultations = list(patient.consultations.all().order_by('-date_time').values(
                        'date_time', 'chief_complaints', 'treatment_plan', 'remarks'
                    )[:10])
                    
                    # Apply customization (field selection and grouping)
                    medical_records = ReportDataService._apply_customization(medical_records, filters)
                    dental_records = ReportDataService._apply_customization(dental_records, filters)
                    consultations = ReportDataService._apply_customization(consultations, filters)
                    
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
                            'blood_type': getattr(patient, 'blood_type', 'N/A'),
                            'address': getattr(patient, 'address', 'N/A'),
                            'emergency_contact': getattr(patient.user, 'emergency_contact', 'N/A') if patient.user else 'N/A',
                            'emergency_contact_number': getattr(patient, 'decrypted_emerg_num', None) or (getattr(patient.user, 'emergency_contact_number', 'N/A') if patient.user else 'N/A'),
                            'height': getattr(patient.user, 'height', 'N/A') if patient.user else 'N/A',
                            'weight': getattr(patient.user, 'weight', 'N/A') if patient.user else 'N/A',
                            'bmi': getattr(patient.user, 'bmi', 'N/A') if patient.user else 'N/A',
                            'allergies': getattr(patient, 'decrypted_allergies', None) or (getattr(patient.user, 'allergies', 'None') if patient.user else 'None'),
                            'medical_conditions': getattr(patient, 'decrypted_med_cond', None) or (getattr(patient.user, 'existing_medical_condition', 'None') if patient.user else 'None'),
                            'current_medications': getattr(patient, 'decrypted_meds', None) or (getattr(patient.user, 'medications', 'None') if patient.user else 'None'),
                            'course': getattr(patient.user, 'course', 'N/A') if patient.user else 'N/A',
                            'school': getattr(patient.user, 'school', 'N/A') if patient.user else 'N/A',
                        },
                        'recent_appointments_count': len(medical_records) + len(dental_records) + len(consultations),
                        'medical_records': medical_records,
                        'dental_records': dental_records,
                        'consultations': consultations
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
                if filters.get('school'):
                    queryset = queryset.filter(user__school=filters['school'])
                if filters.get('course'):
                    queryset = queryset.filter(user__course=filters['course'])
                if filters.get('year_level'):
                    queryset = queryset.filter(user__year_level=filters['year_level'])
            
            # Aggregate data in single query
            aggregate_data = queryset.aggregate(
                total_patients=Count('id'),
                new_registrations=Count('id', filter=Q(created_at__gte=timezone.now() - timedelta(days=30))),
                patients_with_medical_records=Count('id', filter=Q(medical_records__isnull=False), distinct=True),
                patients_with_dental_records=Count('id', filter=Q(dental_records__isnull=False), distinct=True)
            )
            
            # Gender distribution
            raw_gender_dist = list(queryset.values('gender').annotate(count=Count('id')).order_by('gender'))
            gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other', '1': 'Male', '2': 'Female'} 
            gender_distribution = []
            for item in raw_gender_dist:
                g_code = item['gender']
                g_name = gender_map.get(g_code, g_code if g_code else 'Unknown')
                gender_distribution.append({'gender': g_name, 'count': item['count']})
            
            # Age distribution
            age_groups = {'0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0}
            try:
                # Course and School distribution
                course_distribution = list(queryset.values('user__course').annotate(count=Count('id')).order_by('-count')[:10])
                course_distribution = [{'course': item['user__course'] or 'Unknown', 'count': item['count']} for item in course_distribution]
                
                school_distribution = list(queryset.values('user__school').annotate(count=Count('id')).order_by('-count')[:10])
                school_distribution = [{'school': item['user__school'] or 'Unknown', 'count': item['count']} for item in school_distribution]

                year_level_distribution = list(queryset.values('user__year_level').annotate(count=Count('id')).order_by('-count')[:10])
                year_level_distribution = [{'year_level': item['user__year_level'] or 'N/A', 'count': item['count']} for item in year_level_distribution]

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
                            FROM patients_patient
                            WHERE date_of_birth IS NOT NULL
                            GROUP BY age_group
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
                            FROM patients_patient
                            WHERE date_of_birth IS NOT NULL
                            GROUP BY age_group
                        """)
                    for row in cursor.fetchall():
                        age_groups[row[0]] = row[1]
            except Exception as e:
                logger.error(f"Age distribution calculation failed: {e}")

            data = {
                **aggregate_data,
                'gender_distribution': gender_distribution,
                'age_distribution': age_groups,
                'course_distribution': course_distribution,
                'school_distribution': school_distribution,
                'year_level_distribution': year_level_distribution,
                'active_patients': queryset.filter(
                    Q(medical_records__visit_date__gte=timezone.now() - timedelta(days=90)) |
                    Q(dental_records__visit_date__gte=timezone.now() - timedelta(days=90))
                ).distinct().count()
            }
            
            cache.set(cache_key, data, 3600)
            return data
        except Exception as e:
            logger.error(f"Error in get_patient_summary_data: {str(e)}")
            return {'error': str(e), 'total_patients': Patient.objects.count()}
    
    @staticmethod
    def get_visit_trends_data(date_start=None, date_end=None, filters=None):
        """Get visit trends data with monthly aggregation and detailed metrics"""
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            medical_records = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            dental_records = DentalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            # Apply filters if provided
            if filters:
                if filters.get('gender'):
                    medical_records = medical_records.filter(patient__gender=filters['gender'])
                    dental_records = dental_records.filter(patient__gender=filters['gender'])
                if filters.get('role'):
                    medical_records = medical_records.filter(patient__user__role=filters['role'])
                    dental_records = dental_records.filter(patient__user__role=filters['role'])
                
                department = filters.get('department')
                if department == 'MEDICAL':
                    dental_records = dental_records.none()
                elif department == 'DENTAL':
                    medical_records = medical_records.none()

            total_medical = medical_records.count()
            total_dental = dental_records.count()
            total_visits = total_medical + total_dental
            
            medical_patients = set(medical_records.values_list('patient_id', flat=True))
            dental_patients = set(dental_records.values_list('patient_id', flat=True))
            unique_patients = len(medical_patients | dental_patients)
            
            m_data = [{'date': r.visit_date, 'type': 'medical'} for r in medical_records]
            d_data = [{'date': r.visit_date, 'type': 'dental'} for r in dental_records]
            
            monthly_summary = []
            if m_data or d_data:
                df = pd.DataFrame(m_data + d_data)
                # Ensure date is datetime
                df['date'] = pd.to_datetime(df['date'])
                df['month'] = df['date'].dt.strftime('%Y-%m')
                monthly_counts = df.groupby(['month', 'type']).size().unstack(fill_value=0)
                
                # Ensure columns exist
                for t in ['medical', 'dental']:
                    if t not in monthly_counts.columns:
                        monthly_counts[t] = 0
                
                monthly_counts['total'] = monthly_counts['medical'] + monthly_counts['dental']
                monthly_counts = monthly_counts.sort_index()
                
                # Calculate growth
                if len(monthly_counts) > 1:
                    monthly_counts['growth'] = monthly_counts['total'].pct_change() * 100
                else:
                    monthly_counts['growth'] = 0
                    
                monthly_counts = monthly_counts.fillna(0)
                
                for month, row in monthly_counts.iterrows():
                    monthly_summary.append({
                        'month': month, 
                        'total_visits': int(row['total']),
                        'medical_visits': int(row.get('medical', 0)), 
                        'dental_visits': int(row.get('dental', 0)),
                        'growth_percentage': f"{float(row.get('growth', 0)):.1f}%"
                    })
            else:
                # Provide at least current month with zero data if empty
                current_month = timezone.now().strftime('%Y-%m')
                monthly_summary.append({
                    'month': current_month,
                    'total_visits': 0,
                    'medical_visits': 0,
                    'dental_visits': 0,
                    'growth_percentage': "0%"
                })
                
            # Apply customization (field selection and grouping)
            monthly_summary = ReportDataService._apply_customization(monthly_summary, filters)
            
            days_diff = (date_end - date_start).days or 1
            avg_daily = round(total_visits / days_diff, 1)
            peak_day_visits = 0
            if m_data or d_data:
                df_day = pd.DataFrame(m_data + d_data)
                df_day['date'] = pd.to_datetime(df_day['date'])
                df_day['day'] = df_day['date'].dt.date
                peak_day_visits = int(df_day.groupby('day').size().max())
                
            return {
                'total_visits': total_visits, 
                'unique_patients': unique_patients,
                'avg_daily_visits': avg_daily, 
                'peak_day_visits': peak_day_visits,
                'monthly_summary': monthly_summary, 
                'summary_by_type': {'Medical': total_medical, 'Dental': total_dental}
            }
        except Exception as e:
            logger.error(f"Error in get_visit_trends_data: {str(e)}")
            return {'error': str(e), 'total_visits': 0}

    @staticmethod
    def get_treatment_outcomes_data(date_start=None, date_end=None, filters=None):
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            queryset = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            total_cases = queryset.count()
            
            if total_cases == 0: 
                return {
                    'total_cases': 0, 'top_diagnoses': [], 
                    'treatment_distribution': [], 'priority_breakdown': []
                }
            
            # Top Diagnoses
            diagnoses = queryset.values('diagnosis').annotate(count=Count('id')).order_by('-count')[:10]
            top_diagnoses = [{
                'name': d['diagnosis'], 
                'count': d['count'],
                'percentage': (d['count'] / total_cases) * 100
            } for d in diagnoses]
            
            # Treatment Distribution
            treatments = queryset.values('treatment').annotate(count=Count('id')).order_by('-count')[:10]
            treatment_distribution = [{
                'name': t['treatment'], 
                'count': t['count'],
                'percentage': (t['count'] / total_cases) * 100
            } for t in treatments]

            return {
                'total_cases': total_cases,
                'top_diagnoses': top_diagnoses,
                'treatment_distribution': treatment_distribution
            }
        except Exception as e: 
            logger.error(f"Error in get_treatment_outcomes_data: {str(e)}")
            return {'error': str(e), 'total_cases': 0}

    @staticmethod
    def get_user_activity_data(date_start=None, date_end=None, filters=None):
        try:
            users = User.objects.all()
            
            # Apply user filter if provided
            user_id = (filters or {}).get('user_id')
            if user_id:
                users = users.filter(id=user_id)
                
            active_users_log = []
            for u in users.order_by('-last_login')[:100]:
                active_users_log.append({
                    'user': u.get_full_name() or u.email, 
                    'role': u.role, 
                    'timestamp': u.last_login, 
                    'status': 'Active' if u.is_active else 'Inactive'
                })
            
            # Apply customization
            active_users_log = ReportDataService._apply_customization(active_users_log, filters or {})
            
            return {
                'total_users': users.count(), 
                'active_users_period': users.filter(last_login__gte=date_start or timezone.now()-timedelta(days=30)).count(),
                'system_log': active_users_log 
            }
        except Exception as e: return {'error': str(e)}

    @staticmethod
    def get_health_metrics_data(date_start=None, date_end=None, filters=None):
        try:
            from notifications.models import Notification
            
            # Calculate real avg age of population
            patients = Patient.objects.all()
            total_pop = patients.count()
            ages = [p.age for p in patients if p.age is not None]
            avg_age = sum(ages) / len(ages) if ages else 0
            
            # Health alerts (unread system notifications in the period)
            health_alerts = Notification.objects.filter(
                notification_type='SYSTEM',
                status__in=['PENDING', 'SENT', 'DELIVERED'],
                created_at__range=(date_start or (timezone.now() - timedelta(days=365)), date_end or timezone.now())
            ).count()
            
            # Sample metrics list for customization
            metrics = [
                {'metric_name': 'Total Population', 'value': total_pop, 'unit': 'Patients'},
                {'metric_name': 'Average Age', 'value': round(avg_age, 1), 'unit': 'Years'},
                {'metric_name': 'System Alerts', 'value': health_alerts, 'unit': 'Notifications'}
            ]
            
            # Apply customization
            metrics = ReportDataService._apply_customization(metrics, filters or {})

            return {
                'total_population': total_pop, 
                'age_average': round(avg_age, 1), 
                'health_alerts': health_alerts,
                'metrics_details': metrics
            }
        except Exception as e:
            logger.error(f"Error in get_health_metrics_data: {e}")
            return {'total_population': Patient.objects.count(), 'age_average': 0, 'health_alerts': 0}

    @staticmethod
    def get_feedback_analysis_data(date_start=None, date_end=None, filters=None):
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            feedback_qs = Feedback.objects.filter(created_at__range=(date_start, date_end))
            
            # Apply filters
            if filters:
                if filters.get('rating'):
                    feedback_qs = feedback_qs.filter(rating=filters['rating'])
                if filters.get('visit_type'):
                    # visit_type can be MEDICAL or DENTAL
                    # We might need to join with MedicalRecord or DentalRecord if visit_type is stored there
                    # For now, let's assume Feedback has a visit_type field or we filter based on patient interaction
                    # If visit_type is not on Feedback, we might need a more complex join.
                    # Assuming for this requirement it filters by a field named visit_type if it exists,
                    # or we filter by the existence of related records in the time range.
                    v_type = filters['visit_type'].upper()
                    if v_type == 'MEDICAL':
                        feedback_qs = feedback_qs.filter(medical_record__isnull=False)
                    elif v_type == 'DENTAL':
                        feedback_qs = feedback_qs.filter(dental_record__isnull=False)
            
            total = feedback_qs.count()
            
            # Calculate response rate (total feedback / total visits)
            medical_count = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()
            dental_count = DentalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()
            total_visits = medical_count + dental_count
            response_rate = (total / total_visits * 100) if total_visits > 0 else 0

            if total == 0:
                return {
                    'total_responses': 0, 'avg_rating': 0, 'satisfaction_score': 0,
                    'response_rate': 0, 'total_visits': total_visits,
                    'date_range_start': date_start, 'date_range_end': date_end,
                    'recent_comments': [], 'rating_distribution': []
                }
                
            avg = feedback_qs.aggregate(Avg('rating'))['rating__avg'] or 0
            comments = []
            for f in feedback_qs.order_by('-created_at')[:20]:
                patient_id = "Anonymous"
                if hasattr(f, 'patient') and f.patient:
                    patient_id = getattr(f.patient.user, 'id_number', None) or f.patient.id
                
                comments.append({
                    'rating': f.rating, 
                    'date': f.created_at, 
                    'text': f.comments or "No comment",
                    'patient_id': patient_id
                })
                
            # Apply customization to comments
            comments = ReportDataService._apply_customization(comments, filters or {})

            excellent_count = feedback_qs.filter(rating=5).count()
            good_count = feedback_qs.filter(rating=4).count()
            fair_count = feedback_qs.filter(rating=3).count()
            poor_count = feedback_qs.filter(rating__lte=2).count()

            rating_distribution = [
                {'category': 'Excellent (5★)', 'count': excellent_count, 'percentage': (excellent_count/total*100)},
                {'category': 'Good (4★)', 'count': good_count, 'percentage': (good_count/total*100)},
                {'category': 'Fair (3★)', 'count': fair_count, 'percentage': (fair_count/total*100)},
                {'category': 'Poor (1-2★)', 'count': poor_count, 'percentage': (poor_count/total*100)},
            ]

            # Apply customization to rating distribution
            rating_distribution = ReportDataService._apply_customization(rating_distribution, filters or {})

            return {                'total_responses': total, 
                'total_visits': total_visits,
                'response_rate': round(float(response_rate), 1),
                'avg_rating': round(float(avg), 1), 
                'satisfaction_score': round(float(avg/5*100), 1),
                'excellent_count': excellent_count, 'excellent_percentage': (excellent_count/total*100),
                'good_count': good_count, 'good_percentage': (good_count/total*100),
                'fair_count': fair_count, 'fair_percentage': (fair_count/total*100),
                'poor_count': poor_count, 'poor_percentage': (poor_count/total*100),
                'rating_distribution': rating_distribution,
                'recent_comments': comments,
                'date_range_start': date_start,
                'date_range_end': date_end,
                'generated_at': timezone.now()
            }
        except Exception as e: 
            logger.error(f"Error in get_feedback_analysis_data: {str(e)}")
            return {'error': str(e), 'total_responses': 0}

    @staticmethod
    def get_campaign_performance_data(date_start=None, date_end=None, filters=None):
        try:
            filters = filters or {}
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            queryset = HealthCampaign.objects.all()
            
            # Apply filters
            campaign_ids = filters.get('campaign_ids')
            if campaign_ids:
                if isinstance(campaign_ids, list):
                    queryset = queryset.filter(id__in=campaign_ids)
                else:
                    queryset = queryset.filter(id=campaign_ids)
            
            campaign_type = filters.get('campaign_type') or filters.get('category')
            if campaign_type:
                queryset = queryset.filter(campaign_type=campaign_type)
            
            # Date range filter (only if not filtering by specific IDs)
            if not campaign_ids:
                queryset = queryset.filter(created_at__range=(date_start, date_end))
            
            total_campaigns = queryset.count()
            
            if total_campaigns == 0:
                return {
                    'total_views': 0, 'avg_views_per_campaign': 0, 
                    'campaign_performance': [], 'asset_effectiveness': []
                }
                
            perf = []
            total_views = 0
            
            # Asset tracking
            with_pubmat = {'count': 0, 'views': 0}
            without_pubmat = {'count': 0, 'views': 0}
            with_banner = {'count': 0, 'views': 0}
            
            for c in queryset:
                total_views += c.view_count
                
                perf.append({
                    'title': c.title, 
                    'views': c.view_count,
                    'type': c.get_campaign_type_display(),
                    'priority': c.get_priority_display(),
                    'performance': 'High' if c.view_count > 100 else ('Medium' if c.view_count > 50 else 'Low')
                })
                
                # Effectiveness analysis
                if c.pubmat_image:
                    with_pubmat['count'] += 1
                    with_pubmat['views'] += c.view_count
                else:
                    without_pubmat['count'] += 1
                    without_pubmat['views'] += c.view_count
                    
                if c.banner_image:
                    with_banner['count'] += 1
                    with_banner['views'] += c.view_count

            avg_views = total_views / max(total_campaigns, 1)
            
            # Calculate asset effectiveness
            asset_effectiveness = []
            if with_pubmat['count'] > 0:
                asset_effectiveness.append({
                    'asset_type': 'With PubMat',
                    'campaigns': with_pubmat['count'],
                    'avg_views': with_pubmat['views'] / with_pubmat['count']
                })
            if without_pubmat['count'] > 0:
                asset_effectiveness.append({
                    'asset_type': 'Without PubMat',
                    'campaigns': without_pubmat['count'],
                    'avg_views': without_pubmat['views'] / without_pubmat['count']
                })
            if with_banner['count'] > 0:
                asset_effectiveness.append({
                    'asset_type': 'With Banner',
                    'campaigns': with_banner['count'],
                    'avg_views': with_banner['views'] / with_banner['count']
                })
                
            # Apply customization (field selection and grouping)
            perf = ReportDataService._apply_customization(perf, filters)

            return {
                'total_views': total_views,
                'avg_views_per_campaign': avg_views, 
                'campaign_performance': perf,
                'asset_effectiveness': asset_effectiveness
            }
        except Exception as e: 
            logger.error(f"Error in get_campaign_performance_data: {str(e)}")
            return {'error': str(e), 'total_views': 0}

    @staticmethod
    def get_medical_statistics_data(date_start=None, date_end=None, filters=None):
        try:
            filters = filters or {}
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            records = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            # Apply diagnosis category filter
            diag_category = filters.get('diagnosis_category')
            if diag_category:
                records = records.filter(diagnosis__icontains=diag_category)
            
            # Calculate real avg age
            patients = Patient.objects.filter(medical_records__in=records).distinct()
            avg_age = 0
            if patients.exists():
                ages = [p.age for p in patients if p.age is not None]
                avg_age = sum(ages) / len(ages) if ages else 0

            # Vitals Metrics
            vitals = records.aggregate(
                avg_weight=Avg('weight'),
                avg_height=Avg('height'),
                avg_bmi=Avg('bmi'),
                max_bp_sys=Max('blood_pressure_systolic'),
                min_bp_sys=Max('blood_pressure_systolic') # approximate
            )

            diag = []
            # Group by diagnosis and calculate counts
            diagnosis_groups = records.values('diagnosis').annotate(
                count=Count('id')
            ).order_by('-count')[:10]

            for item in diagnosis_groups:
                # Get patients with this specific diagnosis for demographic context
                diag_patients = Patient.objects.filter(
                    medical_records__in=records.filter(diagnosis=item['diagnosis'])
                ).distinct()
                diag_ages = [p.age for p in diag_patients if p.age is not None]
                diag_avg_age = sum(diag_ages) / len(diag_ages) if diag_ages else 0

                diag.append({
                    'name': item['diagnosis'] or "General Consultation", 
                    'case_count': item['count'], 
                    'percentage': (item['count'] / max(records.count(), 1)) * 100,
                    'avg_age': round(diag_avg_age, 1)
                })
            
            # Monthly trends
            monthly_trends = []
            if records.exists():
                df = pd.DataFrame(list(records.values('visit_date')))
                df['visit_date'] = pd.to_datetime(df['visit_date'])
                df['month'] = df['visit_date'].dt.strftime('%b %Y')
                counts = df.groupby('month').size()
                for month, count in counts.items():
                    monthly_trends.append({
                        'name': month, 
                        'total': int(count), 
                        'medical': int(count), 
                        'emergency': 0 
                    })

            # Apply customization (field selection and grouping)
            diag = ReportDataService._apply_customization(diag, filters or {})
            monthly_trends = ReportDataService._apply_customization(monthly_trends, filters or {})

            return {
                'total_patients': patients.count(), 
                'total_consultations': records.count(), 
                'avg_age': round(float(avg_age), 1), 
                'top_diagnoses': diag, 
                'vitals_summary': vitals,
                'monthly_trends': sorted(monthly_trends, key=lambda x: x['name']) if isinstance(monthly_trends, list) else monthly_trends
            }
        except Exception as e: 
            logger.error(f"Error in get_medical_statistics_data: {str(e)}")
            return {'error': str(e), 'total_consultations': 0}

    @staticmethod
    def get_dental_statistics_data(date_start=None, date_end=None, filters=None):
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            records = DentalRecord.objects.filter(visit_date__range=(date_start, date_end))
            total_records = records.count()

            if total_records == 0:
                return {
                    'total_records': 0, 'common_procedures': [], 
                    'hygiene_stats': [], 'gum_stats': [], 'priority_stats': []
                }
            
            # Common procedures with display labels
            proc_counts = records.values('procedure_performed').annotate(count=Count('id')).order_by('-count')
            proc_map = dict(DentalRecord.PROCEDURE_CHOICES)
            common_procedures = [{
                'name': proc_map.get(item['procedure_performed'], item['procedure_performed']),
                'count': item['count'],
                'percentage': (item['count'] / total_records) * 100
            } for item in proc_counts]

            # Oral hygiene status distribution
            hygiene_counts = records.exclude(oral_hygiene_status='').values('oral_hygiene_status').annotate(count=Count('id'))
            hygiene_map = dict([
                ('EXCELLENT', 'Excellent'), ('GOOD', 'Good'), ('FAIR', 'Fair'), ('POOR', 'Poor')
            ])
            hygiene_stats = [{
                'status': hygiene_map.get(item['oral_hygiene_status'], item['oral_hygiene_status']),
                'count': item['count']
            } for item in hygiene_counts]

            # Gum condition distribution
            gum_counts = records.exclude(gum_condition='').values('gum_condition').annotate(count=Count('id'))
            gum_map = dict([
                ('HEALTHY', 'Healthy'), ('GINGIVITIS', 'Gingivitis'), 
                ('PERIODONTITIS', 'Periodontitis'), ('INFLAMMATION', 'Inflammation')
            ])
            gum_stats = [{
                'condition': gum_map.get(item['gum_condition'], item['gum_condition']),
                'count': item['count']
            } for item in gum_counts]

            # Priority breakdown
            priority_counts = records.values('priority').annotate(count=Count('id'))
            priority_map = dict(DentalRecord.PRIORITY_CHOICES)
            priority_stats = [{
                'label': priority_map.get(item['priority'], item['priority']),
                'count': item['count']
            } for item in priority_counts]

            # Preventive care calculation (Cleaning, Prophylaxis, Fluoride, Sealant)
            preventive_types = ['CLEANING', 'PROPHYLAXIS', 'FLUORIDE', 'SEALANT']
            preventive_count = records.filter(procedure_performed__in=preventive_types).count()
            preventive_rate = (preventive_count / total_records) * 100 if total_records > 0 else 0

            # Apply customization (field selection and grouping)
            common_procedures = ReportDataService._apply_customization(common_procedures, filters or {})
            hygiene_stats = ReportDataService._apply_customization(hygiene_stats, filters or {})
            gum_stats = ReportDataService._apply_customization(gum_stats, filters or {})
            priority_stats = ReportDataService._apply_customization(priority_stats, filters or {})

            return {
                'total_records': total_records,
                'preventive_care_rate': round(preventive_rate, 1),
                'common_procedures': common_procedures,
                'hygiene_stats': hygiene_stats,
                'gum_stats': gum_stats,
                'priority_stats': priority_stats
            }
        except Exception as e: 
            logger.error(f"Error in get_dental_statistics_data: {str(e)}")
            return {'error': str(e), 'total_records': 0}

    @staticmethod
    def get_comprehensive_analytics_data(date_start=None, date_end=None, filters=None):
        return {'total_patients': Patient.objects.count(), 'total_visits': MedicalRecord.objects.count() + DentalRecord.objects.count()}

    @staticmethod
    def _get_peak_hours(queryset):
        """Helper to calculate peak hours from a queryset of records with visit_date"""
        hours = {str(i).zfill(2): 0 for i in range(8, 18)}  # 8 AM to 5 PM
        for record in queryset:
            if hasattr(record, 'visit_date') and record.visit_date:
                # Use visit_date for better clinical timeline accuracy
                hour = record.visit_date.astimezone().strftime('%H')
                if hour in hours:
                    hours[hour] += 1
        return [{'hour': f"{h}:00", 'count': c} for h, c in hours.items()]
        
    @staticmethod
    def _get_college_participation(patients):
        """Helper to aggregate patients by college/school"""
        colleges = {}
        for patient in patients:
            if patient.user and patient.user.course:
                # Extract college from course (assuming format like "BSCS (SOE)")
                course = patient.user.course.upper()
                # Simple heuristic: look for common USC acronyms in the string
                college = "Other"
                if "SOE" in course or "ENGINEERING" in course: college = "SOE"
                elif "SAFAD" in course or "ARCHITECTURE" in course: college = "SAFAD"
                elif "SBE" in course or "BUSINESS" in course: college = "SBE"
                elif "SAS" in course or "ARTS" in course or "SCIENCE" in course: college = "SAS"
                elif "SHCP" in course or "HEALTH" in course: college = "SHCP"
                elif "SED" in course or "EDUCATION" in course: college = "SED"
                elif "SLG" in course or "LAW" in course: college = "SLG"
                
                colleges[college] = colleges.get(college, 0) + 1
            elif patient.user and patient.user.department:
                 dept = patient.user.department
                 colleges[dept] = colleges.get(dept, 0) + 1
        
        return sorted([{'name': k, 'count': v} for k, v in colleges.items() if k != "Other"], key=lambda x: x['count'], reverse=True)

    @staticmethod
    def _get_role_distribution(patients):
        """Helper to aggregate patients by role"""
        roles = {'STUDENT': 0, 'STAFF': 0, 'FACULTY': 0, 'OTHER': 0}
        for patient in patients:
            if patient.user:
                role = patient.user.role
                if role in roles:
                    roles[role] += 1
                else:
                    roles['OTHER'] += 1
        return [{'role': k, 'count': v} for k, v in roles.items() if v > 0]

    @staticmethod
    def get_comprehensive_system_analytics(date_start=None, date_end=None, filters=None):
        """Aggregate data for system-wide dashboard visualizations"""
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            # Use visit_date for more accurate clinical timeline
            medical_records = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            dental_records = DentalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            # Apply filters
            if filters:
                if filters.get('college'):
                    pass # Handled on frontend for MVP simplicity
                if filters.get('clinic_type') == 'medical':
                    dental_records = DentalRecord.objects.none()
                elif filters.get('clinic_type') == 'dental':
                    medical_records = MedicalRecord.objects.none()
            
            trends = ReportDataService.get_visit_trends_data(date_start, date_end, filters)
            
            medical_count = medical_records.count()
            dental_count = dental_records.count()
            
            medical_stats = ReportDataService.get_medical_statistics_data(date_start, date_end, filters)
            dental_stats = ReportDataService.get_dental_statistics_data(date_start, date_end, filters)
            
            feedback = ReportDataService.get_feedback_analysis_data(date_start, date_end, filters)
            
            # Get distinct patients for demographics
            med_patients = Patient.objects.filter(id__in=medical_records.values('patient_id')).select_related('user')
            den_patients = Patient.objects.filter(id__in=dental_records.values('patient_id')).select_related('user')
            all_active_patients = list(set(list(med_patients) + list(den_patients)))

            # Calculate Peak Hours
            peak_hours = ReportDataService._get_peak_hours(list(medical_records) + list(dental_records))
            
            # Calculate College Participation
            college_participation = ReportDataService._get_college_participation(all_active_patients)
            
            # Calculate Role Distribution (Student vs Staff)
            role_distribution = ReportDataService._get_role_distribution(all_active_patients)

            return {
                'demographics': {
                    'colleges': college_participation,
                    'roles': role_distribution,
                    'total_active': len(all_active_patients)
                },
                'visits': {
                    'monthly': trends.get('monthly_summary', []),
                    'types': {'medical': medical_count, 'dental': dental_count},
                    'total': trends.get('total_visits', 0)
                },
                'clinical': {
                    'top_diagnoses': medical_stats.get('top_diagnoses', [])[:5],
                    'top_procedures': dental_stats.get('common_procedures', [])[:5]
                },
                'satisfaction': {
                    'distribution': feedback.get('rating_distribution', []),
                    'average': feedback.get('avg_rating', 0)
                },
                'operations': {
                    'peak_hours': peak_hours
                },
                'period': {
                    'start': date_start.strftime('%Y-%m-%d'),
                    'end': date_end.strftime('%Y-%m-%d')
                }
            }
        except Exception as e:
            logger.error(f"Error in get_comprehensive_system_analytics: {str(e)}")
            return {'error': str(e)}

from reportlab.lib.enums import TA_CENTER, TA_LEFT

class USCPISReportGenerator:
    """
    Advanced Python Reporting Engine for USC-PIS.
    Fixes flat-table issues by introducing analytical visualization and institutional branding.
    """
    def __init__(self, buffer, generator_user):
        self.buffer = buffer
        # Handle generator_user as either a dict or a User object
        if hasattr(generator_user, 'get_full_name'):
            self.generator_user = {
                'name': generator_user.get_full_name() or generator_user.email,
                'id': getattr(generator_user, 'usc_id', str(generator_user.id))
            }
        else:
            self.generator_user = generator_user or {'name': 'System', 'id': 'N/A'}
        
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()

    def _create_custom_styles(self):
        from reportlab.lib import colors
        from reportlab.lib.styles import ParagraphStyle
        # Professional Header Style
        if 'InstitutionalTitle' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='InstitutionalTitle', fontName='Helvetica-Bold', fontSize=14,
                leading=16, alignment=TA_CENTER, textColor=colors.HexColor("#003366")
            ))
        # Analytical Metric Value
        if 'MetricValue' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='MetricValue', fontName='Helvetica-Bold', fontSize=16,
                leading=20, alignment=TA_CENTER, textColor=colors.HexColor("#1976d2")
            ))
        # Wrapped Table Cell
        if 'WrappedCell' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='WrappedCell', fontName='Helvetica', fontSize=8,
                leading=10, alignment=TA_LEFT, wordWrap='LTR'
            ))

    def draw_header_footer(self, canvas, doc):
        """Mandatory Institutional Branding Block on Every Page"""
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        canvas.saveState()
        
        # --- HEADER ---
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawCentredString(A4[0]/2, A4[1]-15*mm, "UNIVERSITY OF SAN CARLOS")
        canvas.setFont('Helvetica', 10)
        canvas.drawCentredString(A4[0]/2, A4[1]-20*mm, "USC Health Services Department")
        canvas.setFont('Helvetica-Oblique', 8)
        canvas.drawCentredString(A4[0]/2, A4[1]-24*mm, "Talamban Campus, Nasipit, Talamban, Cebu City")
        canvas.setStrokeColor(colors.HexColor("#003366"))
        canvas.line(20*mm, A4[1]-27*mm, A4[0]-20*mm, A4[1]-27*mm)
        
        # --- FOOTER ---
        canvas.setFont('Helvetica', 8)
        canvas.setStrokeColor(colors.lightgrey)
        canvas.line(20*mm, 15*mm, A4[0]-20*mm, 15*mm)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        gen_info = f"Generated by: {self.generator_user['name']} (ID: {self.generator_user['id']})"
        canvas.drawString(20*mm, 10*mm, gen_info)
        canvas.drawCentredString(A4[0]/2, 10*mm, f"Printed: {timestamp}")
        canvas.drawRightString(A4[0]-20*mm, 10*mm, f"Page {doc.page} | Confidential Medical Record")
        
        canvas.restoreState()

    def create_analytics_cards(self, summary_data):
        """Metric Card Grid for High-Level Insights"""
        from reportlab.platypus import Table, TableStyle, Paragraph
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        
        data = [
            [Paragraph("Total Consultations", self.styles['Normal']), 
             Paragraph("Student Ratio", self.styles['Normal']), 
             Paragraph("Staff/Faculty", self.styles['Normal'])],
            [Paragraph(str(summary_data.get('total', 0)), self.styles['MetricValue']), 
             Paragraph(f"{summary_data.get('student_pct', 0)}%", self.styles['MetricValue']), 
             Paragraph(str(summary_data.get('staff_count', 0)), self.styles['MetricValue'])]
        ]
        t = Table(data, colWidths=[55*mm, 55*mm, 55*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8f9fa")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#dee2e6")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        return t

    def create_reasons_chart(self, chart_data):
        """Labeled Visualization of Consultation Trends"""
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.lib import colors
        
        drawing = Drawing(400, 180)
        bc = VerticalBarChart()
        bc.x = 50; bc.y = 50
        bc.height = 100; bc.width = 300
        bc.data = [chart_data.get('values', [0])]
        bc.strokeColor = colors.white
        bc.valueAxis.valueMin = 0
        bc.valueAxis.labels.fontSize = 8
        bc.categoryAxis.labels.fontSize = 8
        bc.categoryAxis.labels.angle = 45
        bc.categoryAxis.labels.dx = 5
        bc.categoryAxis.labels.dy = -10
        bc.categoryAxis.categoryNames = chart_data.get('labels', ['N/A'])
        bc.bars[0].fillColor = colors.HexColor("#1976d2")
        drawing.add(bc)
        return drawing

    def build_document(self, records, analytics, title="Clinical Report"):
        """Main Construction Pipeline"""
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        
        doc = SimpleDocTemplate(
            self.buffer, pagesize=A4,
            leftMargin=20*mm, rightMargin=20*mm, 
            topMargin=35*mm, bottomMargin=25*mm
        )
        
        elements = []
        
        # 1. Branding & Title
        elements.append(Paragraph(title.upper(), self.styles['InstitutionalTitle']))
        elements.append(Spacer(1, 10*mm))
        
        # 2. Executive Summary Cards
        elements.append(Paragraph("<b>Summary Metrics</b>", self.styles['Normal']))
        elements.append(Spacer(1, 2*mm))
        elements.append(self.create_analytics_cards(analytics.get('summary', {})))
        elements.append(Spacer(1, 10*mm))
        
        # 3. Visualization
        if analytics.get('charts'):
            elements.append(Paragraph("<b>Distribution Analysis</b>", self.styles['Normal']))
            elements.append(self.create_reasons_chart(analytics['charts']))
            elements.append(Spacer(1, 10*mm))
        
        # 4. Detailed Logs (Fixed Wrapping & Alignment)
        elements.append(PageBreak())
        elements.append(Paragraph("<b>Detailed Activity Logs</b>", self.styles['Normal']))
        elements.append(Spacer(1, 4*mm))
        
        if records and len(records) > 0:
            # Header for the table - Dynamic based on first record keys if possible
            first_record = records[0]
            if isinstance(first_record, dict):
                keys = list(first_record.keys())[:4] # limit to 4 columns for A4
                headers = [str(k).replace('_', ' ').title() for k in keys]
                table_data = [headers]
                
                for r in records[:500]: # Safety limit
                    row = [Paragraph(str(r.get(k, '')), self.styles['WrappedCell']) for k in keys]
                    table_data.append(row)

                # Strict Column Widths (Sum = 170mm for A4 with 20mm margins)
                col_widths = [170 / len(keys) * mm] * len(keys)
                t = Table(table_data, colWidths=col_widths, repeatRows=1)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,-1), 8),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ]))
                elements.append(t)
            else:
                for r in records[:500]:
                    elements.append(Paragraph(str(r), self.styles['Normal']))
        else:
            elements.append(Paragraph("No detailed records found for this period.", self.styles['Normal']))
        
        # Generate with header/footer hook
        doc.build(elements, onFirstPage=self.draw_header_footer, onLaterPages=self.draw_header_footer)

class ReportExportService:
    """Service for exporting reports in different formats with robust error handling"""

    @staticmethod
    def export_to_html(report_data, template_content, title="Report", extra_context=None):
        try:
            context = {
                'title': title, 'generated_at': timezone.now(), 'report_data': report_data,
                'report_date': timezone.now().strftime('%B %d, %Y'),
                'date_range_start': report_data.get('date_range_start', timezone.now() - timedelta(days=365)) if isinstance(report_data, dict) else timezone.now() - timedelta(days=365),
                'date_range_end': report_data.get('date_range_end', timezone.now()) if isinstance(report_data, dict) else timezone.now()
            }
            if extra_context: context.update(extra_context)
            if isinstance(report_data, dict): context.update(report_data)
            tpl = Template(template_content or "<html><body><h1>{{ title }}</h1><pre>{{ report_data }}</pre></body></html>")
            return tpl.render(Context(context)).encode('utf-8')
        except Exception as e:
            logger.error(f"HTML export failed: {e}")
            return None

    @staticmethod
    def export_to_pdf(report_data, template_content, title="Report", user=None):
        try:
            # 1. High-Fidelity HTML-to-PDF (Primary)
            if template_content:
                try:
                    from xhtml2pdf import pisa
                    context = {
                        'title': title, 'generated_at': timezone.now(), 'report_data': report_data,
                        'report_date': timezone.now().strftime('%B %d, %Y'),
                        'date_range_start': report_data.get('date_range_start', timezone.now() - timedelta(days=365)) if isinstance(report_data, dict) else timezone.now() - timedelta(days=365),
                        'date_range_end': report_data.get('date_range_end', timezone.now()) if isinstance(report_data, dict) else timezone.now(),
                        'user': user
                    }
                    if isinstance(report_data, dict): context.update(report_data)
                    html = Template(template_content).render(Context(context))
                    buffer = BytesIO()
                    pisa_status = pisa.CreatePDF(html, dest=buffer)
                    if not pisa_status.err:
                        pdf_data = buffer.getvalue()
                        if pdf_data and len(pdf_data) > 100: return pdf_data
                except Exception as e:
                    logger.warning(f"xhtml2pdf failed, falling back to Professional ReportLab: {e}")

            # 2. Professional Analytical ReportLab Generator (Advanced Fallback)
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            
            buffer = BytesIO()
            generator = USCPISReportGenerator(buffer, user)
            
            # Extract analytics and records from report_data
            analytics = {'summary': {}, 'charts': {'labels': [], 'values': []}}
            records = []
            
            if isinstance(report_data, dict):
                # Try to find analytics summary
                analytics['summary'] = {
                    'total': report_data.get('total_visits', report_data.get('total_count', report_data.get('record_count', 0))),
                    'student_pct': report_data.get('student_percentage', 70), 
                    'staff_count': report_data.get('staff_count', report_data.get('faculty_count', 0))
                }
                
                # If comprehensive analytics, use its deeper structure
                if 'demographics' in report_data:
                    analytics['summary']['total'] = report_data.get('visits', {}).get('total', analytics['summary']['total'])
                    roles = report_data.get('demographics', {}).get('roles', {})
                    analytics['summary']['staff_count'] = roles.get('STAFF', 0) + roles.get('FACULTY', 0)
                
                # Map chart data from clinical stats if available
                if 'top_diagnoses' in report_data:
                    diag = report_data['top_diagnoses']
                    analytics['charts']['labels'] = [d.get('name', d.get('diagnosis', 'N/A'))[:15] for d in diag[:5]]
                    analytics['charts']['values'] = [d.get('count', d.get('total', 0)) for d in diag[:5]]
                elif 'common_procedures' in report_data:
                    proc = report_data['common_procedures']
                    analytics['charts']['labels'] = [p.get('name', 'N/A')[:15] for p in proc[:5]]
                    analytics['charts']['values'] = [p.get('count', 0) for p in proc[:5]]
                
                # Extract records - find the first significant list that isn't a chart/summary list
                list_keys = [k for k, v in report_data.items() if isinstance(v, list) and len(v) > 0 and k not in ['visual_charts', 'rating_distribution', 'top_diagnoses', 'common_procedures']]
                if list_keys:
                    records = report_data[list_keys[0]]
            
            generator.build_document(records, analytics, title=title)
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Professional PDF export failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    def export_to_excel(report_data, title="Report"):
        if not report_data: return None
        try:
            buffer = BytesIO()
            with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
                # 1. Report Info Sheet (Align with PDF Header)
                info_data = [
                    ['Report Title', title.upper()],
                    ['University', 'University of San Carlos Clinic'],
                    ['Generated At', timezone.now().strftime('%Y-%m-%d %H:%M:%S')],
                    ['Date Range Start', str(report_data.get('date_range_start', 'N/A'))],
                    ['Date Range End', str(report_data.get('date_range_end', 'N/A'))],
                    ['System', 'USC Patient Information System']
                ]
                pd.DataFrame(info_data, columns=['Report Metadata', 'Value']).to_excel(writer, sheet_name='Report Info', index=False)

                # 2. Summary Metrics (Align with PDF Executive Summary)
                summary_items = []; list_keys = []
                skip_keys = ['report_title', 'date_range_start', 'date_range_end', 'generated_at', 'system_name', 'report_date']
                
                for k, v in report_data.items():
                    if k in skip_keys: continue
                    if isinstance(v, (list, tuple)): 
                        list_keys.append(k)
                    elif isinstance(v, dict):
                        for sub_k, sub_v in v.items(): 
                            summary_items.append({'Metric': f"{k} - {sub_k}", 'Value': str(sub_v)})
                    else: 
                        summary_items.append({'Metric': str(k).replace('_', ' ').title(), 'Value': str(v)})
                
                if summary_items:
                    pd.DataFrame(summary_items).to_excel(writer, sheet_name='Executive Summary', index=False)
                
                # 3. Detailed Sheets (Align with PDF Tables)
                for key in list_keys:
                    data_list = report_data[key]
                    if data_list and isinstance(data_list[0], dict):
                        df = pd.DataFrame(data_list)
                        df.columns = [str(c).replace('_', ' ').title() for c in df.columns]
                        for col in df.select_dtypes(include=['datetime64[ns, UTC]', 'datetimetz']).columns: 
                            df[col] = df[col].dt.tz_localize(None)
                        df.to_excel(writer, sheet_name=str(key).replace('_', ' ').title()[:31], index=False)
            return buffer.getvalue()
        except Exception as e:
            logger.error(f"Excel export failed: {e}")
            return None

    @staticmethod
    def export_to_csv(report_data, title="Report"):
        if not report_data: return None
        try:
            output = StringIO(); writer = csv.writer(output)
            writer.writerow([f"REPORT: {title.upper()}"]); writer.writerow([f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}"]); writer.writerow([])
            list_keys = []; writer.writerow(["SUMMARY OVERVIEW"])
            for k, v in report_data.items():
                if isinstance(v, (list, tuple)): list_keys.append(k)
                elif isinstance(v, dict):
                    for sk, sv in v.items(): writer.writerow([f"{k} - {sk}", sv])
                else: writer.writerow([k, v])
            for key in list_keys:
                writer.writerow([]); writer.writerow([str(key).upper()])
                data_list = report_data[key]; 
                if data_list and isinstance(data_list[0], dict):
                    headers = list(data_list[0].keys()); writer.writerow(headers)
                    for item in data_list: writer.writerow([item.get(h, '') for h in headers])
            return output.getvalue().encode('utf-8')
        except Exception as e:
            logger.error(f"CSV export failed: {e}")
            return None

    @staticmethod
    def export_to_json(report_data, title="Report"):
        try:
            return json.dumps({'title': title, 'generated_at': timezone.now().isoformat(), 'data': report_data}, default=str).encode('utf-8')
        except Exception as e:
            logger.error(f"JSON export failed: {e}")
            return None

class ReportGenerationService:
    @staticmethod
    def get_supported_formats():
        return ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML']

    def __init__(self):
        self.data_service = ReportDataService()
        self.export_service = ReportExportService()
    
    def get_default_template(self, report_type, title):
        return f"""
        {{% load report_tags %}}
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            <style>
                @page {{ 
                    size: A4; 
                    margin: 2cm; 
                    @bottom-right {{
                        content: "Page " counter(page) " of " counter(pages);
                        font-size: 8pt;
                        color: #666;
                    }}
                    @bottom-left {{
                        content: "USC Patient Information System | Confidential";
                        font-size: 8pt;
                        color: #666;
                    }}
                }}
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.5; color: #2c3e50; font-size: 10pt; }}
                
                .usc-header {{ 
                    text-align: center; 
                    border-bottom: 2px solid #0B4F6C; 
                    margin-bottom: 30px; 
                    padding-bottom: 10px; 
                }}
                .usc-logo-text {{ font-size: 18pt; font-weight: bold; color: #0B4F6C; margin: 0; text-transform: uppercase; }}
                .usc-sub-text {{ font-size: 10pt; color: #7f8c8d; margin: 5px 0 0 0; }}
                
                .report-title {{ text-align: center; font-size: 16pt; color: #2c3e50; margin-bottom: 20px; text-transform: uppercase; }}

                .section {{ margin-bottom: 30px; page-break-inside: avoid; }}
                .section-title {{ 
                    background-color: #f0f4f8; 
                    color: #0B4F6C; 
                    font-size: 12pt; 
                    font-weight: bold; 
                    padding: 10px; 
                    border-left: 6px solid #0B4F6C; 
                    margin-bottom: 15px; 
                }}
                
                .chart-container {{ text-align: center; margin: 20px 0; }}
                
                .data-table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                .data-table th {{ background-color: #0B4F6C; color: white; padding: 10px 8px; text-align: left; font-size: 9pt; }}
                .data-table td {{ padding: 8px; border-bottom: 1px solid #ecf0f1; font-size: 9pt; }}
                .data-table tr:nth-child(even) {{ background-color: #f9fbfd; }}
                
                .metric-table {{ width: 100%; margin-bottom: 20px; border-spacing: 10px; border-collapse: separate; }}
                .metric-box {{ background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; text-align: center; border-radius: 4px; width: 25%; }}
                .metric-val {{ font-size: 18pt; font-weight: bold; color: #0B4F6C; display: block; }}
                .metric-lbl {{ font-size: 7.5pt; color: #6c757d; text-transform: uppercase; font-weight: 600; margin-top: 5px; display: block; }}
                
                .footer-sign {{ margin-top: 50px; text-align: right; font-size: 9pt; }}
                .signature-line {{ border-top: 1px solid #2c3e50; width: 250px; display: inline-block; margin-top: 40px; }}
            </style>
        </head>
        <body>
            <div class="usc-header">
                <p class="usc-logo-text">University of San Carlos</p>
                <p class="usc-sub-text">Health Services Department - Patient Information System</p>
            </div>
            
            <div class="report-title">{title}</div>

            {{% if visual_charts or charts_base64 %}}
            <div class="section">
                <div class="section-title">Visual Data Analysis</div>
                {{% for chart_url in visual_charts %}}
                <div class="chart-container"><img src="{{{{ chart_url }}}}" width="450" /></div>
                {{% endfor %}}
                {{% for chart_b64 in charts_base64 %}}
                <div class="chart-container"><img src="{{{{ chart_b64 }}}}" width="450" /></div>
                {{% endfor %}}
            </div>
            {{% endif %}}

            <div class="section">
                <div class="section-title">Summary Metrics</div>
                <table class="metric-table">
                    <tr>
                    {{% for k, v in report_data.items %}}
                        {{% if v|is_simple and k not in "report_title,date_range_start,date_range_end,generated_at,system_name,report_type,visual_charts,charts_base64" %}}
                            <td class="metric-box">
                                <span class="metric-val">{{{{ v }}}}</span>
                                <span class="metric-lbl">{{{{ k|title_clean }}}}</span>
                            </td>
                            {{% if forloop.counter|divisibleby:4 %}} </tr><tr> {{% endif %}}
                        {{% endif %}}
                    {{% endfor %}}
                    </tr>
                </table>
            </div>

            {{% for k, v in report_data.items %}}
                {{% if v|is_list and v|has_data and k not in "visual_charts,charts_base64,visual_analytics" %}}
                <div class="section">
                    <div class="section-title">{{{{ k|title_clean }}}} Detail</div>
                    <table class="data-table">
                        {{% with first_item=v|first %}}
                            {{% if first_item|is_dict %}}
                                <thead>
                                    <tr>
                                        {{% for key in first_item.keys %}}
                                            <th>{{{{ key|title_clean }}}}</th>
                                        {{% endfor %}}
                                    </tr>
                                </thead>
                                <tbody>
                                    {{% for item in v %}}
                                        <tr>
                                            {{% for val in item.values %}}
                                                <td>{{{{ val }}}}</td>
                                            {{% endfor %}}
                                        </tr>
                                    {{% endfor %}}
                                </tbody>
                            {{% else %}}
                                <tbody>
                                    {{% for item in v %}}
                                        <tr><td>{{{{ item }}}}</td></tr>
                                    {{% endfor %}}
                                </tbody>
                            {{% endif %}}
                        {{% endwith %}}
                    </table>
                </div>
                {{% endif %}}
            {{% endfor %}}

            <div class="footer-sign">
                <div class="signature-line"></div>
                <p><strong>AUTHORIZED CLINIC PERSONNEL</strong></p>
                <p>University of San Carlos Health Services</p>
            </div>
        </body>
        </html>"""

    def _generate_chart_url(self, chart_type, labels, data, label="Metric"):
        """Generate a QuickChart.io URL for embedding charts in reports"""
        import json
        import urllib.parse
        
        # Limit labels and data for readability
        labels = labels[:12]
        data = data[:12]
        
        chart_config = {
            'type': chart_type,
            'data': {
                'labels': labels,
                'datasets': [{
                    'label': label,
                    'data': data,
                    'backgroundColor': [
                        'rgba(11, 79, 108, 0.7)', 'rgba(2, 136, 209, 0.7)',
                        'rgba(46, 125, 50, 0.7)', 'rgba(230, 74, 25, 0.7)',
                        'rgba(123, 31, 162, 0.7)', 'rgba(0, 121, 107, 0.7)'
                    ]
                }]
            },
            'options': {
                'title': { 'display': True, 'text': label },
                'legend': { 'display': chart_type in ['pie', 'doughnut'] }
            }
        }
        
        config_str = json.dumps(chart_config)
        encoded_config = urllib.parse.quote(config_str)
        return f"https://quickchart.io/chart?c={encoded_config}&w=500&h=300"

    def collect_report_data(self, report_type, title, date_start=None, date_end=None, filters=None, **kwargs):
        """Standardized data collection for any report type"""
        rtype = str(report_type or '').strip().upper()
        
        # Standardize dates
        date_start = date_start or kwargs.get('date_range_start') or (timezone.now() - timedelta(days=365))
        date_end = date_end or kwargs.get('date_range_end') or timezone.now()

        try:
            if rtype == 'PATIENT_SUMMARY': 
                data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
                report_title = title or "Patient Summary Report"
            elif rtype == 'VISIT_TRENDS': 
                data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
                report_title = title or "Monthly Visit Trends"
            elif rtype in ['FEEDBACK_ANALYSIS', 'PATIENT_FEEDBACK']: 
                data = self.data_service.get_feedback_analysis_data(date_start, date_end, filters)
                report_title = title or "Patient Feedback Analysis"
            elif rtype in ['CAMPAIGN_PERFORMANCE', 'HEALTH_CAMPAIGN']: 
                data = self.data_service.get_campaign_performance_data(date_start, date_end, filters)
                report_title = title or "Health Campaign Performance"
            elif rtype in ['MEDICAL_STATISTICS', 'MEDICAL_STATS']: 
                data = self.data_service.get_medical_statistics_data(date_start, date_end, filters)
                report_title = title or "Medical Statistics Dashboard"
            elif rtype in ['DENTAL_STATISTICS', 'DENTAL_STATS']: 
                data = self.data_service.get_dental_statistics_data(date_start, date_end, filters)
                report_title = title or "Dental Health Statistics"
            elif rtype in ['TREATMENT_OUTCOMES', 'TREATMENT_OUTCOME']: 
                data = self.data_service.get_treatment_outcomes_data(date_start, date_end, filters)
                report_title = title or "Treatment Outcomes Analysis"
            elif rtype == 'USER_ACTIVITY': 
                data = self.data_service.get_user_activity_data(date_start, date_end, filters)
                report_title = title or "System Activity Report"
            elif rtype == 'HEALTH_METRICS':
                data = self.data_service.get_health_metrics_data(date_start, date_end, filters)
                report_title = title or "Health Metrics Report"
            else: 
                logger.warning(f"Unknown report type '{rtype}', using comprehensive analytics fallback")
                data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
                report_title = title or "Comprehensive Analytics"
            
            if not isinstance(data, dict): data = {'error': 'Invalid data format', 'report_type': rtype}
            
            # Enrich with Charts
            charts = []
            if rtype == 'PATIENT_SUMMARY' and data.get('course_distribution'):
                dist = data['course_distribution']
                charts.append(self._generate_chart_url('bar', 
                    [d.get('course', 'N/A') for d in dist[:10]], 
                    [d.get('count', 0) for d in dist[:10]],
                    "Patient Enrollment by Course"))
            elif rtype == 'VISIT_TRENDS' and data.get('monthly_summary'):
                charts.append(self._generate_chart_url('line', 
                    [m['month'] for m in data['monthly_summary']], 
                    [m['total_visits'] for m in data['monthly_summary']],
                    "Total Visits by Month"))
            elif rtype == 'CAMPAIGN_PERFORMANCE' and data.get('campaign_performance'):
                perf = data['campaign_performance']
                if isinstance(perf, dict): perf = [v for k,v in perf.items()] # handle grouped
                if isinstance(perf, list) and len(perf) > 0 and isinstance(perf[0], list): perf = [item for sublist in perf for item in sublist]
                charts.append(self._generate_chart_url('bar', 
                    [c.get('title', 'N/A') for c in perf[:10]], 
                    [c.get('views', 0) for c in perf[:10]],
                    "Top 10 Campaigns by Views"))
            elif rtype == 'FEEDBACK_ANALYSIS' and data.get('rating_distribution'):
                dist = data['rating_distribution']
                charts.append(self._generate_chart_url('pie', 
                    [d.get('category', 'N/A') for d in dist], 
                    [d.get('count', 0) for d in dist],
                    "Patient Satisfaction Distribution"))
            elif rtype == 'MEDICAL_STATISTICS' and data.get('top_diagnoses'):
                diag = data['top_diagnoses']
                charts.append(self._generate_chart_url('bar', 
                    [d.get('name', 'N/A') for d in diag[:10]], 
                    [d.get('count', d.get('total', 0)) for d in diag[:10]],
                    "Top Diagnoses Distribution"))
            elif rtype == 'DENTAL_STATISTICS' and data.get('common_procedures'):
                proc = data['common_procedures']
                charts.append(self._generate_chart_url('bar', 
                    [p.get('name', 'N/A') for p in proc[:10]], 
                    [p.get('count', 0) for p in proc[:10]],
                    "Common Dental Procedures"))
            elif rtype == 'TREATMENT_OUTCOMES' and data.get('top_diagnoses'):
                outcomes = data['top_diagnoses']
                charts.append(self._generate_chart_url('bar', 
                    [o.get('diagnosis', 'N/A') for o in outcomes[:10]], 
                    [o.get('count', 0) for o in outcomes[:10]],
                    "Treatment Outcomes by Diagnosis"))
            elif rtype == 'USER_ACTIVITY' and data.get('system_log'):
                log = data['system_log']
                # Group by role for a pie chart
                roles = {}
                for entry in log:
                    r = entry.get('role', 'Unknown')
                    roles[r] = roles.get(r, 0) + 1
                charts.append(self._generate_chart_url('pie', 
                    list(roles.keys()), list(roles.values()),
                    "System Activity by User Role"))

            # Standardize Metadata
            data.update({
                'report_title': report_title,
                'date_range_start': data.get('date_range_start', date_start),
                'date_range_end': data.get('date_range_end', date_end),
                'generated_at': data.get('generated_at', timezone.now()),
                'system_name': "USC Patient Information System",
                'report_type': rtype,
                'visual_charts': charts
            })
            return data

        except Exception as e:
            logger.error(f"Data collection failure: {str(e)}")
            return {'error': str(e), 'report_title': title or "Report Failure"}

    def _generate_generic_report(self, report_type, title, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None, **kwargs):
        # 1. Collect Data
        data = self.collect_report_data(report_type, title, date_start, date_end, filters)
        report_title = data.get('report_title', title)
        rtype = data.get('report_type', report_type)

        # 2. Smart Template Selection
        is_dummy = template_html and "Comprehensive Analytics" in template_html and rtype != 'COMPREHENSIVE_ANALYTICS'
        if not template_html or len(str(template_html)) < 150 or is_dummy:
            final_tpl = self.get_default_template(rtype, report_title)
        else:
            final_tpl = template_html

        # 3. Export Dispatch
        user = kwargs.get('user')
        if export_format == 'PDF': return self.export_service.export_to_pdf(data, final_tpl, report_title, user=user)
        if export_format == 'HTML': return self.export_service.export_to_html(data, final_tpl, report_title, extra_context={'user': user})
        if export_format == 'EXCEL': return self.export_service.export_to_excel(data, report_title)
        if export_format == 'CSV': return self.export_service.export_to_csv(data, report_title)
        return self.export_service.export_to_json(data, report_title)

    def generate_patient_summary_report(self, **kwargs): return self._generate_generic_report('PATIENT_SUMMARY', "Patient Summary", **kwargs)
    def generate_visit_trends_report(self, **kwargs): return self._generate_generic_report('VISIT_TRENDS', "Visit Trends", **kwargs)
    def generate_treatment_outcomes_report(self, **kwargs): return self._generate_generic_report('TREATMENT_OUTCOMES', "Treatment Outcomes", **kwargs)
    def generate_feedback_analysis_report(self, **kwargs): return self._generate_generic_report('FEEDBACK_ANALYSIS', "Feedback Analysis", **kwargs)
    def generate_comprehensive_analytics_report(self, **kwargs): return self._generate_generic_report('COMPREHENSIVE_ANALYTICS', "Comprehensive Analytics", **kwargs)
    def generate_medical_statistics_report(self, **kwargs): return self._generate_generic_report('MEDICAL_STATISTICS', "Medical Statistics", **kwargs)
    def generate_dental_statistics_report(self, **kwargs): return self._generate_generic_report('DENTAL_STATISTICS', "Dental Statistics", **kwargs)
    def generate_campaign_performance_report(self, **kwargs): return self._generate_generic_report('CAMPAIGN_PERFORMANCE', "Campaign Performance", **kwargs)
    def generate_user_activity_report(self, **kwargs): return self._generate_generic_report('USER_ACTIVITY', "User Activity", **kwargs)
    def generate_health_metrics_report(self, **kwargs): return self._generate_generic_report('HEALTH_METRICS', "Health Metrics", **kwargs)

class ReportSchemaService:
    """Service for providing configuration schemas for customizable reports"""
    
    @staticmethod
    def get_schema(report_type):
        schemas = {
            'CAMPAIGN_PERFORMANCE': {
                'filters': [
                    {'id': 'campaign_ids', 'label': 'Specific Campaigns', 'type': 'api_multiselect', 'endpoint': '/api/health-info/campaigns/'},
                    {'id': 'category', 'label': 'Campaign Category', 'type': 'select', 'options': [
                        {'label': 'Awareness', 'value': 'AWARENESS'},
                        {'label': 'Screening', 'value': 'SCREENING'},
                        {'label': 'Vaccination', 'value': 'VACCINATION'},
                        {'label': 'Workshop', 'value': 'WORKSHOP'}
                    ]}
                ],
                'fields': [
                    {'id': 'title', 'label': 'Campaign Title', 'default': True},
                    {'id': 'views', 'label': 'Total Views', 'default': True},
                    {'id': 'type', 'label': 'Type', 'default': True},
                    {'id': 'priority', 'label': 'Priority', 'default': True},
                    {'id': 'performance', 'label': 'Performance', 'default': False}
                ],
                'groupable_by': ['type', 'priority']
            },
            'PATIENT_SUMMARY': {
                'filters': [
                    {'id': 'patient_id', 'label': 'Select Student/Patient', 'type': 'api_select', 'endpoint': '/api/patients/'},
                    {'id': 'school', 'label': 'School/College', 'type': 'text'},
                    {'id': 'course', 'label': 'Course/Program', 'type': 'text'},
                    {'id': 'year_level', 'label': 'Year Level', 'type': 'select', 'options': [
                        {'label': '1st Year', 'value': '1'},
                        {'label': '2nd Year', 'value': '2'},
                        {'label': '3rd Year', 'value': '3'},
                        {'label': '4th Year', 'value': '4'},
                        {'label': '5th Year', 'value': '5'}
                    ]}
                ],
                'fields': [
                    {'id': 'visit_date', 'label': 'Visit Date', 'default': True},
                    {'id': 'diagnosis', 'label': 'Diagnosis', 'default': True},
                    {'id': 'treatment', 'label': 'Treatment', 'default': True},
                    {'id': 'notes', 'label': 'Clinical Notes', 'default': False},
                    {'id': 'course', 'label': 'Course', 'default': True},
                    {'id': 'school', 'label': 'School', 'default': True},
                    {'id': 'year_level', 'label': 'Year Level', 'default': True}
                ],
                'groupable_by': ['course', 'school', 'year_level']
            },
            'VISIT_TRENDS': {
                'filters': [
                    {'id': 'department', 'label': 'Department', 'type': 'select', 'options': [
                        {'label': 'Medical', 'value': 'MEDICAL'},
                        {'label': 'Dental', 'value': 'DENTAL'}
                    ]}
                ],
                'fields': [
                    {'id': 'month', 'label': 'Month', 'default': True},
                    {'id': 'visit_count', 'label': 'Visit Count', 'default': True},
                    {'id': 'patient_count', 'label': 'Unique Patients', 'default': True}
                ],
                'groupable_by': ['month']
            },
            'MEDICAL_STATISTICS': {
                'filters': [
                    {'id': 'diagnosis_category', 'label': 'Diagnosis Category', 'type': 'text'}
                ],
                'fields': [
                    {'id': 'diagnosis', 'label': 'Diagnosis', 'default': True},
                    {'id': 'count', 'label': 'Case Count', 'default': True},
                    {'id': 'percentage', 'label': 'Percentage', 'default': True}
                ],
                'groupable_by': ['diagnosis']
            },
            'DENTAL_STATISTICS': {
                'filters': [],
                'fields': [
                    {'id': 'procedure', 'label': 'Procedure', 'default': True},
                    {'id': 'count', 'label': 'Case Count', 'default': True},
                    {'id': 'percentage', 'label': 'Percentage', 'default': True}
                ],
                'groupable_by': ['procedure']
            },
            'FEEDBACK_ANALYSIS': {
                'filters': [
                    {'id': 'rating', 'label': 'Minimum Rating', 'type': 'slider', 'min': 1, 'max': 5, 'step': 1},
                    {'id': 'visit_type', 'label': 'Visit Type', 'type': 'select', 'options': [
                        {'label': 'Medical', 'value': 'MEDICAL'},
                        {'label': 'Dental', 'value': 'DENTAL'}
                    ]}
                ],
                'fields': [
                    {'id': 'category', 'label': 'Category', 'default': True},
                    {'id': 'avg_rating', 'label': 'Average Rating', 'default': True},
                    {'id': 'response_count', 'label': 'Total Responses', 'default': True}
                ],
                'groupable_by': ['category']
            },
            'USER_ACTIVITY': {
                'filters': [
                    {'id': 'user_id', 'label': 'Specific User', 'type': 'api_select', 'endpoint': '/api/auth/users/'}
                ],
                'fields': [
                    {'id': 'user', 'label': 'User', 'default': True},
                    {'id': 'action', 'label': 'Action', 'default': True},
                    {'id': 'timestamp', 'label': 'Timestamp', 'default': True},
                    {'id': 'ip_address', 'label': 'IP Address', 'default': False}
                ],
                'groupable_by': ['user', 'action']
            },
            'TREATMENT_OUTCOMES': {
                'filters': [],
                'fields': [
                    {'id': 'treatment', 'label': 'Treatment', 'default': True},
                    {'id': 'success_rate', 'label': 'Success Rate', 'default': True},
                    {'id': 'avg_recovery_days', 'label': 'Avg. Recovery', 'default': True}
                ],
                'groupable_by': ['treatment']
            },
            'HEALTH_METRICS': {
                'filters': [],
                'fields': [
                    {'id': 'metric_name', 'label': 'Metric Name', 'default': True},
                    {'id': 'value', 'label': 'Value', 'default': True},
                    {'id': 'unit', 'label': 'Unit', 'default': True}
                ],
                'groupable_by': ['metric_name']
            }
        }
        
        # Return specific schema or a basic generic fallback
        return schemas.get(report_type, {
            'filters': [],
            'fields': [
                {'id': 'id', 'label': 'ID', 'default': True},
                {'id': 'name', 'label': 'Name', 'default': True},
                {'id': 'created_at', 'label': 'Date Created', 'default': True}
            ],
            'groupable_by': []
        })
