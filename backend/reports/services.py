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
        """Get visit trends data using Pandas for efficient aggregation"""
        cache_key = ReportDataService._get_cache_key('visit_trends', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # 1. Fetch raw data (Values only for efficiency)
        medical_data = list(MedicalRecord.objects.filter(
            created_at__gte=date_start or (timezone.now() - timedelta(days=365)),
            created_at__lte=date_end or timezone.now()
        ).values('created_at', 'diagnosis'))
        
        dental_data = list(DentalRecord.objects.filter(
            created_at__gte=date_start or (timezone.now() - timedelta(days=365)),
            created_at__lte=date_end or timezone.now()
        ).values('created_at', 'diagnosis'))
        
        # 2. Initialize results
        total_medical = len(medical_data)
        total_dental = len(dental_data)
        total_visits = total_medical + total_dental
        monthly_list = []
        hour_distribution = []
        common_diagnoses = []
        
        # 3. Process with Pandas if data exists
        if total_visits > 0:
            try:
                # Create DataFrames
                df_med = pd.DataFrame(medical_data)
                df_den = pd.DataFrame(dental_data)
                
                # Add type column
                if not df_med.empty: df_med['type'] = 'Medical'
                if not df_den.empty: df_den['type'] = 'Dental'
                
                # Combine
                df = pd.concat([df_med, df_den], ignore_index=True)
                
                # Ensure datetime
                df['created_at'] = pd.to_datetime(df['created_at'])
                
                # --- Monthly Trends ---
                # Resample by month start ('MS')
                monthly_groups = df.groupby([pd.Grouper(key='created_at', freq='MS'), 'type']).size().unstack(fill_value=0)
                
                # Format for output
                for date, row in monthly_groups.iterrows():
                    monthly_list.append({
                        'month': date.strftime('%Y-%m'),
                        'medical_visits': int(row.get('Medical', 0)),
                        'dental_visits': int(row.get('Dental', 0)),
                        'total_visits': int(row.sum())
                    })
                
                # --- Hourly Distribution ---
                df['hour'] = df['created_at'].dt.hour
                hourly_counts = df['hour'].value_counts().sort_index()
                hour_distribution = [{'hour': hour, 'visits': int(count)} for hour, count in hourly_counts.items()]
                
                # --- Common Diagnoses ---
                # Filter out empty/null diagnoses
                if 'diagnosis' in df.columns:
                    diagnosis_counts = df['diagnosis'].dropna().value_counts().head(10)
                    common_diagnoses = [{'diagnosis': name, 'count': int(count)} for name, count in diagnosis_counts.items() if name]
                    
            except Exception as e:
                logger.error(f"Pandas processing error in get_visit_trends_data: {e}")
                # Fallback handled by empty lists above
        
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
        """Get feedback analysis data using Pandas for advanced analytics"""
        cache_key = ReportDataService._get_cache_key('feedback_analysis', date_start, date_end, filters or {})
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # 1. Build QuerySet
        queryset = Feedback.objects.select_related('patient', 'medical_record')
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        if filters:
            if filters.get('rating_min'):
                queryset = queryset.filter(rating__gte=filters['rating_min'])
            if filters.get('rating_max'):
                queryset = queryset.filter(rating__lte=filters['rating_max'])
        
        # 2. Fetch Data
        feedback_data = list(queryset.values(
            'rating', 'recommend', 'courteous', 'created_at', 'medical_record__created_at'
        ))
        
        total_feedback = len(feedback_data)
        
        # Default values
        avg_rating = 0
        rating_distribution = []
        satisfaction_trends = []
        recommendation_rate = 0
        courtesy_rate = 0
        feedback_types = {'general': 0, 'visit_specific': 0}
        response_time_stats = None
        
        # 3. Process with Pandas
        if total_feedback > 0:
            try:
                df = pd.DataFrame(feedback_data)
                df['created_at'] = pd.to_datetime(df['created_at'])
                
                # Basic Stats
                avg_rating = df['rating'].mean()
                
                # Rating Distribution
                rating_counts = df['rating'].value_counts().sort_index()
                # Ensure 1-5 keys exist
                for i in range(1, 6):
                    if i not in rating_counts:
                        rating_counts[i] = 0
                rating_distribution = [{'rating': r, 'count': int(c)} for r, c in rating_counts.sort_index().items()]
                
                # Boolean rates
                recommend_mask = df['recommend'].str.lower() == 'yes'
                courteous_mask = df['courteous'].str.lower() == 'yes'
                recommendation_rate = (recommend_mask.sum() / total_feedback) * 100
                courtesy_rate = (courteous_mask.sum() / total_feedback) * 100
                
                # Feedback Types
                visit_specific_count = df['medical_record__created_at'].notna().sum()
                feedback_types = {
                    'general': int(total_feedback - visit_specific_count),
                    'visit_specific': int(visit_specific_count)
                }
                
                # Monthly Trends
                monthly = df.set_index('created_at').resample('MS')
                trends = monthly.agg({
                    'rating': 'mean',
                    'recommend': lambda x: (x.str.lower() == 'yes').sum(),
                    'courteous': lambda x: (x.str.lower() == 'yes').sum()
                })
                trends['count'] = monthly.size()
                
                for date, row in trends.iterrows():
                    if row['count'] > 0:
                        satisfaction_trends.append({
                            'month': date.strftime('%Y-%m'),
                            'average_rating': round(row['rating'], 1),
                            'feedback_count': int(row['count']),
                            'recommendation_rate': round((row['recommend'] / row['count']) * 100, 1),
                            'courtesy_rate': round((row['courteous'] / row['count']) * 100, 1)
                        })
                
                # Response Time Analysis
                if visit_specific_count > 0:
                    df_visit = df.dropna(subset=['medical_record__created_at']).copy()
                    df_visit['medical_record__created_at'] = pd.to_datetime(df_visit['medical_record__created_at'])
                    
                    # Calculate difference in days
                    response_times = (df_visit['created_at'] - df_visit['medical_record__created_at']).dt.total_seconds() / 86400
                    response_time_stats = {
                        'average_response_days': round(response_times.mean(), 1),
                        'feedback_with_visits': int(visit_specific_count)
                    }
                    
            except Exception as e:
                logger.error(f"Pandas processing error in get_feedback_analysis_data: {e}")
        
        data = {
            'total_feedback': total_feedback,
            'average_rating': round(avg_rating, 1),
            'rating_distribution': rating_distribution,
            'satisfaction_trends': satisfaction_trends,
            'recommendation_rate': round(recommendation_rate, 1),
            'courtesy_rate': round(courtesy_rate, 1),
            'feedback_types': feedback_types,
            'response_time_stats': response_time_stats,
            'satisfaction_score': round((avg_rating / 5) * 100, 1)
        }
        
        # Cache for 15 minutes
        cache.set(cache_key, data, 900)
        return data
        
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
                    
                    # Prepare context - flatten report_data if it's a dict
                    context_data = {
                        'title': title,
                        'generated_at': timezone.now(),
                        'report_data': report_data,
                    }
                    if isinstance(report_data, dict):
                        context_data.update(report_data)
                    
                    tpl = Template(template_content)
                    html = tpl.render(Context(context_data))
                    
                    buffer = BytesIO()
                    pisa_status = pisa.CreatePDF(html, dest=buffer)
                    
                    if not pisa_status.err:
                        return buffer.getvalue()
                    else:
                        logger.error(f"xhtml2pdf error: {pisa_status.err}")
                except (ImportError, Exception) as e:
                    logger.warning(f"xhtml2pdf failed, falling back to ReportLab: {e}")
            
            # 2. Fallback to ReportLab (Programmatic generation)
            try:
                from reportlab.lib.pagesizes import A4
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib import colors
                
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=A4)
                styles = getSampleStyleSheet()
                story = []
                
                # Title
                title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=30, color=colors.hexColor('#0B4F6C'))
                story.append(Paragraph(title, title_style))
                story.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
                story.append(Spacer(1, 20))
                
                # Process report data
                if isinstance(report_data, dict):
                    for key, value in report_data.items():
                        story.append(Paragraph(str(key).replace('_', ' ').title(), styles['Heading2']))
                        if isinstance(value, (list, tuple)) and value:
                            if isinstance(value[0], dict):
                                headers = list(value[0].keys())
                                table_data = [[h.replace('_', ' ').title() for h in headers]]
                                for item in value[:50]:
                                    table_data.append([str(item.get(h, '')) for h in headers])
                                t = Table(table_data, hAlign='LEFT')
                                t.setStyle(TableStyle([
                                    ('BACKGROUND', (0, 0), (-1, 0), colors.hexColor('#0B4F6C')),
                                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                                ]))
                                story.append(t)
                            else:
                                for item in value[:20]: story.append(Paragraph(f"• {str(item)}", styles['Normal']))
                        else:
                            story.append(Paragraph(str(value), styles['Normal']))
                        story.append(Spacer(1, 12))
                
                doc.build(story)
                return buffer.getvalue()
            except (ImportError, Exception) as e:
                logger.error(f"ReportLab fallback failed: {e}")
                # 3. Final Fallback: Simple text-based PDF content
                content = f"USC-PIS REPORT: {title}\nGenerated: {timezone.now()}\n\nDATA:\n{json.dumps(report_data, indent=2, default=str)}"
                return content.encode('utf-8')
                
        except Exception as e:
            logger.error(f"Fatal error in export_to_pdf: {e}")
            return None
    
    @staticmethod
    def export_to_excel(report_data, title="Report"):
        """Export report to Excel using openpyxl for proper .xlsx format"""
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
            from openpyxl.utils import get_column_letter
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Report Data"
            
            # Setup styles
            header_font = Font(name='Arial', bold=True, size=12, color='FFFFFF')
            header_fill = PatternFill(start_color='0B4F6C', end_color='0B4F6C', fill_type='solid')
            subheader_font = Font(name='Arial', bold=True, size=11)
            subheader_fill = PatternFill(start_color='F0F7F9', end_color='F0F7F9', fill_type='solid')
            border = Border(left=Side(style='thin'), right=Side(style='thin'), 
                           top=Side(style='thin'), bottom=Side(style='thin'))
            
            row = 1
            
            # Title
            ws.cell(row=row, column=1, value="UNIVERSITY OF SAN CARLOS - USC-PIS")
            ws.cell(row=row, column=1).font = Font(name='Arial', bold=True, size=14, color='0B4F6C')
            row += 1
            ws.cell(row=row, column=1, value=title)
            ws.cell(row=row, column=1).font = Font(name='Arial', bold=True, size=16)
            row += 1
            
            # Generation date
            ws.cell(row=row, column=1, value="Generated At:")
            ws.cell(row=row, column=2, value=timezone.now().strftime('%Y-%m-%d %H:%M:%S'))
            row += 2
            
            # Process report data
            for key, value in report_data.items():
                label = str(key).replace('_', ' ').title()
                
                if isinstance(value, (int, float, str, bool)) or value is None:
                    # Summary data
                    ws.cell(row=row, column=1, value=label)
                    ws.cell(row=row, column=1).font = subheader_font
                    ws.cell(row=row, column=2, value=str(value) if value is not None else 'N/A')
                    row += 1
                elif isinstance(value, dict):
                    # Section header
                    ws.cell(row=row, column=1, value=label)
                    ws.cell(row=row, column=1).font = subheader_font
                    ws.cell(row=row, column=1).fill = subheader_fill
                    row += 1
                    
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, (int, float, str, bool)):
                            ws.cell(row=row, column=1, value=str(sub_key).replace('_', ' ').title())
                            ws.cell(row=row, column=2, value=str(sub_value))
                            row += 1
                    row += 1
                elif isinstance(value, (list, tuple)) and value:
                    # Table data
                    ws.cell(row=row, column=1, value=label)
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
                        for item in value[:200]:  # Limit rows
                            for col, header in enumerate(headers, 1):
                                val = item.get(header, '')
                                # Flatten nested dicts/lists in cells
                                if isinstance(val, (dict, list)): val = json.dumps(val)
                                cell = ws.cell(row=row, column=col, value=str(val))
                                cell.border = border
                            row += 1
                    else:
                        # Simple list
                        for item in value[:100]:
                            ws.cell(row=row, column=1, value=str(item))
                            row += 1
                    
                    row += 1  # Empty row
            
            # Auto-adjust column widths
            for col in range(1, ws.max_column + 1):
                column = get_column_letter(col)
                ws.column_dimensions[column].width = 20
            
            buffer = BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            return buffer.getvalue()
            
        except ImportError:
            logger.warning("openpyxl not available, falling back to CSV")
            return ReportExportService.export_to_csv(report_data, title)
        except Exception as e:
            logger.error(f"Excel export failed: {e}")
            return None
        
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
    
    def get_default_template(self, report_type, title):
        """Provide a fallback HTML template if one is missing from the database"""
        return f"""
        {{% load report_tags %}}
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{title}</title>
            <style>
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 40px; }}
                .usc-header {{ text-align: center; border-bottom: 2px solid #0B4F6C; padding-bottom: 20px; margin-bottom: 30px; }}
                .usc-logo {{ color: #0B4F6C; font-size: 20px; font-weight: bold; margin-bottom: 5px; }}
                .usc-title {{ color: #246A73; font-size: 28px; margin: 10px 0; }}
                .meta-info {{ color: #666; font-size: 12px; margin-bottom: 30px; }}
                .section {{ margin-bottom: 30px; page-break-inside: avoid; }}
                .section-title {{ color: #0B4F6C; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #e0e0e0; padding: 10px; text-align: left; font-size: 13px; }}
                th {{ background-color: #f8f9fa; font-weight: bold; color: #0B4F6C; }}
                .metric-box {{ background: #f0f7f9; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: inline-block; min-width: 200px; border: 1px solid #d0e4ea; }}
                .metric-label {{ font-size: 12px; color: #5a8a92; text-transform: uppercase; letter-spacing: 1px; }}
                .metric-value {{ font-size: 24px; font-weight: bold; color: #0B4F6C; }}
                .footer {{ text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="usc-header">
                <div class="usc-logo">UNIVERSITY OF SAN CARLOS</div>
                <div class="usc-logo">Health Services Clinic</div>
                <h1 class="usc-title">{title}</h1>
                <div class="meta-info">Generated on: {{{{ generated_at|date:"F d, Y H:i" }}}}</div>
            </div>

            <div class="section">
                <div class="section-title">Summary Metrics</div>
                {{% for key, value in report_data.items %}}
                    {{% if value|is_simple %}}
                        <div class="metric-box">
                            <div class="metric-label">{{{{ key|title_clean }}}}</div>
                            <div class="metric-value">{{{{ value }}}}</div>
                        </div>
                    {{% endif %}}
                {{% endfor %}}
            </div>

            {{% for key, value in report_data.items %}}
                {{% if value|is_list %}}
                    <div class="section">
                        <div class="section-title">{{{{ key|title_clean }}}}</div>
                        {{% if value.0|is_dict %}}
                            <table>
                                <thead>
                                    <tr>
                                        {{% for header in value.0.keys %}}
                                            <th>{{{{ header|title_clean }}}}</th>
                                        {{% endfor %}}
                                    </tr>
                                </thead>
                                <tbody>
                                    {{% for row in value|slice:":50" %}}
                                        <tr>
                                            {{% for val in row.values %}}
                                                <td>{{{{ val }}}}</td>
                                            {{% endfor %}}
                                        </tr>
                                    {{% endfor %}}
                                </tbody>
                            </table>
                        {{% else %}}
                            <ul>
                                {{% for item in value|slice:":20" %}}
                                    <li>{{{{ item }}}}</li>
                                {{% endfor %}}
                            </ul>
                        {{% endif %}}
                    </div>
                {{% endif %}}
            {{% endfor %}}

            <div class="footer">
                <p>USC-PIS Automated Reporting System • Confidential Medical Record</p>
                <p>&copy; {{{{ generated_at|date:"Y" }}}} University of San Carlos Health Services. All Rights Reserved.</p>
            </div>
        </body>
        </html>
        """

    def _generate_generic_report(self, report_type, title, date_start, date_end, filters, export_format, template_html):
        """Helper to generate any report type with consistent format handling"""
        # Use template from DB or fall back to default USC template
        final_template = template_html or self.get_default_template(report_type, title)
        
        # 1. Get Data
        if report_type == 'PATIENT_SUMMARY':
            data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
        elif report_type == 'VISIT_TRENDS':
            data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        elif report_type == 'TREATMENT_OUTCOMES':
            data = self.data_service.get_treatment_outcomes_data(date_start, date_end, filters)
        elif report_type == 'FEEDBACK_ANALYSIS':
            data = self.data_service.get_feedback_analysis_data(date_start, date_end, filters)
        elif report_type == 'COMPREHENSIVE_ANALYTICS':
            data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
        elif report_type == 'MEDICAL_STATISTICS':
            p_data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
            v_data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
            data = {**p_data, **v_data}
        elif report_type == 'DENTAL_STATISTICS':
            data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        elif report_type == 'CAMPAIGN_PERFORMANCE':
            c_data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
            data = {
                'campaign_overview': c_data.get('overview', {}),
                'user_engagement': c_data.get('user_activity', []),
                'health_metrics': c_data.get('health_metrics', {}),
                'system_efficiency': c_data.get('efficiency_metrics', {})
            }
        else:
            data = {}

        # 2. Export based on format
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, final_template, title)
        elif export_format == 'HTML':
            return self.export_service.export_to_html(
                data, final_template, title, 
                extra_context={'date_range_start': date_start, 'date_range_end': date_end, 'filters': filters or {}}
            )
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, title)
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, title)
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, title)
        
        return None

    def generate_patient_summary_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('PATIENT_SUMMARY', "Patient Summary Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_visit_trends_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('VISIT_TRENDS', "Visit Trends Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_treatment_outcomes_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('TREATMENT_OUTCOMES', "Treatment Outcomes Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_feedback_analysis_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('FEEDBACK_ANALYSIS', "Feedback Analysis Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_comprehensive_analytics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('COMPREHENSIVE_ANALYTICS', "Comprehensive Analytics Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_medical_statistics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('MEDICAL_STATISTICS', "Medical Statistics Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_dental_statistics_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('DENTAL_STATISTICS', "Dental Statistics Report", date_start, date_end, filters, export_format, template_html)
    
    def generate_campaign_performance_report(self, date_start=None, date_end=None, filters=None, export_format='PDF', template_html=None):
        return self._generate_generic_report('CAMPAIGN_PERFORMANCE', "Campaign Performance Report", date_start, date_end, filters, export_format, template_html)
    
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
