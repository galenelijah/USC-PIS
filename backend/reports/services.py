import os
import json
import csv
import pandas as pd
import logging
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q, F, Case, When, IntegerField, FloatField, Value, Max
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
from utils.usc_mappings import PROGRAMS_CHOICES

logger = logging.getLogger(__name__)

ACADEMIC_DIRECTORY_MAP = {
    '1': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '2': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '3': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '4': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '5': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '56': {'campus': 'Talamban Campus (TC)', 'school': 'School of Architecture, Fine Arts and Design (SAFAD)'},
    '6': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '7': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '8': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '9': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '10': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '11': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '12': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '13': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '14': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '15': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '16': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '17': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '18': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '19': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '46': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '49': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '50': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '51': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '57': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '58': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '59': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '62': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '63': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '65': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '67': {'campus': 'Talamban Campus (TC)', 'school': 'School of Arts and Sciences (SAS)'},
    '38': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '39': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '40': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '41': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '42': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '43': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '44': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '45': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '66': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '68': {'campus': 'Talamban Campus (TC)', 'school': 'School of Engineering (SOE)'},
    '36': {'campus': 'Talamban Campus (TC)', 'school': 'School of Education (SOED)'},
    '37': {'campus': 'Talamban Campus (TC)', 'school': 'School of Education (SOED)'},
    '48': {'campus': 'Talamban Campus (TC)', 'school': 'School of Education (SOED)'},
    '52': {'campus': 'Talamban Campus (TC)', 'school': 'School of Education (SOED)'},
    '61': {'campus': 'Talamban Campus (TC)', 'school': 'School of Education (SOED)'},
    '20': {'campus': 'Talamban Campus (TC)', 'school': 'School of Healthcare Professions (SHCP)'},
    '21': {'campus': 'Talamban Campus (TC)', 'school': 'School of Healthcare Professions (SHCP)'},
    '22': {'campus': 'Talamban Campus (TC)', 'school': 'School of Healthcare Professions (SHCP)'},
    '25': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '26': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '27': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '28': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '29': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '30': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '31': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '32': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '33': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '34': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '35': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '47': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '54': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '55': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '60': {'campus': 'Downtown Campus (DC)', 'school': 'School of Business and Economics (SBE)'},
    '23': {'campus': 'Downtown Campus (DC)', 'school': 'School of Law and Governance (SLG)'},
    '24': {'campus': 'Downtown Campus (DC)', 'school': 'School of Law and Governance (SLG)'},
    '53': {'campus': 'Downtown Campus (DC)', 'school': 'School of Law and Governance (SLG)'},
    '64': {'campus': 'Downtown Campus (DC)', 'school': 'School of Law and Governance (SLG)'}
}
from notifications.models import Notification
from medical_certificates.models import MedicalCertificate
from file_uploads.models import PatientDocument
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
            
            # Use the same high-fidelity distribution methods as comprehensive analytics
            all_active_patients = list(queryset)
            course_distribution = ReportDataService._get_course_distribution(all_active_patients)
            role_distribution = ReportDataService._get_role_distribution(all_active_patients)
            college_participation = ReportDataService._get_college_participation(all_active_patients)

            # Gender distribution
            raw_gender_dist = list(queryset.values('gender').annotate(count=Count('id')).order_by('gender'))
            gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other', '1': 'Male', '2': 'Female'} 
            gender_distribution = []
            for item in raw_gender_dist:
                g_code = item['gender']
                g_name = gender_map.get(g_code, g_code if g_code else 'Unknown')
                gender_distribution.append({'gender': g_name, 'count': item['count']})
            
            # Age distribution
            age_groups_counts = {'0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0}
            try:
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
                        age_groups_counts[row[0]] = row[1]
            except Exception as e:
                logger.error(f"Age distribution calculation failed: {e}")

            # Age Groups List for Charts
            age_distribution = [{'group': k, 'count': v} for k, v in age_groups_counts.items()]

            data = {
                **aggregate_data,
                'gender_distribution': gender_distribution,
                'age_distribution': age_distribution,
                'course_distribution': course_distribution,
                'role_distribution': role_distribution,
                'college_participation': college_participation,
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
    def get_unified_health_history_data(date_start=None, date_end=None, filters=None):
        """Aggregate all health interactions for a patient into a unified timeline"""
        try:
            patient_id = filters.get('patient_id') if filters else None
            if not patient_id:
                return {'error': 'Patient ID is required for unified health history'}
            
            patient = Patient.objects.select_related('user').get(id=patient_id)
            history = []
            
            # 1. Medical Records
            mr_qs = patient.medical_records.all()
            if date_start and date_end:
                mr_qs = mr_qs.filter(visit_date__range=(date_start, date_end))
            for mr in mr_qs.order_by('-visit_date'):
                history.append({
                    'date': mr.visit_date,
                    'type': 'MEDICAL',
                    'title': 'Medical Consultation',
                    'primary_info': mr.diagnosis or mr.concern or 'General Consultation',
                    'secondary_info': f"Treatment: {mr.treatment}" if mr.treatment else "",
                    'meta': mr.vital_signs
                })
                
            # 2. Dental Records
            dr_qs = patient.dental_records.all()
            if date_start and date_end:
                dr_qs = dr_qs.filter(visit_date__range=(date_start, date_end))
            for dr in dr_qs.order_by('-visit_date'):
                history.append({
                    'date': dr.visit_date,
                    'type': 'DENTAL',
                    'title': 'Dental Consultation',
                    'primary_info': dr.diagnosis or dr.concern or 'Dental Consultation',
                    'secondary_info': f"Procedure: {dr.get_procedure_performed_display()}",
                    'meta': {'teeth': dr.tooth_numbers, 'referral': dr.referral_to}
                })
                
            # 3. Medical Certificates
            mc_qs = MedicalCertificate.objects.filter(patient=patient)
            if date_start and date_end:
                mc_qs = mc_qs.filter(created_at__range=(date_start, date_end))
            for mc in mc_qs.order_by('-created_at'):
                history.append({
                    'date': mc.created_at.date(),
                    'type': 'CERTIFICATE',
                    'title': f"Medical Certificate: {mc.template.name}",
                    'primary_info': f"Status: {mc.get_fitness_status_display()}",
                    'secondary_info': f"Reason: {mc.fitness_reason}" if mc.fitness_reason else mc.diagnosis,
                    'meta': {'valid_until': mc.valid_until}
                })
                
            # 4. Patient Documents
            doc_qs = PatientDocument.objects.filter(patient=patient)
            if date_start and date_end:
                doc_qs = doc_qs.filter(uploaded_at__range=(date_start, date_end))
            for doc in doc_qs.order_by('-uploaded_at'):
                history.append({
                    'date': doc.uploaded_at.date(),
                    'type': 'DOCUMENT',
                    'title': doc.get_document_type_display(),
                    'primary_info': doc.original_filename,
                    'secondary_info': doc.description or "",
                    'meta': {'file_size': doc.file_size, 'ext': os.path.splitext(doc.file.name)[1]}
                })

            # Sort unified history chronologically descending
            history.sort(key=lambda x: x['date'], reverse=True)
            
            # Format dates for JSON serializability
            for item in history:
                if isinstance(item['date'], (datetime, timezone.datetime)):
                    item['date'] = item['date'].strftime('%Y-%m-%d %H:%M')
                else:
                    item['date'] = str(item['date'])

            return {
                'patient_name': patient.first_name + " " + patient.last_name,
                'usc_id': getattr(patient.user, 'usc_id', 'N/A'),
                'history': history,
                'total_interactions': len(history),
                'breakdown': {
                    'medical': mr_qs.count(),
                    'dental': dr_qs.count(),
                    'certificates': mc_qs.count(),
                    'documents': doc_qs.count()
                }
            }
        except Exception as e:
            logger.error(f"Error in get_unified_health_history_data: {str(e)}")
            return {'error': str(e)}

    @staticmethod
    def get_visit_trends_data(date_start=None, date_end=None, filters=None):
        """Get visit trends data with dynamic granularity and gap filling"""
        try:
            filters = filters or {}
            now = timezone.now()
            date_start = date_start or (now - timedelta(days=365))
            date_end = date_end or now
            
            # Ensure they are aware of the full day and normalized to midnight for proper binning
            if hasattr(date_start, 'replace'):
                date_start = date_start.replace(hour=0, minute=0, second=0, microsecond=0)
            if hasattr(date_end, 'replace'):
                date_end = date_end.replace(hour=23, minute=59, second=59, microsecond=999999)

            medical_records = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            dental_records = DentalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            # ... (filtering logic)
            if filters:
                # (Existing filtering logic remains the same)
                if filters.get('gender'):
                    medical_records = medical_records.filter(patient__gender=filters['gender'])
                    dental_records = dental_records.filter(patient__gender=filters['gender'])
                if filters.get('role'):
                    roles = filters['role'].split(',')
                    medical_records = medical_records.filter(patient__user__role__in=roles)
                    dental_records = dental_records.filter(patient__user__role__in=roles)

                if filters.get('campus'):
                    campus_names = filters['campus'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(c in info['campus'] for c in campus_names)]
                    medical_records = medical_records.filter(patient__user__course__in=course_ids)
                    dental_records = dental_records.filter(patient__user__course__in=course_ids)
                
                if filters.get('school'):
                    school_names = filters['school'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(s in info['school'] for s in school_names)]
                    medical_records = medical_records.filter(patient__user__course__in=course_ids)
                    dental_records = dental_records.filter(patient__user__course__in=course_ids)
                
                if filters.get('course'):
                    course_list = filters['course'].split(',')
                    medical_records = medical_records.filter(patient__user__course__in=course_list)
                    dental_records = dental_records.filter(patient__user__course__in=course_list)

                if filters.get('year_level'):
                    level_list = filters['year_level'].split(',')
                    medical_records = medical_records.filter(patient__user__year_level__in=level_list)
                    dental_records = dental_records.filter(patient__user__year_level__in=level_list)
                
                if filters.get('service_type') == 'medical':
                    dental_records = dental_records.none()
                elif filters.get('service_type') == 'dental':
                    medical_records = medical_records.none()

            total_medical = medical_records.count()
            total_dental = dental_records.count()
            total_visits = total_medical + total_dental
            
            m_data = [{'date': r.visit_date, 'type': 'medical'} for r in medical_records]
            d_data = [{'date': r.visit_date, 'type': 'dental'} for r in dental_records]
            
            days_diff = (date_end - date_start).days
            
            # Determine granularity and anchors
            if days_diff <= 45:
                freq = 'D'
                date_format = '%b %d'
                # Already normalized to midnight
            elif days_diff <= 185:
                freq = 'W-MON'
                date_format = 'Week %U (%b)'
                # Anchor to Monday
                date_start = date_start - timedelta(days=date_start.weekday())
            else:
                freq = 'MS'
                date_format = '%b %Y'
                # Anchor to first of month
                date_start = date_start.replace(day=1)

            monthly_summary = []
            
            # Create a full date range to ensure no gaps
            full_range = pd.date_range(start=date_start, end=date_end, freq=freq, normalize=True)
            
            if m_data or d_data:
                df = pd.DataFrame(m_data + d_data)
                df['date'] = pd.to_datetime(df['date'])
                
                # Resample and count
                df = df.set_index('date')
                
                # Group by frequency and type
                counts = df.groupby([pd.Grouper(freq=freq), 'type']).size().unstack(fill_value=0)
                
                # Ensure columns exist
                for t in ['medical', 'dental']:
                    if t not in counts.columns:
                        counts[t] = 0
                
                # Reindex with full range to fill missing periods with 0
                counts = counts.reindex(full_range, fill_value=0)
                
                counts['total'] = counts['medical'] + counts['dental']
                
                # Calculate growth
                counts['growth'] = counts['total'].pct_change(fill_value=0) * 100
                counts = counts.fillna(0)
                
                for timestamp, row in counts.iterrows():
                    monthly_summary.append({
                        'month': timestamp.strftime(date_format), 
                        'total_visits': int(row['total']),
                        'medical_visits': int(row.get('medical', 0)), 
                        'dental_visits': int(row.get('dental', 0)),
                        'growth_percentage': f"{float(row.get('growth', 0)):.1f}%"
                    })
            else:
                # Return empty intervals for the entire range
                for timestamp in full_range:
                    monthly_summary.append({
                        'month': timestamp.strftime(date_format),
                        'total_visits': 0,
                        'medical_visits': 0,
                        'dental_visits': 0,
                        'growth_percentage': "0%"
                    })
                
            # Average Daily Calculation
            avg_daily = round(total_visits / max(days_diff, 1), 1)
            peak_day_visits = 0
            if m_data or d_data:
                df_day = pd.DataFrame(m_data + d_data)
                df_day['date'] = pd.to_datetime(df_day['date'])
                df_day['day'] = df_day['date'].dt.date
                peak_day_visits = int(df_day.groupby('day').size().max())
                
            return {
                'total_visits': total_visits, 
                'avg_daily_visits': avg_daily, 
                'peak_day_visits': peak_day_visits,
                'monthly_summary': monthly_summary, 
                'summary_by_type': {'Medical': total_medical, 'Dental': total_dental},
                'granularity': freq
            }
        except Exception as e:
            logger.error(f"Error in get_visit_trends_data: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {'error': str(e), 'total_visits': 0, 'monthly_summary': []}

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
            
            # For operations workshop, calculate peak activity hours based on User.last_login (proxy for activity)
            peak_hours = []
            if users.filter(last_login__isnull=False).exists():
                hour_counts = {}
                for h in range(24): hour_counts[h] = 0
                for u in users.filter(last_login__isnull=False):
                    hour = u.last_login.hour
                    hour_counts[hour] += 1
                peak_hours = [{'hour': h, 'count': c} for h, c in hour_counts.items()]

            return {
                'total_users': users.count(), 
                'active_users_period': users.filter(last_login__gte=date_start or timezone.now()-timedelta(days=30)).count(),
                'system_log': active_users_log,
                'peak_hours': peak_hours
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
            filters = filters or {}
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            feedback_qs = Feedback.objects.filter(created_at__range=(date_start, date_end))

            # Apply filters
            if filters:
                if filters.get('rating'):
                    try:
                        ratings = [int(r) for r in str(filters['rating']).split(',')]
                        feedback_qs = feedback_qs.filter(rating__in=ratings)
                    except ValueError:
                        pass
                
                if filters.get('recommend'):
                    feedback_qs = feedback_qs.filter(recommend=filters['recommend'])
                
                if filters.get('courteous'):
                    feedback_qs = feedback_qs.filter(courteous=filters['courteous'])

                if filters.get('visit_type'):
                    v_type = filters['visit_type'].upper()
                    if v_type == 'MEDICAL':
                        feedback_qs = feedback_qs.filter(medical_record__isnull=False)
                    elif v_type == 'DENTAL':
                        feedback_qs = feedback_qs.filter(dental_record__isnull=False)
            
            total = feedback_qs.count()
            
            # Robust Role Classification
            student_count = 0
            staff_count = 0
            for f in feedback_qs.select_related('patient__user'):
                role = getattr(f.patient.user, 'role', 'STUDENT') if f.patient and f.patient.user else 'STUDENT'
                if role in ['STAFF', 'FACULTY', 'ADMIN']:
                    staff_count += 1
                else:
                    student_count += 1
            
            student_pct = (student_count / total * 100) if total > 0 else 0
            
            # Response rate metrics
            medical_count = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()
            dental_count = DentalRecord.objects.filter(visit_date__range=(date_start, date_end)).count()
            total_visits = medical_count + dental_count
            response_rate = (total / total_visits * 100) if total_visits > 0 else 0

            if total == 0:
                return {
                    'total_responses': 0, 'avg_rating': 0, 'satisfaction_score': 0,
                    'response_rate': 0, 'total_visits': total_visits,
                    'student_count': 0, 'staff_count': 0, 'student_percentage': 0,
                    'rating_distribution': [], 'raw_feedback': [], 'service_metrics': {}
                }
                
            avg = feedback_qs.aggregate(Avg('rating'))['rating__avg'] or 0
            
            # Full raw feedback for the audit table
            raw_feedback = []
            for f in feedback_qs.order_by('-created_at'):
                raw_feedback.append({
                    'id': f.id,
                    'rating': f.rating,
                    'comments': f.comments,
                    'improvement': f.improvement,
                    'recommend': f.recommend,
                    'courteous': f.courteous,
                    'created_at': f.created_at
                })

            # Calculate Yes/No Metrics
            metrics = {
                'recommend_yes': feedback_qs.filter(recommend='yes').count(),
                'recommend_no': feedback_qs.filter(recommend='no').count(),
                'courteous_yes': feedback_qs.filter(courteous='yes').count(),
                'courteous_no': feedback_qs.filter(courteous='no').count(),
            }

            # Star Distribution (Fixed categories)
            dist = []
            for star in range(5, 0, -1):
                count = feedback_qs.filter(rating=star).count()
                dist.append({
                    'category': str(star),
                    'count': count,
                    'percentage': round((count / total * 100), 1)
                })

            return {
                'total_responses': total, 
                'total_visits': total_visits,
                'student_count': student_count,
                'staff_count': staff_count,
                'student_percentage': round(float(student_pct), 1),
                'response_rate': round(float(response_rate), 1),
                'avg_rating': round(float(avg), 1), 
                'satisfaction_score': round(float(avg/5*100), 1),
                'rating_distribution': dist,
                'raw_feedback': raw_feedback,
                'service_metrics': metrics,
                'date_range_start': date_start,
                'date_range_end': date_end
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
            campaign_ids = filters.get('campaign_ids') or filters.get('campaign_id')
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
                    'engagement': getattr(c, 'engagement_count', 0),
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
            
            # Apply filters
            if filters:
                if filters.get('diagnosis_category'):
                    diag_list = filters['diagnosis_category'].split(',')
                    records = records.filter(diagnosis__in=diag_list)
                
                # Campus filter - Map to course IDs
                if filters.get('campus'):
                    campus_names = filters['campus'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(c in info['campus'] for c in campus_names)]
                    records = records.filter(patient__user__course__in=course_ids)
                
                # School filter - Map to course IDs
                if filters.get('school'):
                    school_names = filters['school'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(s in info['school'] for s in school_names)]
                    records = records.filter(patient__user__course__in=course_ids)
                
                if filters.get('course'):
                    course_list = filters['course'].split(',')
                    records = records.filter(patient__user__course__in=course_list)
                if filters.get('year_level'):
                    level_list = filters['year_level'].split(',')
                    records = records.filter(patient__user__year_level__in=level_list)
            
            # Calculate real avg age
            patients = Patient.objects.filter(medical_records__in=records).distinct()
            avg_age = 0
            if patients.exists():
                ages = [p.age for p in patients if p.age is not None]
                avg_age = sum(ages) / len(ages) if ages else 0

            # Vitals Metrics - Safely calculate from JSONField or return empty
            vitals = {
                'avg_weight': 0,
                'avg_height': 0,
                'avg_bmi': 0,
                'max_bp_sys': 0,
                'min_bp_sys': 0
            }
            
            # Manual aggregation for JSON fields (safe for both SQLite and Postgres)
            if records.exists():
                weights = []
                heights = []
                bmis = []
                sys_bps = []
                
                for r in records:
                    if r.vital_signs:
                        vs = r.vital_signs
                        if vs.get('weight'): weights.append(float(vs['weight']))
                        if vs.get('height'): heights.append(float(vs['height']))
                        if vs.get('bmi'): bmis.append(float(vs['bmi']))
                        
                        bp = vs.get('blood_pressure')
                        if bp and '/' in str(bp):
                            try:
                                sys = float(str(bp).split('/')[0])
                                sys_bps.append(sys)
                            except: pass
                
                if weights: vitals['avg_weight'] = sum(weights) / len(weights)
                if heights: vitals['avg_height'] = sum(heights) / len(heights)
                if bmis: vitals['avg_bmi'] = sum(bmis) / len(bmis)
                if sys_bps:
                    vitals['max_bp_sys'] = max(sys_bps)
                    vitals['min_bp_sys'] = min(sys_bps)

            diag = []
            # Group by diagnosis and calculate counts
            diagnosis_groups = records.values('diagnosis').annotate(
                count=Count('id')
            ).order_by('-count')[:15] # Increased to 15 for better coverage

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
            
            # Apply filters
            if filters:
                if filters.get('procedure'):
                    proc_list = filters['procedure'].split(',')
                    records = records.filter(procedure_performed__in=proc_list)
                
                # Campus filter - Map to course IDs
                if filters.get('campus'):
                    campus_names = filters['campus'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(c in info['campus'] for c in campus_names)]
                    records = records.filter(patient__user__course__in=course_ids)
                
                # School filter - Map to course IDs
                if filters.get('school'):
                    school_names = filters['school'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(s in info['school'] for s in school_names)]
                    records = records.filter(patient__user__course__in=course_ids)
                
                if filters.get('course'):
                    course_list = filters['course'].split(',')
                    records = records.filter(patient__user__course__in=course_list)
                if filters.get('year_level'):
                    level_list = filters['year_level'].split(',')
                    records = records.filter(patient__user__year_level__in=level_list)
            
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
        """Helper to aggregate patients by college/school using ACADEMIC_DIRECTORY_MAP"""
        colleges = {}
        for patient in patients:
            college = "Other"
            if patient.user and patient.user.course:
                course_id = str(patient.user.course)
                if course_id in ACADEMIC_DIRECTORY_MAP:
                    school_info = ACADEMIC_DIRECTORY_MAP[course_id]['school']
                    # Use shorter labels for charts (e.g. "SAS" instead of full name)
                    if "Arts and Sciences" in school_info: college = "SAS"
                    elif "Architecture" in school_info: college = "SAFAD"
                    elif "Business" in school_info: college = "SBE"
                    elif "Engineering" in school_info: college = "SOE"
                    elif "Healthcare" in school_info: college = "SHCP"
                    elif "Education" in school_info: college = "SOED"
                    elif "Law" in school_info: college = "SLG"
                    else: college = school_info
                elif patient.user.school:
                    college = patient.user.school
            elif patient.user and patient.user.department:
                 college = patient.user.department
            else:
                 college = "Other"

            colleges[college] = colleges.get(college, 0) + 1

        # Return both 'name' and 'college' for frontend compatibility
        return sorted([{'name': k, 'college': k, 'count': v} for k, v in colleges.items()], key=lambda x: x['count'], reverse=True)

    @staticmethod
    def _get_course_distribution(patients):
        """Helper to aggregate patients by specific course/program"""
        courses = {}
        for patient in patients:
            course = "Unspecified"
            if patient.user and patient.user.course:
                course_id = str(patient.user.course)
                course = PROGRAMS_CHOICES.get(course_id, f"Program {course_id}")
            courses[course] = courses.get(course, 0) + 1
        
        return sorted([{'name': k, 'count': v} for k, v in courses.items()], key=lambda x: x['count'], reverse=True)

    @staticmethod
    def _get_role_distribution(patients):
        """Helper to aggregate patients by simplified role (Student vs Faculty/Staff)"""
        roles = {'STUDENT': 0, 'FACULTY / STAFF': 0}
        for patient in patients:
            if patient.user:
                role = patient.user.role
                if role == 'STUDENT':
                    roles['STUDENT'] += 1
                else:
                    roles['FACULTY / STAFF'] += 1
            else:
                roles['FACULTY / STAFF'] += 1
        return roles

    @staticmethod
    def get_comprehensive_system_analytics(date_start=None, date_end=None, filters=None):
        """Aggregate data for system-wide dashboard visualizations"""
        try:
            filters = filters or {}

            # Resolve date range from string if provided
            if filters.get('date_range') and not (date_start and date_end):
                range_type = filters['date_range']
                now = timezone.now()
                if range_type == '7days':
                    date_start = now - timedelta(days=7)
                elif range_type == '30days':
                    date_start = now - timedelta(days=30)
                elif range_type == '6months':
                    date_start = now - timedelta(days=180)
                elif range_type == 'all':
                    date_start = now - timedelta(days=3650) # 10 years

                date_end = now

            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()

            # Use visit_date for more accurate clinical timeline
            medical_records = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            dental_records = DentalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            # Apply filters
            if filters:
                # Filter by campus - Map to course IDs
                if filters.get('campus'):
                    campus_names = filters['campus'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(c in info['campus'] for c in campus_names)]
                    medical_records = medical_records.filter(patient__user__course__in=course_ids)
                    dental_records = dental_records.filter(patient__user__course__in=course_ids)
                
                # Filter by school - Map to course IDs
                if filters.get('school'):
                    school_names = filters['school'].split(',')
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                 if any(s in info['school'] for s in school_names)]
                    medical_records = medical_records.filter(patient__user__course__in=course_ids)
                    dental_records = dental_records.filter(patient__user__course__in=course_ids)

                # Filter by course (direct match)
                if filters.get('course'):
                    courses = filters['course'].split(',')
                    medical_records = medical_records.filter(patient__user__course__in=courses)
                    dental_records = dental_records.filter(patient__user__course__in=courses)

                # Filter by year level
                if filters.get('year_level'):
                    levels = filters['year_level'].split(',')
                    medical_records = medical_records.filter(patient__user__year_level__in=levels)
                    dental_records = dental_records.filter(patient__user__year_level__in=levels)

                # Role filter
                if filters.get('role'):
                    roles = filters['role'].split(',')
                    medical_records = medical_records.filter(patient__user__role__in=roles)
                    dental_records = dental_records.filter(patient__user__role__in=roles)

                if filters.get('service_type') == 'medical':
                    dental_records = DentalRecord.objects.none()
                elif filters.get('service_type') == 'dental':
                    medical_records = medical_records.none()


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

            # Calculate Course Distribution
            course_distribution = ReportDataService._get_course_distribution(all_active_patients)

            # Calculate Role Distribution (Student vs Staff)
            role_distribution = ReportDataService._get_role_distribution(all_active_patients)

            return {
                'demographics': {
                    'colleges': college_participation,
                    'courses': course_distribution,
                    'roles': role_distribution,
                    'total_active': len(all_active_patients)
                },
                'visits': {
                    'monthly': trends.get('monthly_summary', []),
                    'types': {'medical': medical_count, 'dental': dental_count},
                    'total': trends.get('total_visits', 0),
                    'granularity': trends.get('granularity')
                },
                'clinical': {
                    'top_diagnoses': medical_stats.get('top_diagnoses', []),
                    'top_procedures': dental_stats.get('common_procedures', [])
                },
                'satisfaction': {
                    'distribution': feedback.get('rating_distribution', []),
                    'average': feedback.get('avg_rating', 0),
                    'metrics': feedback.get('service_metrics', {}),
                    'raw_comments': feedback.get('raw_feedback', [])
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

class USCUnifiedHistoryReport:
    """
    USC Unified Health History Report Engine.
    Provides a chronological timeline of all patient interactions across all modules.
    """
    def __init__(self, buffer, user_context, patient_info):
        self.buffer = buffer
        if hasattr(user_context, 'get_full_name'):
            self.user = {
                'name': user_context.get_full_name() or user_context.email,
                'id': getattr(user_context, 'usc_id', str(user_context.id))
            }
        else:
            self.user = user_context or {'name': 'System', 'id': 'N/A'}
        
        self.patient = patient_info
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        self.styles = getSampleStyleSheet()
        
        if 'USCTitle' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='USCTitle', parent=self.styles['Normal'],
                fontSize=14, leading=16, alignment=TA_CENTER, textColor=colors.HexColor("#003366"), fontName='Helvetica-Bold'
            ))
        if 'TimelineType' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='TimelineType', parent=self.styles['Normal'],
                fontSize=7, leading=8, alignment=TA_CENTER, textColor=colors.whitesmoke, 
                fontName='Helvetica-Bold', backColor=colors.HexColor("#003366"), borderPadding=2
            ))
        if 'WrappedCell' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='WrappedCell', parent=self.styles['Normal'],
                fontSize=8, leading=11, alignment=TA_LEFT, wordWrap='LTR'
            ))

    def header_footer(self, canvas, doc):
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        import datetime
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawCentredString(A4[0]/2, A4[1]-15*mm, "UNIVERSITY OF SAN CARLOS")
        canvas.setFont('Helvetica', 10)
        canvas.drawCentredString(A4[0]/2, A4[1]-20*mm, "Health Services Department - Patient Health History")
        canvas.setStrokeColor(colors.HexColor("#003366"))
        canvas.line(20*mm, A4[1]-23*mm, A4[0]-20*mm, A4[1]-23*mm)
        
        # Patient Banner
        canvas.setFont('Helvetica-Bold', 9)
        canvas.drawString(20*mm, A4[1]-28*mm, f"Patient: {self.patient.get('name', 'N/A')}")
        canvas.drawRightString(A4[0]-20*mm, A4[1]-28*mm, f"ID: {self.patient.get('usc_id', 'N/A')}")

        # Footer
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        canvas.line(20*mm, 15*mm, A4[0]-20*mm, 15*mm)
        canvas.setFont('Helvetica', 7)
        canvas.drawString(20*mm, 10*mm, f"Generated: {timestamp} | By: {self.user['name']}")
        canvas.drawRightString(A4[0]-20*mm, 10*mm, f"Page {doc.page} | Confidential Medical Record")
        canvas.restoreState()

    def build(self, history, breakdown):
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        
        doc = SimpleDocTemplate(
            self.buffer, pagesize=A4,
            leftMargin=20*mm, rightMargin=20*mm, topMargin=35*mm, bottomMargin=25*mm
        )
        
        elements = []
        elements.append(Paragraph("UNIFIED HEALTH INTERACTION TIMELINE", self.styles['USCTitle']))
        elements.append(Spacer(1, 8*mm))
        
        # Breakdown Summary
        summary_data = [
            ["Medical Consultations", "Dental Consultations", "Medical Certificates", "Uploaded Documents"],
            [breakdown.get('medical', 0), breakdown.get('dental', 0), breakdown.get('certificates', 0), breakdown.get('documents', 0)]
        ]
        summary_table = Table(summary_data, colWidths=[42*mm]*4)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f1f1")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#003366")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 10*mm))
        
        # Timeline Table
        header = ['Date/Time', 'Type', 'Interaction Details', 'Notes / Recommendations']
        table_data = [header]
        
        type_colors = {
            'MEDICAL': colors.HexColor("#1976d2"),
            'DENTAL': colors.HexColor("#388e3c"),
            'CERTIFICATE': colors.HexColor("#f57c00"),
            'DOCUMENT': colors.HexColor("#7b1fa2")
        }

        for item in history:
            type_style = ParagraphStyle(
                name=f"Type_{item['type']}", parent=self.styles['TimelineType'],
                backColor=type_colors.get(item['type'], colors.grey)
            )
            
            table_data.append([
                Paragraph(item['date'], self.styles['WrappedCell']),
                Paragraph(item['type'], type_style),
                Paragraph(f"<b>{item['title']}</b><br/>{item['primary_info']}", self.styles['WrappedCell']),
                Paragraph(item['secondary_info'], self.styles['WrappedCell'])
            ])
            
        t = Table(table_data, colWidths=[30*mm, 20*mm, 60*mm, 60*mm], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('GRID', (0,0), (-1,-1), 0.2, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t)
        
        doc.build(elements, onFirstPage=self.header_footer, onLaterPages=self.header_footer)

class USCDentalAnalyticalReport:
    """
    USC Dental Section Analytical Report Engine.
    Implements Institutional Branding, Statistical Aggregation, and Data Visualization.
    """
    def __init__(self, buffer, user_context, date_range=None):
        self.buffer = buffer
        # Handle generator_user as either a dict or a User object
        if hasattr(user_context, 'get_full_name'):
            self.user = {
                'name': user_context.get_full_name() or user_context.email,
                'id': getattr(user_context, 'usc_id', str(user_context.id))
            }
        else:
            self.user = user_context or {'name': 'System', 'id': 'N/A'}
        
        self.date_range = date_range or "All Time"
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        self.styles = getSampleStyleSheet()
        
        if 'USCTitle' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='USCTitle', parent=self.styles['Normal'],
                fontSize=14, leading=16, alignment=TA_CENTER, textColor=colors.HexColor("#003366"), fontName='Helvetica-Bold'
            ))
        if 'MetricValue' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='MetricValue', parent=self.styles['Normal'],
                fontSize=16, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#d32f2f"), fontName='Helvetica-Bold'
            ))
        if 'MetricLabel' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='MetricLabel', parent=self.styles['Normal'],
                fontSize=9, leading=11, alignment=TA_CENTER, textColor=colors.grey, fontName='Helvetica-Oblique'
            ))
        if 'WrappedCell' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='WrappedCell', parent=self.styles['Normal'],
                fontSize=8, leading=11, alignment=TA_LEFT, wordWrap='LTR'
            ))

    def header_footer(self, canvas, doc):
        """Page Layout: Official USC Institutional Branding"""
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        import datetime
        canvas.saveState()
        # Branding Header
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawCentredString(A4[0]/2, A4[1]-15*mm, "UNIVERSITY OF SAN CARLOS")
        canvas.setFont('Helvetica', 10)
        canvas.drawCentredString(A4[0]/2, A4[1]-20*mm, "USC Health Services Department - Dental Section")
        canvas.setFont('Helvetica-Oblique', 8)
        canvas.drawCentredString(A4[0]/2, A4[1]-24*mm, "Talamban Campus, Nasipit, Talamban, Cebu City")
        canvas.setStrokeColor(colors.HexColor("#003366"))
        canvas.line(20*mm, A4[1]-27*mm, A4[0]-20*mm, A4[1]-27*mm)
        
        # Metadata labels
        canvas.setFont('Helvetica', 8)
        canvas.drawString(20*mm, A4[1]-32*mm, f"Filter: {self.date_range}")
        canvas.drawRightString(A4[0]-20*mm, A4[1]-32*mm, f"Generated By: {self.user['name']} ({self.user['id']})")

        # Footer
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        canvas.line(20*mm, 15*mm, A4[0]-20*mm, 15*mm)
        canvas.drawString(20*mm, 10*mm, f"Generation Timestamp: {timestamp}")
        canvas.drawRightString(A4[0]-20*mm, 10*mm, f"Page {doc.page} | Confidential Clinical Document")
        canvas.restoreState()

    def create_stat_summary(self, agg):
        """Dynamic Aggregation Block: Statistical Performance Cards"""
        from reportlab.platypus import Table, TableStyle, Paragraph
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        data = [
            [Paragraph("Total Patients", self.styles['MetricLabel']), 
             Paragraph("Gum Concerns", self.styles['MetricLabel']), 
             Paragraph("Issused Referrals", self.styles['MetricLabel'])],
            [Paragraph(str(agg.get('total_patients', 0)), self.styles['MetricValue']), 
             Paragraph(str(agg.get('gum_concerns', 0)), self.styles['MetricValue']), 
             Paragraph(str(agg.get('total_referrals', 0)), self.styles['MetricValue'])]
        ]
        table = Table(data, colWidths=[56*mm]*3)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8f9fa")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        return table

    def create_procedure_chart(self, proc_data):
        """Data Visualization: Volume of Procedures Chart"""
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.lib import colors
        drawing = Drawing(400, 180)
        bc = VerticalBarChart()
        bc.x = 50; bc.y = 50
        bc.height = 100; bc.width = 300
        bc.data = [proc_data.get('counts', [0])]
        bc.strokeColor = colors.white
        bc.valueAxis.valueMin = 0
        bc.categoryAxis.labels.fontSize = 8
        bc.categoryAxis.labels.angle = 30
        bc.categoryAxis.labels.dx = 5
        bc.categoryAxis.categoryNames = proc_data.get('labels', ['N/A'])
        bc.bars[0].fillColor = colors.HexColor("#003366")
        drawing.add(bc)
        return drawing

    def build(self, records, aggregation_data, chart_data):
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        doc = SimpleDocTemplate(
            self.buffer, pagesize=A4,
            leftMargin=20*mm, rightMargin=20*mm, topMargin=40*mm, bottomMargin=25*mm
        )
        
        elements = []
        
        # 1. Report Title
        elements.append(Paragraph("DENTAL CLINICAL ANALYSIS REPORT", self.styles['USCTitle']))
        elements.append(Spacer(1, 10*mm))
        
        # 2. Summary Statistics
        elements.append(Paragraph("<b>Section I: Statistical Summary</b>", self.styles['Normal']))
        elements.append(Spacer(1, 2*mm))
        elements.append(self.create_stat_summary(aggregation_data))
        elements.append(Spacer(1, 10*mm))
        
        # 3. Visualization
        elements.append(Paragraph("<b>Section II: Procedure Volume Distribution</b>", self.styles['Normal']))
        elements.append(self.create_procedure_chart(chart_data))
        elements.append(Spacer(1, 15*mm))
        
        # 4. Hardened Activity Logs (Strict Wrapping)
        elements.append(PageBreak())
        elements.append(Paragraph("<b>Section III: Detailed Consultation Logs</b>", self.styles['Normal']))
        elements.append(Spacer(1, 4*mm))
        
        # Headers optimized for Dental Consultation
        header = ['Date', 'Patient Info', 'Findings & Diagnosis', 'Tooth #', 'Procedure / Referral']
        table_data = [header]
        
        for r in records[:500]:
            # Force wrapping via Paragraphs
            table_data.append([
                Paragraph(str(r.get('date', '—')), self.styles['WrappedCell']),
                Paragraph(f"<b>{r.get('name', '—')}</b><br/>{r.get('usc_id', '—')}<br/>{r.get('role', '—')}", self.styles['WrappedCell']),
                Paragraph(f"<b>Gum:</b> {r.get('gum', '—')}<br/>{r.get('diagnosis', '—')}", self.styles['WrappedCell']),
                Paragraph(str(r.get('teeth', '—')), self.styles['WrappedCell']),
                Paragraph(f"<b>{r.get('proc', '—')}</b><br/>Ref to: {r.get('referral', '—')}", self.styles['WrappedCell'])
            ])

        # Strict Column Widths (Sum = 170mm)
        log_table = Table(table_data, colWidths=[25*mm, 35*mm, 45*mm, 20*mm, 45*mm], repeatRows=1)
        log_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        
        elements.append(log_table)
        doc.build(elements, onFirstPage=self.header_footer, onLaterPages=self.header_footer)

class USCMedicalAnalyticalReport:
    """
    Modular Python Reporting Engine for USC-PIS Medical Section.
    Generates panel-compliant reports with branding, analytics, and graphical charts.
    """
    def __init__(self, buffer, user_context, active_filters=None):
        self.buffer = buffer
        # Handle generator_user as either a dict or a User object
        if hasattr(user_context, 'get_full_name'):
            self.user = {
                'name': user_context.get_full_name() or user_context.email,
                'id': getattr(user_context, 'usc_id', str(user_context.id))
            }
        else:
            self.user = user_context or {'name': 'System', 'id': 'N/A'}
            
        self.filters = active_filters or "No specific filters applied"
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        self.styles = getSampleStyleSheet()
        
        if 'USCTitle' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='USCTitle', parent=self.styles['Normal'],
                fontSize=14, leading=16, alignment=TA_CENTER, textColor=colors.HexColor("#003366"), fontName='Helvetica-Bold'
            ))
        if 'MetricValue' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='MetricValue', parent=self.styles['Normal'],
                fontSize=16, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#1976d2"), fontName='Helvetica-Bold'
            ))
        if 'MetricLabel' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='MetricLabel', parent=self.styles['Normal'],
                fontSize=9, leading=11, alignment=TA_CENTER, textColor=colors.grey, fontName='Helvetica-Oblique'
            ))
        if 'WrappedCell' not in self.styles:
            self.styles.add(ParagraphStyle(
                name='WrappedCell', parent=self.styles['Normal'],
                fontSize=7.5, leading=9, alignment=TA_LEFT, wordWrap='LTR'
            ))

    def header_footer(self, canvas, doc):
        """Standardized Campus Institutional Header for USC-PIS"""
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        import datetime
        canvas.saveState()
        # Branding Block
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawCentredString(A4[0]/2, A4[1]-15*mm, "UNIVERSITY OF SAN CARLOS")
        canvas.setFont('Helvetica', 10)
        canvas.drawCentredString(A4[0]/2, A4[1]-20*mm, "USC Health Services Department - Medical Section")
        canvas.setFont('Helvetica-Oblique', 8)
        canvas.drawCentredString(A4[0]/2, A4[1]-24*mm, "Talamban Campus, Nasipit, Talamban, Cebu City")
        canvas.setStrokeColor(colors.HexColor("#003366"))
        canvas.line(20*mm, A4[1]-27*mm, A4[0]-20*mm, A4[1]-27*mm)
        
        # Metadata labels
        canvas.setFont('Helvetica', 8)
        canvas.drawString(20*mm, A4[1]-32*mm, f"Applied Filters: {self.filters}")
        canvas.drawRightString(A4[0]-20*mm, A4[1]-32*mm, f"Generated By: {self.user['name']} (ID: {self.user['id']})")

        # Footer
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        canvas.line(20*mm, 15*mm, A4[0]-20*mm, 15*mm)
        canvas.drawString(20*mm, 10*mm, f"Generation Timestamp: {timestamp}")
        canvas.drawRightString(A4[0]-20*mm, 10*mm, f"Page {doc.page} | Confidential Medical Record")
        canvas.restoreState()

    def create_aggregation_dashboard(self, agg):
        """Clinical Dashboard Matrix: Summary of Population Health Metrics"""
        from reportlab.platypus import Table, TableStyle, Paragraph
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        data = [
            [Paragraph("Total Consultations", self.styles['MetricLabel']), 
             Paragraph("BMI Alerts (>25.0)", self.styles['MetricLabel']), 
             Paragraph("Elevated BP Detection", self.styles['MetricLabel'])],
            [Paragraph(str(agg.get('total_visits', 0)), self.styles['MetricValue']), 
             Paragraph(str(agg.get('bmi_alerts', 0)), self.styles['MetricValue']), 
             Paragraph(str(agg.get('bp_alerts', 0)), self.styles['MetricValue'])]
        ]
        table = Table(data, colWidths=[58*mm]*3)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f4f7f9")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cfd8dc")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        return table

    def create_population_chart(self, chart_data):
        """Data Visualization: Distribution of Demographics/Diagnoses"""
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.lib import colors
        drawing = Drawing(400, 200)
        bc = VerticalBarChart()
        bc.x = 50; bc.y = 50
        bc.height = 125; bc.width = 300
        bc.data = [chart_data.get('counts', [0])]
        bc.strokeColor = colors.white
        bc.valueAxis.valueMin = 0
        bc.categoryAxis.labels.fontSize = 8
        bc.categoryAxis.labels.angle = 45
        bc.categoryAxis.labels.dx = 5
        bc.categoryAxis.categoryNames = chart_data.get('labels', ['N/A'])
        bc.bars[0].fillColor = colors.HexColor("#1976d2")
        drawing.add(bc)
        return drawing

    def build_document(self, clinical_records, aggregation_data, chart_data):
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
        from reportlab.lib.units import mm
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        doc = SimpleDocTemplate(
            self.buffer, pagesize=A4,
            leftMargin=15*mm, rightMargin=15*mm, topMargin=40*mm, bottomMargin=25*mm
        )
        
        elements = []
        
        # 1. Title Block
        elements.append(Paragraph("CLINICAL CASELOAD ANALYTICS REPORT", self.styles['USCTitle']))
        elements.append(Spacer(1, 10*mm))
        
        # 2. Aggregation Dashboard
        elements.append(Paragraph("<b>Section I: Population Health Summary</b>", self.styles['Normal']))
        elements.append(Spacer(1, 2*mm))
        elements.append(self.create_aggregation_dashboard(aggregation_data))
        elements.append(Spacer(1, 6*mm))
        
        # Student Context Summary (Panel Requirement 3.a.i)
        if aggregation_data.get('student_summary'):
            summary = aggregation_data['student_summary']
            if summary.get('courses') or summary.get('year_levels'):
                elements.append(Paragraph("<b>Student Population Distribution</b>", self.styles['MetricLabel']))
                elements.append(Spacer(1, 2*mm))
                
                # Create a sub-tally table
                course_txt = ", ".join([f"{k}: {v}" for k, v in list(summary['courses'].items())[:8]])
                yl_txt = ", ".join([f"{k}: {v}" for k, v in summary['year_levels'].items()])
                
                sub_data = [
                    [Paragraph(f"<b>By Course:</b> {course_txt or 'None'}", self.styles['WrappedCell']),
                     Paragraph(f"<b>By Year:</b> {yl_txt or 'None'}", self.styles['WrappedCell'])]
                ]
                sub_table = Table(sub_data, colWidths=[90*mm, 90*mm])
                sub_table.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.2, colors.lightgrey),
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fafafa")),
                ]))
                elements.append(sub_table)
                elements.append(Spacer(1, 8*mm))
        
        # 3. Data Visualization
        elements.append(Paragraph("<b>Section II: Case Distribution Analysis</b>", self.styles['Normal']))
        elements.append(self.create_population_chart(chart_data))
        elements.append(Spacer(1, 15*mm))
        
        # 4. Detailed Clinical Logs (Hardened Table)
        elements.append(PageBreak())
        elements.append(Paragraph("<b>Section III: Detailed Clinical Logs</b>", self.styles['Normal']))
        elements.append(Spacer(1, 4*mm))
        
        header = ['Date', 'Patient/School', 'Vitals Summary', 'Diagnosis/Clinical Findings', 'Medication/Plan']
        table_data = [header]
        
        for r in clinical_records[:500]:
            # Force auto-wrapping via Paragraphs
            table_data.append([
                Paragraph(str(r.get('date', '—')), self.styles['WrappedCell']),
                Paragraph(f"<b>{r.get('name', '—')}</b><br/>{r.get('usc_id', '—')}<br/>{r.get('school', '—')}", self.styles['WrappedCell']),
                Paragraph(r.get('vitals', '—'), self.styles['WrappedCell']),
                Paragraph(f"<b>CC:</b> {r.get('concern', '—')}<br/><b>Diag:</b> {r.get('diagnosis', '—')}", self.styles['WrappedCell']),
                Paragraph(f"<b>Rx:</b> {r.get('meds', '—')}<br/><b>Plan:</b> {r.get('treatment', '—')}", self.styles['WrappedCell'])
            ])

        # Strict Column Widths (Sum = 180mm for optimized A4)
        log_table = Table(table_data, colWidths=[22*mm, 35*mm, 28*mm, 50*mm, 45*mm], repeatRows=1)
        log_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        
        elements.append(log_table)
        doc.build(elements, onFirstPage=self.header_footer, onLaterPages=self.header_footer)

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
            report_type = report_data.get('report_type', '') if isinstance(report_data, dict) else ''
            # 1. High-Fidelity HTML-to-PDF (Primary)
            # Use xhtml2pdf if a template is provided
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

            # 2. Professional Analytical ReportLab Generators
            buffer = BytesIO()
            
            # --- BRANCH TO SPECIALIZED GENERATORS ---
            if report_type == 'HEALTH_HISTORY':
                # UNIFIED HISTORY SPECIALIZED REPORT
                patient_info = {
                    'name': report_data.get('patient_name', 'N/A'),
                    'usc_id': report_data.get('usc_id', 'N/A')
                }
                generator = USCUnifiedHistoryReport(buffer, user, patient_info)
                generator.build(report_data.get('history', []), report_data.get('breakdown', {}))
                return buffer.getvalue()
                
            elif report_type in ['DENTAL_STATISTICS', 'DENTAL_STATS']:
                # DENTAL SPECIALIZED REPORT
                date_range = f"{report_data.get('date_range_start', 'N/A')} to {report_data.get('date_range_end', 'N/A')}"
                generator = USCDentalAnalyticalReport(buffer, user, date_range=date_range)
                
                # Prepare aggregation data
                agg_data = {
                    'total_patients': report_data.get('total_records', 0),
                    'gum_concerns': sum([item['count'] for item in report_data.get('gum_stats', []) if item['condition'] != 'Healthy']),
                    'total_referrals': next((item['count'] for item in report_data.get('common_procedures', []) if item['name'] == 'Referral'), 0)
                }
                
                # Prepare chart data
                proc_data = {
                    'labels': [p['name'] for p in report_data.get('common_procedures', [])[:5]],
                    'counts': [p['count'] for p in report_data.get('common_procedures', [])[:5]]
                }
                
                # Prepare records - fetch actual records if not in report_data
                records = report_data.get('detailed_records', [])
                if not records:
                    # Fallback to fetching actual DentalRecord objects for the detailed log
                    from patients.models import DentalRecord
                    dr_qs = DentalRecord.objects.all()
                    if 'date_range_start' in report_data and 'date_range_end' in report_data:
                        dr_qs = dr_qs.filter(visit_date__range=(report_data['date_range_start'], report_data['date_range_end']))
                    
                    for dr in dr_qs.select_related('patient__user').order_by('-visit_date')[:500]:
                        u = dr.patient.user
                        records.append({
                            'date': dr.visit_date.strftime('%Y-%m-%d') if dr.visit_date else '—',
                            'name': u.get_full_name() if u else dr.patient.first_name,
                            'usc_id': getattr(u, 'usc_id', '—'),
                            'role': u.role if u else '—',
                            'gum': dr.get_gum_condition_display() or '—',
                            'diagnosis': dr.diagnosis or '—',
                            'teeth': dr.tooth_numbers or '—',
                            'proc': dr.get_procedure_performed_display() or '—',
                            'referral': dr.referral_to or '—'
                        })
                
                generator.build(records, agg_data, proc_data)
                return buffer.getvalue()

            elif report_type in ['MEDICAL_STATISTICS', 'MEDICAL_STATS']:
                # MEDICAL SPECIALIZED REPORT
                filters_str = f"Date: {report_data.get('date_range_start', 'N/A')} to {report_data.get('date_range_end', 'N/A')}"
                generator = USCMedicalAnalyticalReport(buffer, user, active_filters=filters_str)
                
                # Prepare aggregation data
                agg_data = {
                    'total_visits': report_data.get('total_consultations', 0),
                    'bmi_alerts': 0, # Calculated from records below
                    'bp_alerts': 0   # Calculated from records below
                }
                
                # Prepare chart data
                chart_data = {
                    'labels': [d['name'] for d in report_data.get('top_diagnoses', [])[:5]],
                    'counts': [d['count'] for d in report_data.get('top_diagnoses', [])[:5]]
                }
                
                # Prepare records
                records = []
                from patients.models import MedicalRecord
                mr_qs = MedicalRecord.objects.all()
                if 'date_range_start' in report_data and 'date_range_end' in report_data:
                    mr_qs = mr_qs.filter(visit_date__range=(report_data['date_range_start'], report_data['date_range_end']))
                
                # Dynamic Student Summary Aggregation
                student_summary = {
                    'courses': {}, # { 'BSCpE': count }
                    'year_levels': {} # { '1st Year': count }
                }

                bmi_alerts = 0
                bp_alerts = 0
                
                for mr in mr_qs.select_related('patient__user').order_by('-visit_date')[:500]:
                    p = mr.patient
                    u = p.user
                    
                    # Student Context Tally
                    if u and u.role in ['STUDENT', 'PATIENT'] and (u.course or u.year_level):
                        if u.course:
                            student_summary['courses'][u.course] = student_summary['courses'].get(u.course, 0) + 1
                        if u.year_level:
                            yl = f"{u.year_level} Year" if str(u.year_level).isdigit() else u.year_level
                            student_summary['year_levels'][yl] = student_summary['year_levels'].get(yl, 0) + 1

                    vitals = mr.vital_signs or {}
                    
                    # Refined Parsing with standard dash fallbacks
                    def clean_vital(val, suffix=""):
                        if val is None or str(val).strip().upper() in ["N/A", "NULL", "NONE", "", "0", "0.0"]:
                            return "—"
                        return f"{val}{suffix}"

                    bmi = vitals.get('bmi', 0)
                    if bmi and str(bmi).replace('.','',1).isdigit() and float(bmi) > 25.0: 
                        bmi_alerts += 1
                    
                    bp = vitals.get('blood_pressure', '')
                    if bp and '/' in str(bp):
                        try:
                            sys, dia = map(float, str(bp).split('/'))
                            if sys >= 140 or dia >= 90: bp_alerts += 1
                        except: pass
                    
                    # Prepare consolidated vitals string with HR/RR
                    hr = clean_vital(vitals.get('heart_rate') or vitals.get('pulse_rate'), " bpm")
                    rr = clean_vital(vitals.get('respiratory_rate'), " cpm")
                    vitals_summary = f"BP: {clean_vital(bp)}<br/>T: {clean_vital(vitals.get('temperature'), '°C')}<br/>BMI: {clean_vital(bmi)}<br/>HR: {hr}<br/>RR: {rr}"

                    records.append({
                        'date': mr.visit_date.strftime('%Y-%m-%d') if mr.visit_date else '—',
                        'name': u.get_full_name() if u else p.first_name,
                        'usc_id': getattr(u, 'usc_id', '—'),
                        'school': (u.department or u.course or '—') if u else '—',
                        'vitals': vitals_summary,
                        'concern': mr.concern or mr.chief_complaint or '—',
                        'diagnosis': mr.diagnosis or '—',
                        'meds': mr.medications or '—',
                        'treatment': mr.treatment or '—'
                    })
                
                agg_data['bmi_alerts'] = bmi_alerts
                agg_data['bp_alerts'] = bp_alerts
                agg_data['student_summary'] = student_summary
                
                generator.build_document(records, agg_data, chart_data)
                return buffer.getvalue()

            else:
                # GENERIC ANALYTICAL FALLBACK
                generator = USCPISReportGenerator(buffer, user)
                
                analytics = {'summary': {}, 'charts': {'labels': [], 'values': []}}
                records = []
                
                if isinstance(report_data, dict):
                    analytics['summary'] = {
                        'total': report_data.get('total_responses', report_data.get('total_visits', report_data.get('total_count', report_data.get('record_count', 0)))),
                        'student_pct': report_data.get('student_percentage', report_data.get('student_pct', 70)), 
                        'staff_count': report_data.get('staff_count', report_data.get('faculty_count', 0))
                    }
                    
                    if 'demographics' in report_data:
                        analytics['summary']['total'] = report_data.get('visits', {}).get('total', analytics['summary']['total'])
                        roles = report_data.get('demographics', {}).get('roles', {})
                        analytics['summary']['staff_count'] = roles.get('STAFF', 0) + roles.get('FACULTY', 0)
                    
                    if 'top_diagnoses' in report_data:
                        diag = report_data['top_diagnoses']
                        analytics['charts']['labels'] = [d.get('name', d.get('diagnosis', 'N/A'))[:15] for d in diag[:5]]
                        analytics['charts']['values'] = [d.get('count', d.get('total', 0)) for d in diag[:5]]
                    elif 'common_procedures' in report_data:
                        proc = report_data['common_procedures']
                        analytics['charts']['labels'] = [p.get('name', 'N/A')[:15] for p in proc[:5]]
                        analytics['charts']['values'] = [p.get('count', 0) for p in proc[:5]]
                    
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
                
                .usc-header { 
                    text-align: center; 
                    border-bottom: 2px solid #1e293b; 
                    margin-bottom: 30px; 
                    padding-bottom: 10px; 
                }
                .usc-logo-text { font-size: 18pt; font-weight: bold; color: #1e293b; margin: 0; text-transform: uppercase; }
                .usc-sub-text { font-size: 10pt; color: #64748b; margin: 5px 0 0 0; }
                
                .report-title { text-align: center; font-size: 16pt; color: #1e293b; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }

                .section { margin-bottom: 30px; page-break-inside: avoid; }
                .section-title { 
                    background-color: #f8fafc; 
                    color: #1e293b; 
                    font-size: 11pt; 
                    font-weight: bold; 
                    padding: 8px 12px; 
                    border-left: 4px solid #3b82f6; 
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }
                
                .chart-container { text-align: center; margin: 25px 0; border: 1px solid #f1f5f9; padding: 15px; border-radius: 8px; }
                
                .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .data-table th { background-color: #f1f5f9; color: #475569; padding: 10px 8px; text-align: left; font-size: 8pt; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
                .data-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 8.5pt; color: #334155; }
                .data-table tr:nth-child(even) { background-color: #f8fafc; }
                
                .metric-table { width: 100%; margin-bottom: 20px; border-spacing: 10px; border-collapse: separate; }
                .metric-box { background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; text-align: center; border-radius: 6px; width: 25%; }
                .metric-val { font-size: 16pt; font-weight: bold; color: #2563eb; display: block; }
                .metric-lbl { font-size: 7pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-top: 5px; display: block; letter-spacing: 0.5px; }
                
                .footer-sign { margin-top: 60px; text-align: right; font-size: 9pt; }
                .signature-line { border-top: 1px solid #94a3b8; width: 220px; display: inline-block; margin-top: 40px; }
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
                <div class="section-title">Visual Analytics Dashboard</div>
                {{% for chart_url in visual_charts %}}
                <div class="chart-container"><img src="{{{{ chart_url }}}}" width="480" /></div>
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
                {{% if v|is_list and v|has_data and k not in "visual_charts,charts_base64,visual_analytics,system_log" %}}
                <div class="section">
                    <div class="section-title">{{{{ k|title_clean }}}} Detail</div>
                    <table class="data-table">
                        {{% with first_item=v|first %}}
                            {{% if first_item|is_dict %}}
                                <thead>
                                    <tr>
                                        {{% for key in first_item.keys %}}
                                            {{% if key != "id" %}}
                                            <th>{{{{ key|title_clean }}}}</th>
                                            {{% endif %}}
                                        {{% endfor %}}
                                    </tr>
                                </thead>
                                <tbody>
                                    {{% for item in v %}}
                                        <tr>
                                            {{% for key, val in item.items %}}
                                                {{% if key != "id" %}}
                                                <td>{{{{ val }}}}</td>
                                                {{% endif %}}
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

            {{% if system_log %}}
            <div class="section">
                <div class="section-title">System Activity Audit Log</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{% for log in system_log %}}
                        <tr>
                            <td>{{{{ log.timestamp|format_date:"Y-m-d H:i" }}}}</td>
                            <td>{{{{ log.user }}}}</td>
                            <td>{{{{ log.role }}}}</td>
                            <td>{{{{ log.status }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            <div class="footer-sign">
                <div class="signature-line"></div>
                <p><strong>AUTHORIZED CLINIC PERSONNEL</strong></p>
                <p>University of San Carlos Health Services</p>
            </div>
        </body>
        </html>"""

    def _generate_chart_url_complex(self, chart_type, labels, datasets, title="Analysis"):
        """Generate a QuickChart.io URL for embedding complex multi-series charts in reports"""
        import json
        import urllib.parse
        
        # Limit labels for readability
        labels = labels[:15]
        
        processed_datasets = []
        for i, ds in enumerate(datasets):
            ds_data = ds.get('data', [])[:15]
            ds_label = ds.get('label', f'Series {i+1}')
            
            # Use Workshop-standard colors
            colors = [
                'rgba(59, 130, 246, 0.8)', # blue-500
                'rgba(16, 185, 129, 0.8)', # emerald-500
                'rgba(245, 158, 11, 0.8)', # amber-500
                'rgba(239, 68, 68, 0.8)',  # red-500
                'rgba(139, 92, 246, 0.8)', # violet-500
                'rgba(107, 114, 128, 0.8)'  # gray-500
            ]
            
            processed_datasets.append({
                'label': ds_label,
                'data': ds_data,
                'backgroundColor': ds.get('backgroundColor') or colors[i % len(colors)],
                'borderColor': ds.get('borderColor') or colors[i % len(colors)].replace('0.8', '1'),
                'fill': ds.get('fill', False),
                'borderDash': ds.get('borderDash', [])
            })

        chart_config = {
            'type': chart_type,
            'data': {
                'labels': labels,
                'datasets': processed_datasets
            },
            'options': {
                'title': { 'display': True, 'text': title, 'fontSize': 16, 'fontColor': '#1e293b' },
                'legend': { 'display': True, 'position': 'bottom' },
                'scales': {
                    'yAxes': [{'ticks': {'beginAtZero': True}}]
                } if chart_type not in ['pie', 'doughnut'] else {}
            }
        }
        
        config_str = json.dumps(chart_config)
        encoded_config = urllib.parse.quote(config_str)
        return f"https://quickchart.io/chart?c={encoded_config}&w=600&h=350"

    def collect_report_data(self, report_type, title, date_start=None, date_end=None, filters=None, **kwargs):
        """Standardized data collection for any report type with complex Workshop visualizations"""
        rtype = str(report_type or '').strip().upper()
        
        # Standardize dates
        date_start = date_start or kwargs.get('date_range_start') or (timezone.now() - timedelta(days=365))
        date_end = date_end or kwargs.get('date_range_end') or timezone.now()

        try:
            if rtype == 'PATIENT_SUMMARY': 
                data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
                report_title = title or "Institutional Population Summary"
            elif rtype == 'VISIT_TRENDS': 
                data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
                report_title = title or "Clinical Capacity & Visit Trends"
            elif rtype in ['FEEDBACK_ANALYSIS', 'PATIENT_FEEDBACK']: 
                data = self.data_service.get_feedback_analysis_data(date_start, date_end, filters)
                report_title = title or "Patient Satisfaction & Feedback Analysis"
            elif rtype in ['CAMPAIGN_PERFORMANCE', 'HEALTH_CAMPAIGN']: 
                data = self.data_service.get_campaign_performance_data(date_start, date_end, filters)
                report_title = title or "Health Campaign Impact Analysis"
            elif rtype in ['MEDICAL_STATISTICS', 'MEDICAL_STATS']: 
                data = self.data_service.get_medical_statistics_data(date_start, date_end, filters)
                report_title = title or "Medical Clinical Statistics"
            elif rtype in ['DENTAL_STATISTICS', 'DENTAL_STATS']: 
                data = self.data_service.get_dental_statistics_data(date_start, date_end, filters)
                report_title = title or "Dental Health Clinical Statistics"
            elif rtype in ['TREATMENT_OUTCOMES', 'TREATMENT_OUTCOME']: 
                data = self.data_service.get_treatment_outcomes_data(date_start, date_end, filters)
                report_title = title or "Treatment Efficacy & Outcomes"
            elif rtype == 'USER_ACTIVITY' or rtype == 'OPERATIONS': 
                data = self.data_service.get_user_activity_data(date_start, date_end, filters)
                report_title = title or "System Operations & Audit Log"
            elif rtype == 'HEALTH_METRICS':
                data = self.data_service.get_health_metrics_data(date_start, date_end, filters)
                report_title = title or "Vitals & Health Metrics Analysis"
            elif rtype == 'HEALTH_HISTORY':
                data = self.data_service.get_unified_health_history_data(date_start, date_end, filters)
                report_title = title or "Unified Longitudinal Health History"
            else: 
                logger.warning(f"Unknown report type '{rtype}', using comprehensive analytics fallback")
                data = self.data_service.get_comprehensive_analytics_data(date_start, date_end, filters)
                report_title = title or "Comprehensive Institutional Analytics"
            
            if not isinstance(data, dict): data = {'error': 'Invalid data format', 'report_type': rtype}
            
            # Enrich with Workshop-Standard Charts
            charts = []
            
            if rtype == 'PATIENT_SUMMARY':
                if data.get('course_distribution'):
                    charts.append(self._generate_chart_url_complex('pie', 
                        [d.get('name', 'Other') for d in data['course_distribution'][:8]], 
                        [{'label': 'Enrollment', 'data': [d.get('count', 0) for d in data['course_distribution'][:8]]}],
                        "Course Enrollment Distribution"))
                if data.get('role_distribution'):
                    charts.append(self._generate_chart_url_complex('doughnut', 
                        [d.get('name', 'N/A') for d in data['role_distribution']], 
                        [{'label': 'Role Share', 'data': [d.get('count', 0) for d in data['role_distribution']]}],
                        "Institutional Role Classification"))

            elif rtype == 'VISIT_TRENDS' and data.get('monthly_summary'):
                monthly = data['monthly_summary']
                charts.append(self._generate_chart_url_complex('line', 
                    [m['month'] for m in monthly], 
                    [
                        {'label': 'Aggregate Trends', 'data': [m['total_visits'] for m in monthly], 'borderDash': [5, 5], 'borderColor': '#1e293b'},
                        {'label': 'Medical', 'data': [m['medical_visits'] for m in monthly], 'borderColor': '#3b82f6'},
                        {'label': 'Dental', 'data': [m['dental_visits'] for m in monthly], 'borderColor': '#10b981'}
                    ],
                    "Longitudinal Interaction Timeline"))

            elif rtype in ['CAMPAIGN_PERFORMANCE', 'HEALTH_CAMPAIGN'] and data.get('campaign_performance'):
                perf = data['campaign_performance']
                charts.append(self._generate_chart_url_complex('bar', 
                    [c.get('title', 'N/A')[:20] for c in perf[:8]], 
                    [
                        {'label': 'Total Views', 'data': [c.get('views', 0) for c in perf[:8]], 'backgroundColor': '#3b82f6'},
                        {'label': 'Engagement', 'data': [c.get('engagement', 0) for c in perf[:8]], 'backgroundColor': '#10b981'}
                    ],
                    "Campaign Impact Metrics"))

            elif rtype in ['FEEDBACK_ANALYSIS', 'PATIENT_FEEDBACK'] and data.get('rating_distribution'):
                dist = data['rating_distribution']
                charts.append(self._generate_chart_url_complex('doughnut', 
                    [d.get('category', 'N/A') for d in dist], 
                    [{'label': 'Satisfaction', 'data': [d.get('count', 0) for d in dist]}],
                    "Patient Satisfaction Index"))

            elif rtype in ['MEDICAL_STATISTICS', 'MEDICAL_STATS'] and data.get('top_diagnoses'):
                diag = data['top_diagnoses']
                charts.append(self._generate_chart_url_complex('bar', 
                    [d.get('name', 'N/A')[:25] for d in diag[:10]], 
                    [{'label': 'Frequency', 'data': [d.get('count', 0) for d in diag[:10]], 'backgroundColor': '#3b82f6'}],
                    "Top Clinical Diagnoses (Medical)"))

            elif rtype in ['DENTAL_STATISTICS', 'DENTAL_STATS'] and data.get('common_procedures'):
                proc = data['common_procedures']
                charts.append(self._generate_chart_url_complex('bar', 
                    [p.get('name', 'N/A')[:25] for p in proc[:10]], 
                    [{'label': 'Frequency', 'data': [p.get('count', 0) for p in proc[:10]], 'backgroundColor': '#10b981'}],
                    "Top Procedural Metrics (Dental)"))

            elif rtype == 'USER_ACTIVITY' or rtype == 'OPERATIONS':
                peak_hours = data.get('peak_hours', [])
                if peak_hours:
                    charts.append(self._generate_chart_url_complex('line', 
                        [f"{h['hour']}:00" for h in peak_hours], 
                        [{'label': 'Activity Volume', 'data': [h['count'] for h in peak_hours], 'fill': True, 'backgroundColor': 'rgba(59, 130, 246, 0.1)'}],
                        "Hourly Operational Peak Analysis"))

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
    def generate_health_history_report(self, **kwargs): return self._generate_generic_report('HEALTH_HISTORY', "Health History", **kwargs)

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
            },
            'HEALTH_HISTORY': {
                'filters': [
                    {'id': 'patient_id', 'label': 'Select Student/Patient', 'type': 'api_select', 'endpoint': '/api/patients/'}
                ],
                'fields': [
                    {'id': 'date', 'label': 'Date/Time', 'default': True},
                    {'id': 'type', 'label': 'Type', 'default': True},
                    {'id': 'title', 'label': 'Interaction', 'default': True},
                    {'id': 'primary_info', 'label': 'Findings/Details', 'default': True}
                ],
                'groupable_by': ['type']
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
