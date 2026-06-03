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
from authentication.models import User, AuditLog
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
        """Generate cache key for report data with versioning for easy invalidation"""
        version = cache.get('reports_cache_version', 1)
        key_parts = [
            f"v{version}",
            prefix,
            date_start.strftime('%Y%m%d') if date_start else 'no_start',
            date_end.strftime('%Y%m%d') if date_end else 'no_end',
            str(hash(str(sorted(filters.items())))) if filters else 'no_filters'
        ]
        return '_'.join(key_parts)

    @staticmethod
    def invalidate_cache():
        """Increment the report cache version to invalidate all current report caches"""
        try:
            cache.incr('reports_cache_version')
            logger.info("Report cache invalidated via version increment.")
        except (ValueError, Exception):
            # If key doesn't exist or error occurs, set to a new timestamp
            new_v = int(timezone.now().timestamp())
            cache.set('reports_cache_version', new_v, 86400 * 7) # 1 week
            logger.info(f"Report cache initialized/reset to version {new_v}.")

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
                    
                    # Format dates for JSON/PDF consistency
                    for r in medical_records: 
                        if r.get('visit_date'): r['visit_date'] = r['visit_date'].strftime('%Y-%m-%d')
                    for r in dental_records: 
                        if r.get('visit_date'): r['visit_date'] = r['visit_date'].strftime('%Y-%m-%d')
                    for r in consultations: 
                        if r.get('date_time'): r['date_time'] = r['date_time'].strftime('%Y-%m-%d %H:%M')
                    
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
                            'date_of_birth': patient.date_of_birth.strftime('%Y-%m-%d') if patient.date_of_birth else 'N/A',
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
            
            # Build optimized query base
            patient_scope = filters.get('patient_scope', 'active_with_records') if filters else 'active_with_records'
            
            if patient_scope == 'all_verified':
                queryset = User.objects.filter(is_verified=True)
                gender_field = 'sex'
                dob_field = 'birthday'
                table_name = 'authentication_user'
                id_col = 'id'
            else:
                queryset = Patient.objects.select_related('user').prefetch_related('medical_records', 'dental_records')
                gender_field = 'gender'
                dob_field = 'date_of_birth'
                table_name = 'patients_patient'
                id_col = 'id'

                # Standardize scope-based filtering
                if patient_scope == 'active_with_records':
                    if date_start and date_end:
                        med_p_ids = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end)).values_list('patient_id', flat=True)
                        den_p_ids = DentalRecord.objects.filter(visit_date__range=(date_start, date_end)).values_list('patient_id', flat=True)
                        all_ids = set(list(med_p_ids) + list(den_p_ids))
                        queryset = queryset.filter(id__in=all_ids)
                elif patient_scope == 'all_profiles':
                    # All verified patients who completed setup (have a Patient object)
                    queryset = queryset.filter(user__is_verified=True)
                    # For a population summary, we usually want cumulative data as of the end date
                    if date_end:
                        queryset = queryset.filter(created_at__lte=date_end)
            
            # Apply additional filters
            if filters:
                if filters.get('gender'):
                    genders = filters['gender']
                    if isinstance(genders, str): genders = genders.split(',')
                    if genders: queryset = queryset.filter(**{f"{gender_field}__in": genders})
                
                if filters.get('school'):
                    schools = filters['school']
                    if isinstance(schools, str): schools = schools.split(',')
                    if schools:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(s in info['school'] for s in schools)]
                        course_field = 'course' if patient_scope == 'all_verified' else 'user__course'
                        queryset = queryset.filter(**{f"{course_field}__in": course_ids})

                if filters.get('course'):
                    courses = filters['course']
                    course_field = 'course' if patient_scope == 'all_verified' else 'user__course'
                    if isinstance(courses, str): courses = courses.split(',')
                    if courses: queryset = queryset.filter(**{f"{course_field}__in": courses})

                if filters.get('year_level'):
                    yls = filters['year_level']
                    yl_field = 'year_level' if patient_scope == 'all_verified' else 'user__year_level'
                    if isinstance(yls, str): yls = yls.split(',')
                    if yls: queryset = queryset.filter(**{f"{yl_field}__in": yls})

                if filters.get('campus'):
                    campuses = filters['campus']
                    course_field = 'course' if patient_scope == 'all_verified' else 'user__course'
                    if isinstance(campuses, str): campuses = campuses.split(',')
                    if campuses:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(c in info['campus'] for c in campuses)]
                        queryset = queryset.filter(**{f"{course_field}__in": course_ids})

                if filters.get('search'):
                    if patient_scope == 'all_verified':
                        queryset = queryset.filter(
                            Q(first_name__icontains=filters['search']) | 
                            Q(last_name__icontains=filters['search']) |
                            Q(id_number__icontains=filters['search'])
                        )
                    else:
                        queryset = queryset.filter(
                            Q(first_name__icontains=filters['search']) | 
                            Q(last_name__icontains=filters['search']) |
                            Q(user__id_number__icontains=filters['search'])
                        )
            
            # Aggregate data in single query
            if patient_scope == 'all_verified':
                aggregate_data = queryset.aggregate(
                    total_patients=Count('id'),
                    new_registrations=Count('id', filter=Q(date_joined__gte=timezone.now() - timedelta(days=30))),
                    patients_with_medical_records=Value(0),
                    patients_with_dental_records=Value(0)
                )
            else:
                aggregate_data = queryset.aggregate(
                    total_patients=Count('id'),
                    new_registrations=Count('id', filter=Q(created_at__gte=timezone.now() - timedelta(days=30))),
                    patients_with_medical_records=Count('id', filter=Q(medical_records__isnull=False), distinct=True),
                    patients_with_dental_records=Count('id', filter=Q(dental_records__isnull=False), distinct=True)
                )
            
            # Use the same high-fidelity distribution methods as comprehensive analytics
            all_objs = list(queryset)
            course_distribution = ReportDataService._get_course_distribution(all_objs)
            role_distribution = ReportDataService._get_role_distribution(all_objs)
            college_participation = ReportDataService._get_college_participation(all_objs)

            # Gender distribution
            gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other', '1': 'Male', '2': 'Female', 'Male': 'Male', 'Female': 'Female'} 
            gender_counts = {}
            for obj in all_objs:
                g_code = getattr(obj, gender_field, None)
                g_name = gender_map.get(g_code, g_code if g_code else 'Unknown')
                gender_counts[g_name] = gender_counts.get(g_name, 0) + 1
            gender_distribution = [{'gender': k, 'count': v} for k, v in gender_counts.items()]
            
            # Age distribution - Python calculation to respect all filters
            age_groups_counts = {'0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0}
            
            # Year level distribution
            yl_counts = {}
            yl_dist_field = 'year_level' if patient_scope == 'all_verified' else 'user__year_level'
            
            for obj in all_objs:
                # Handle Age
                dob = getattr(obj, dob_field, None)
                if dob:
                    if hasattr(dob, 'date'): dob = dob.date()
                    today = timezone.now().date()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                    if age < 18: age_groups_counts['0-17'] += 1
                    elif age <= 25: age_groups_counts['18-25'] += 1
                    elif age <= 35: age_groups_counts['26-35'] += 1
                    elif age <= 45: age_groups_counts['36-45'] += 1
                    elif age <= 60: age_groups_counts['46-60'] += 1
                    else: age_groups_counts['60+'] += 1
                
                # Handle Year Level
                if patient_scope == 'all_verified':
                    yl = getattr(obj, 'year_level', 'N/A')
                else:
                    user = getattr(obj, 'user', None)
                    yl = getattr(user, 'year_level', 'N/A') if user else 'N/A'
                
                yl_label = str(yl) if yl else 'N/A'
                yl_counts[yl_label] = yl_counts.get(yl_label, 0) + 1

            year_level_distribution = sorted(
                [{'year_level': k, 'count': v} for k, v in yl_counts.items()],
                key=lambda x: x['count'], reverse=True
            )[:10]

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
                'period': {
                    'start': date_start.strftime('%Y-%m-%d') if date_start else 'Beginning',
                    'end': date_end.strftime('%Y-%m-%d') if date_end else 'Present'
                }
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
            
            # Anchor date_start if 'all' is explicitly requested in filters
            if filters.get('date_range') == 'all':
                date_start = timezone.make_aware(datetime(2024, 1, 1, 0, 0, 0))
                date_end = now

            date_start = date_start or (now - timedelta(days=365))
            date_end = date_end or now
            
            # Ensure awareness and normalize to full day coverage
            current_tz = timezone.get_current_timezone()
            if hasattr(date_start, 'tzinfo') and date_start.tzinfo is None:
                date_start = timezone.make_aware(date_start)
            elif hasattr(date_start, 'astimezone'):
                date_start = date_start.astimezone(current_tz)

            if hasattr(date_end, 'tzinfo') and date_end.tzinfo is None:
                date_end = timezone.make_aware(date_end)
            elif hasattr(date_end, 'astimezone'):
                date_end = date_end.astimezone(current_tz)

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
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles:
                        medical_records = medical_records.filter(patient__user__role__in=roles)
                        dental_records = dental_records.filter(patient__user__role__in=roles)

                if filters.get('campus'):
                    campus_names = filters['campus']
                    if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]
                    if campus_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items()
                                     if any(c in info['campus'] for c in campus_names)]
                        medical_records = medical_records.filter(patient__user__course__in=course_ids)
                        dental_records = dental_records.filter(patient__user__course__in=course_ids)

                if filters.get('school'):
                    school_names = filters['school']
                    if isinstance(school_names, str): school_names = [s.strip() for s in school_names.split(',')]
                    if school_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items()
                                     if any(s in info['school'] for s in school_names)]
                        medical_records = medical_records.filter(patient__user__course__in=course_ids)
                        dental_records = dental_records.filter(patient__user__course__in=course_ids)

                if filters.get('course'):
                    course_list = filters['course']
                    if isinstance(course_list, str): course_list = [c.strip() for c in course_list.split(',')]
                    if course_list:
                        medical_records = medical_records.filter(patient__user__course__in=course_list)
                        dental_records = dental_records.filter(patient__user__course__in=course_list)

                if filters.get('year_level'):
                    level_list = filters['year_level']
                    if isinstance(level_list, str): level_list = [l.strip() for l in level_list.split(',')]
                    if level_list:
                        medical_records = medical_records.filter(patient__user__year_level__in=level_list)
                        dental_records = dental_records.filter(patient__user__year_level__in=level_list)
                
                s_type = filters.get('service_type') or filters.get('visit_type')
                if s_type:
                    s_type = s_type.upper()
                    if s_type == 'MEDICAL':
                        dental_records = dental_records.none()
                    elif s_type == 'DENTAL':
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

            monthly_data = []
            
            # Create a full date range to ensure no gaps
            full_range = pd.date_range(start=date_start, end=date_end, freq=freq, normalize=True)
            logger.info(f"Visit Trends: Timeline generated from {date_start} to {date_end} (Freq: {freq}, Points: {len(full_range)})")
            
            if hasattr(full_range, 'tz_convert'):
                full_range = full_range.tz_convert(current_tz)
            
            if m_data or d_data:
                df = pd.DataFrame(m_data + d_data)
                df['date'] = pd.to_datetime(df['date'])
                
                # Convert to local timezone for proper clinical binning
                df['date'] = df['date'].dt.tz_convert(current_tz)
                
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
                
                # Calculate growth safely
                prev_total = counts['total'].shift(1)
                counts['growth'] = 0.0
                
                # Use a custom function to handle growth to avoid inf%
                def calculate_growth(current, previous):
                    if previous == 0:
                        return 100.0 if current > 0 else 0.0
                    return ((current - previous) / previous) * 100.0

                growth_values = []
                for i in range(len(counts)):
                    curr = counts['total'].iloc[i]
                    prev = prev_total.iloc[i]
                    if pd.isna(prev):
                        growth_values.append(0.0)
                    else:
                        growth_values.append(calculate_growth(curr, prev))
                
                counts['growth'] = growth_values
                counts = counts.fillna(0)
                
                longitudinal_trends = []
                for timestamp, row in counts.iterrows():
                    longitudinal_trends.append({
                        'period': timestamp.strftime(date_format),
                        'total_visits': int(row['total']),
                        'medical_visits': int(row.get('medical', 0)), 
                        'dental_visits': int(row.get('dental', 0)),
                        'growth_percentage': f"{float(row.get('growth', 0)):.2f}%"
                    })
            else:
                # Return empty intervals for the entire range
                longitudinal_trends = []
                for timestamp in full_range:
                    longitudinal_trends.append({
                        'period': timestamp.strftime(date_format),
                        'total_visits': 0,
                        'medical_visits': 0,
                        'dental_visits': 0,
                        'growth_percentage': "0.00%"
                    })
                
            # Average Daily Calculation
            avg_daily = round(total_visits / max(days_diff, 1), 2)
            peak_day_visits = 0
            if m_data or d_data:
                df_day = pd.DataFrame(m_data + d_data)
                df_day['date'] = pd.to_datetime(df_day['date'])
                df_day['day'] = df_day['date'].dt.date
                peak_day_visits = int(df_day.groupby('day').size().max())
                
            return {
                'total_visits': total_visits, 
                'total_medical': total_medical,
                'total_dental': total_dental,
                'avg_daily_visits': avg_daily, 
                'peak_day_visits': peak_day_visits,
                'longitudinal_trends': longitudinal_trends, 
                'monthly': longitudinal_trends,  # Backward compatibility for frontend charts
                'summary_by_type': {'Medical': total_medical, 'Dental': total_dental},
                'granularity': freq
            }
        except Exception as e:
            logger.error(f"Error in get_visit_trends_data: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {'error': str(e), 'total_visits': 0, 'monthly': []}

    @staticmethod
    def get_treatment_outcomes_data(date_start=None, date_end=None, filters=None):
        try:
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            queryset = MedicalRecord.objects.filter(visit_date__range=(date_start, date_end))
            
            if filters:
                if filters.get('gender'):
                    queryset = queryset.filter(patient__gender=filters['gender'])
                if filters.get('role'):
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles: queryset = queryset.filter(patient__user__role__in=roles)
                if filters.get('year_level'):
                    levels = filters['year_level']
                    if isinstance(levels, str): levels = levels.split(',')
                    if levels: queryset = queryset.filter(patient__user__year_level__in=levels)

                if filters.get('diagnosis'):
                    diags = filters['diagnosis']
                    if isinstance(diags, list) and diags:
                        queryset = queryset.filter(diagnosis__in=diags)
                if filters.get('school'):
                    schools = filters['school']
                    if isinstance(schools, str): schools = schools.split(',')
                    if schools: queryset = queryset.filter(patient__user__school__in=schools)
                if filters.get('course'):
                    courses = filters['course']
                    if isinstance(courses, str): courses = courses.split(',')
                    if courses: queryset = queryset.filter(patient__user__course__in=courses)
                if filters.get('campus'):
                    campuses = filters['campus']
                    if isinstance(campuses, str): campuses = campuses.split(',')
                    if campuses:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(c in info['campus'] for c in campuses)]
                        queryset = queryset.filter(patient__user__course__in=course_ids)
                if filters.get('providers'):
                    providers = filters['providers']
                    if isinstance(providers, list) and providers:
                        queryset = queryset.filter(created_by_id__in=providers)

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
                'percentage': round((d['count'] / total_cases) * 100, 2)
            } for d in diagnoses]
            
            # Treatment Distribution
            treatments = queryset.values('treatment').annotate(count=Count('id')).order_by('-count')[:10]
            treatment_distribution = [{
                'name': t['treatment'], 
                'count': t['count'],
                'percentage': round((t['count'] / total_cases) * 100, 2)
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
            filters = filters or {}
            date_start = date_start or (timezone.now() - timedelta(days=30))
            date_end = date_end or timezone.now()
            
            # Use AuditLog for exhaustive mutation tracking
            audit_qs = AuditLog.objects.filter(timestamp__range=(date_start, date_end)).exclude(
                target_model__icontains='Notification'
            ).exclude(
                target_model__in=['NotificationLog', 'NotificationCampaign', 'NotificationTemplate']
            )
            
            if filters.get('user_id'):
                audit_qs = audit_qs.filter(actor_id=filters['user_id'])
            
            if filters.get('action_type'):
                audit_qs = audit_qs.filter(action_type=filters['action_type'])

            total_actions = audit_qs.count()
            
            system_log = []
            for entry in audit_qs.select_related('actor').order_by('-timestamp')[:100]:
                system_log.append({
                    'timestamp': entry.timestamp.strftime('%Y-%m-%d %H:%M'),
                    'user': entry.actor_email or (entry.actor.get_full_name() if entry.actor else 'Unknown'),
                    'role': entry.actor_role or (entry.actor.role if entry.actor else 'N/A'),
                    'action': entry.get_action_type_display(),
                    'target': entry.target_model,
                    'details': entry.changes_summary.get('description', 'N/A') if isinstance(entry.changes_summary, dict) else 'N/A'
                })
            
            # Apply customization
            system_log = ReportDataService._apply_customization(system_log, filters)
            
            # Calculate peak hours from audit log timestamps
            peak_hours = []
            if audit_qs.exists():
                hour_counts = {h: 0 for h in range(24)}
                for entry in audit_qs:
                    hour = entry.timestamp.hour
                    hour_counts[hour] += 1
                peak_hours = [{'hour': h, 'count': c} for h, c in hour_counts.items()]

            return {
                'total_actions': total_actions,
                'system_log': system_log,
                'peak_hours': peak_hours,
                'active_admins': audit_qs.values('actor').distinct().count()
            }
        except Exception as e: 
            logger.error(f"Error in get_user_activity_data: {e}")
            return {'error': str(e), 'total_actions': 0, 'system_log': []}

    @staticmethod
    def get_health_metrics_data(date_start=None, date_end=None, filters=None):
        try:
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
                {'metric_name': 'Average Age', 'value': round(avg_age, 2), 'unit': 'Years'},
                {'metric_name': 'System Alerts', 'value': health_alerts, 'unit': 'Notifications'}
            ]
            
            # Apply customization
            metrics = ReportDataService._apply_customization(metrics, filters or {})

            return {
                'total_population': total_pop, 
                'age_average': round(avg_age, 2), 
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
                        rating_val = filters['rating']
                        if isinstance(rating_val, list):
                            ratings = [int(r) for r in rating_val]
                        else:
                            ratings = [int(r) for r in str(rating_val).split(',')]
                        if ratings: feedback_qs = feedback_qs.filter(rating__in=ratings)
                    except ValueError:
                        pass

                if filters.get('role'):
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles: feedback_qs = feedback_qs.filter(patient__user__role__in=roles)

                if filters.get('campus'):
                    campus_names = filters['campus']
                    if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]
                    if campus_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items()
                                     if any(c in info['campus'] for c in campus_names)]
                        feedback_qs = feedback_qs.filter(patient__user__course__in=course_ids)

                if filters.get('school'):
                    school_names = filters['school']
                    if isinstance(school_names, str): school_names = [s.strip() for s in school_names.split(',')]
                    if school_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items()
                                     if any(s in info['school'] for s in school_names)]
                        feedback_qs = feedback_qs.filter(patient__user__course__in=course_ids)

                if filters.get('course'):
                    course_list = filters['course']
                    if isinstance(course_list, str): course_list = [c.strip() for c in course_list.split(',')]
                    if course_list: feedback_qs = feedback_qs.filter(patient__user__course__in=course_list)

                if filters.get('year_level'):
                    level_list = filters['year_level']
                    if isinstance(level_list, str): level_list = [l.strip() for l in level_list.split(',')]
                    if level_list: feedback_qs = feedback_qs.filter(patient__user__year_level__in=level_list)

                if filters.get('recommend'):
                    recommend = filters['recommend']
                    if isinstance(recommend, list):
                        feedback_qs = feedback_qs.filter(recommend__in=recommend)
                    else:
                        feedback_qs = feedback_qs.filter(recommend=recommend)

                if filters.get('courteous'):
                    courteous = filters['courteous']
                    if isinstance(courteous, list):
                        feedback_qs = feedback_qs.filter(courteous__in=courteous)
                    else:
                        feedback_qs = feedback_qs.filter(courteous=courteous)

                if filters.get('visit_type') or filters.get('service_type'):
                    v_type = filters.get('visit_type') or filters.get('service_type')
                    if isinstance(v_type, list): v_type = v_type[0]
                    if isinstance(v_type, str):
                        v_type = v_type.upper()
                        if v_type == 'MEDICAL':
                            feedback_qs = feedback_qs.filter(medical_record__isnull=False)
                        elif v_type == 'DENTAL':
                            feedback_qs = feedback_qs.filter(dental_record__isnull=False)

                if filters.get('search'):
                    from django.db.models import Q
                    feedback_qs = feedback_qs.filter(
                        Q(comments__icontains=filters['search']) | 
                        Q(improvement__icontains=filters['search'])
                    )
            
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
                    'suggestions': f.improvement,
                    'recommend': f.recommend,
                    'courteous': f.courteous,
                    'created_at': f.created_at.strftime('%Y-%m-%d')
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
                    'percentage': round((count / total * 100), 2)
                })

            return {
                'total_responses': total, 
                'total_visits': total_visits,
                'student_count': student_count,
                'staff_count': staff_count,
                'student_percentage': round(float(student_pct), 2),
                'response_rate': round(float(response_rate), 2),
                'avg_rating': round(float(avg), 2), 
                'satisfaction_score': round(float(avg/5*100), 2),
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

            campaign_titles = filters.get('campaign_titles')
            if campaign_titles:
                if isinstance(campaign_titles, str): campaign_titles = campaign_titles.split(',')
                if isinstance(campaign_titles, list) and campaign_titles:
                    queryset = queryset.filter(title__in=campaign_titles)
            search_query = filters.get('search')
            if search_query:
                queryset = queryset.filter(Q(title__icontains=search_query) | Q(content__icontains=search_query))

            campaign_type = filters.get('campaign_type') or filters.get('category')
            if campaign_type:
                queryset = queryset.filter(campaign_type=campaign_type)

            min_views = filters.get('min_views')
            if min_views:
                try:
                    queryset = queryset.filter(view_count__gte=int(min_views))
                except ValueError:
                    pass

            if filters.get('campus'):
                campus_names = filters['campus']
                if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]
                # Filter campaigns that received feedback from this campus
                queryset = queryset.filter(feedback__user__course__in=[cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(c in info['campus'] for c in campus_names)]).distinct()

            if filters.get('role'):
                roles = filters['role']
                if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                queryset = queryset.filter(feedback__user__role__in=roles).distinct()

            if filters.get('year_level'):
                levels = filters['year_level']
                if isinstance(levels, str): levels = levels.split(',')
                queryset = queryset.filter(feedback__user__year_level__in=levels).distinct()
            
            # Date range filter (only if not filtering by specific IDs)
            if not campaign_ids:
                queryset = queryset.filter(created_at__range=(date_start, date_end))
            
            # 1. Category Distribution
            type_counts = queryset.values('campaign_type').annotate(count=Count('id'))
            type_distribution = [{'type': item['campaign_type'], 'count': item['count']} for item in type_counts]

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
                    'id': c.id,
                    'title': c.title, 
                    'view_count': c.view_count,
                    'engagement_count': getattr(c, 'engagement_count', 0),
                    'campaign_type': c.get_campaign_type_display(),
                    'priority': c.get_priority_display(),
                    'created_by_name': c.created_by.get_full_name() if c.created_by else 'System',
                    'created_at': c.created_at.strftime('%Y-%m-%d'),
                    'updated_at': c.updated_at.strftime('%Y-%m-%d'),
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
                    'avg_views': round(with_pubmat['views'] / with_pubmat['count'], 2)
                })
            if without_pubmat['count'] > 0:
                asset_effectiveness.append({
                    'asset_type': 'Without PubMat',
                    'campaigns': without_pubmat['count'],
                    'avg_views': round(without_pubmat['views'] / without_pubmat['count'], 2)
                })
            if with_banner['count'] > 0:
                asset_effectiveness.append({
                    'asset_type': 'With Banner',
                    'campaigns': with_banner['count'],
                    'avg_views': round(with_banner['views'] / with_banner['count'], 2)
                })
                
            # Apply customization (field selection and grouping)
            perf = ReportDataService._apply_customization(perf, filters)

            return {
                'total_views': total_views,
                'avg_views_per_campaign': round(avg_views, 2), 
                'campaign_performance': perf,
                'asset_effectiveness': asset_effectiveness,
                'category_distribution': type_distribution
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
                if filters.get('diagnosis_category') or filters.get('diagnosis'):
                    diag_list = filters.get('diagnosis_category') or filters.get('diagnosis')
                    if isinstance(diag_list, str): diag_list = [d.strip() for d in diag_list.split(',')]
                    if diag_list: records = records.filter(diagnosis__in=diag_list)

                if filters.get('role'):
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles: records = records.filter(patient__user__role__in=roles)

                if filters.get('search'):
                    records = records.filter(diagnosis__icontains=filters['search'])

                # Campus filter - Map to course IDs
                if filters.get('campus'):
                    campus_names = filters['campus']
                    if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]
                    if campus_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                     if any(c in info['campus'] for c in campus_names)]
                        records = records.filter(patient__user__course__in=course_ids)

                # School filter - Map to course IDs
                if filters.get('school'):
                    school_names = filters['school']
                    if isinstance(school_names, str): school_names = [s.strip() for s in school_names.split(',')]
                    if school_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                     if any(s in info['school'] for s in school_names)]
                        records = records.filter(patient__user__course__in=course_ids)

                if filters.get('course'):
                    course_list = filters['course']
                    if isinstance(course_list, str): course_list = [c.strip() for c in course_list.split(',')]
                    if course_list: records = records.filter(patient__user__course__in=course_list)

                if filters.get('year_level'):
                    level_list = filters['year_level']
                    if isinstance(level_list, str): level_list = [l.strip() for l in level_list.split(',')]
                    if level_list: records = records.filter(patient__user__year_level__in=level_list)
            
            # Calculate real avg age
            patients = Patient.objects.filter(medical_records__in=records).distinct()
            
            # Gender distribution
            gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other', '1': 'Male', '2': 'Female'}
            g_dist = {}
            for p in patients:
                g = gender_map.get(p.gender, 'Unspecified')
                g_dist[g] = g_dist.get(g, 0) + 1
            
            # Role distribution
            r_dist = {'STUDENT': 0, 'FACULTY': 0}
            for p in patients:
                if p.user:
                    r = p.user.role
                    r_dist[r] = r_dist.get(r, 0) + 1

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
                    'percentage': round((item['count'] / max(records.count(), 1)) * 100, 2),
                    'avg_age': round(diag_avg_age, 2)
                })
            
            # Apply customization (field selection and grouping)
            diag = ReportDataService._apply_customization(diag, filters or {})

            return {
               'total_patients': patients.count(),
               'total_consultations': records.count(),
               'avg_age': round(float(avg_age), 2),
               'top_diagnoses': diag,
               'vitals_summary': vitals,
               'gender_distribution': [{'name': k, 'count': v} for k, v in g_dist.items() if v > 0],
               'role_distribution': [{'name': k.title(), 'count': v} for k, v in r_dist.items() if v > 0]
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
                    proc_list = filters['procedure']
                    if isinstance(proc_list, str): proc_list = [p.strip() for p in proc_list.split(',')]
                    if proc_list:
                        # Handle both display names and database values
                        proc_map_rev = {v: k for k, v in dict(DentalRecord.PROCEDURE_CHOICES).items()}
                        final_procs = []
                        for p in proc_list:
                            if p in proc_map_rev:
                                final_procs.append(proc_map_rev[p])
                            else:
                                final_procs.append(p)
                        records = records.filter(procedure_performed__in=final_procs)

                if filters.get('role'):
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles: records = records.filter(patient__user__role__in=roles)

                # Campus filter - Map to course IDs
                if filters.get('campus'):
                    campus_names = filters['campus']
                    if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]
                    if campus_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                     if any(c in info['campus'] for c in campus_names)]
                        records = records.filter(patient__user__course__in=course_ids)

                # School filter - Map to course IDs
                if filters.get('school'):
                    school_names = filters['school']
                    if isinstance(school_names, str): school_names = [s.strip() for s in school_names.split(',')]
                    if school_names:
                        course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() 
                                     if any(s in info['school'] for s in school_names)]
                        records = records.filter(patient__user__course__in=course_ids)

                if filters.get('course'):
                    course_list = filters['course']
                    if isinstance(course_list, str): course_list = [c.strip() for c in course_list.split(',')]
                    if course_list: records = records.filter(patient__user__course__in=course_list)

                if filters.get('year_level'):
                    level_list = filters['year_level']
                    if isinstance(level_list, str): level_list = [l.strip() for l in level_list.split(',')]
                    if level_list: records = records.filter(patient__user__year_level__in=level_list)

                if filters.get('priority'):
                    priorities = filters['priority']
                    if isinstance(priorities, str): priorities = [p.strip() for p in priorities.split(',')]
                    if priorities: records = records.filter(priority__in=priorities)

                if filters.get('search'):
                    records = records.filter(procedure_performed__icontains=filters['search'])
            
            # Calculate distributions
            patients = Patient.objects.filter(dental_records__in=records).distinct()
            
            # Gender distribution - handle legacy numeric values ('1', '2')
            gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other', '1': 'Male', '2': 'Female'}
            g_dist = {}
            for p in patients:
                g = gender_map.get(p.gender, 'Unspecified')
                g_dist[g] = g_dist.get(g, 0) + 1
            
            # Role distribution
            r_dist = {'STUDENT': 0, 'FACULTY': 0}
            for p in patients:
                if p.user:
                    r = p.user.role
                    r_dist[r] = r_dist.get(r, 0) + 1

            total_records = records.count()

            if total_records == 0:
                return {
                    'total_records': 0, 'common_procedures': [], 
                    'gender_distribution': [], 'role_distribution': []
                }
            
            # Common procedures with display labels
            proc_counts = records.values('procedure_performed').annotate(count=Count('id')).order_by('-count')
            proc_map = dict(DentalRecord.PROCEDURE_CHOICES)
            common_procedures = []

            for item in proc_counts:
                # Get patients for this specific procedure for demographic context
                proc_patients = Patient.objects.filter(
                    dental_records__in=records.filter(procedure_performed=item['procedure_performed'])
                ).distinct()
                proc_ages = [p.age for p in proc_patients if p.age is not None]
                proc_avg_age = sum(proc_ages) / len(proc_ages) if proc_ages else 0

                common_procedures.append({
                    'name': proc_map.get(item['procedure_performed'], item['procedure_performed']),
                    'count': item['count'],
                    'percentage': round((item['count'] / total_records) * 100, 2),
                    'avg_age': round(proc_avg_age, 2)
                })

            # Preventive care calculation (Cleaning, Prophylaxis, Fluoride, Sealant)
            preventive_types = ['CLEANING', 'PROPHYLAXIS', 'FLUORIDE', 'SEALANT']
            preventive_count = records.filter(procedure_performed__in=preventive_types).count()
            preventive_rate = (preventive_count / total_records) * 100 if total_records > 0 else 0

            # Apply customization (field selection and grouping)
            common_procedures = ReportDataService._apply_customization(common_procedures, filters or {})

            return {
                'total_dental_visits': total_records,
                'preventive_care_rate': f"{round(preventive_rate, 2)}%",
                'common_procedures': common_procedures,
                'gender_distribution': [{'name': k, 'count': v} for k, v in g_dist.items() if v > 0],
                'role_distribution': [{'name': k.title(), 'count': v} for k, v in r_dist.items() if v > 0]
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
        return [{'hour': h, 'count': c} for h, c in hours.items()]
        
    @staticmethod
    def _get_college_participation(patients):
        """Helper to aggregate patients by college/school using ACADEMIC_DIRECTORY_MAP"""
        colleges = {}
        for obj in patients:
            # Handle both Patient and User objects
            user = obj if isinstance(obj, User) else getattr(obj, 'user', None)
            college = "Other"
            
            if user:
                if user.role == 'FACULTY':
                    college = "Faculty"
                elif user.course:
                    course_id = str(user.course)
                    if course_id in ACADEMIC_DIRECTORY_MAP:
                        college = ACADEMIC_DIRECTORY_MAP[course_id]['school']
                    elif user.school:
                        college = user.school
                elif user.department:
                     college = user.department

            colleges[college] = colleges.get(college, 0) + 1

        # Return both 'name' and 'college' for frontend compatibility
        return sorted([{'name': k, 'college': k, 'count': v} for k, v in colleges.items()], key=lambda x: x['count'], reverse=True)

    @staticmethod
    def _get_course_distribution(patients):
        """Helper to aggregate patients by specific course/program"""
        courses = {}
        for obj in patients:
            # Handle both Patient and User objects
            user = obj if isinstance(obj, User) else getattr(obj, 'user', None)
            course = None
            
            if user:
                if user.role == 'FACULTY':
                    course = "Faculty"
                elif user.course:
                    course_id = str(user.course)
                    course = PROGRAMS_CHOICES.get(course_id, f"Program {course_id}")
            
            if course:
                courses[course] = courses.get(course, 0) + 1
        
        return sorted([{'name': k, 'count': v} for k, v in courses.items()], key=lambda x: x['count'], reverse=True)

    @staticmethod
    def _get_role_distribution(patients):
        """Helper to aggregate patients by simplified role (Student vs Faculty)"""
        roles = {'STUDENT': 0, 'FACULTY': 0}
        for obj in patients:
            # Handle both Patient and User objects
            user = obj if isinstance(obj, User) else getattr(obj, 'user', None)
            if user:
                role = user.role
                if role == 'STUDENT':
                    roles['STUDENT'] += 1
                elif role == 'FACULTY':
                    roles['FACULTY'] += 1
        return [{'name': k.title(), 'role': k, 'count': v} for k, v in roles.items()]
    @staticmethod
    def get_certification_analytics(date_start=None, date_end=None, filters=None):
        """Get medical certificate analytics for health clearance process insights"""
        try:
            from medical_certificates.models import MedicalCertificate
            filters = filters or {}
            
            # Standardize dates if missing
            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()
            
            # Base Queryset
            certs = MedicalCertificate.objects.filter(created_at__range=(date_start, date_end))

            # Apply standard filters via patient join
            if filters.get('campus') or filters.get('school') or filters.get('course') or filters.get('year_level') or filters.get('role'):
                if filters.get('role'):
                    roles = filters['role']
                    if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                    if roles: certs = certs.filter(patient__user__role__in=roles)
                if filters.get('campus'):
                    campus_names = [c.strip() for c in filters['campus'].split(',')] if isinstance(filters['campus'], str) else filters['campus']
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(c in info['campus'] for c in campus_names)]
                    certs = certs.filter(patient__user__course__in=course_ids)
                if filters.get('school'):
                    school_names = [s.strip() for s in filters['school'].split(',')] if isinstance(filters['school'], str) else filters['school']
                    course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(s in info['school'] for s in school_names)]
                    certs = certs.filter(patient__user__course__in=course_ids)
                if filters.get('course'):
                    courses = [c.strip() for c in filters['course'].split(',')] if isinstance(filters['course'], str) else filters['course']
                    certs = certs.filter(patient__user__course__in=courses)
                if filters.get('year_level'):
                    levels = [l.strip() for l in filters['year_level'].split(',')] if isinstance(filters['year_level'], str) else filters['year_level']
                    certs = certs.filter(patient__user__year_level__in=levels)

            if filters.get('search'):
                from django.db.models import Q
                certs = certs.filter(
                    Q(patient__first_name__icontains=filters['search']) |
                    Q(patient__last_name__icontains=filters['search']) |
                    Q(patient__user__id_number__icontains=filters['search']) |
                    Q(template__name__icontains=filters['search'])
                )

            # Domain specific filters
            if filters.get('fitness_status'):
                certs = certs.filter(fitness_status=filters['fitness_status'])
            if filters.get('issuance_status'):
                certs = certs.filter(issuance_status=filters['issuance_status'])
            if filters.get('template'):
                certs = certs.filter(template__name=filters['template'])
            if filters.get('doctor'):
                doctor_name = filters['doctor']
                certs = certs.filter(issuing_doctor__last_name=doctor_name)

            # 1. Fitness Distribution
            fitness_counts = certs.values('fitness_status').annotate(count=Count('id'))
            fitness_map = dict(MedicalCertificate.FITNESS_STATUS_CHOICES)
            fitness_distribution = [
                {'status': fitness_map.get(item['fitness_status'], item['fitness_status']), 'count': item['count']}
                for item in fitness_counts
            ]

            # 2. Purpose Distribution (using 'diagnosis' field which represents Purpose/Requirement)
            raw_purposes = certs.values(name=F('diagnosis')).annotate(count=Count('id')).order_by('-count')
            purpose_distribution = []
            for item in raw_purposes:
                purpose_name = item['name'].strip() if item['name'] else 'Unspecified Purpose'
                purpose_distribution.append({'name': purpose_name, 'count': item['count']})

            # 3. Issuance Status Distribution
            issuance_counts = certs.values('issuance_status').annotate(count=Count('id'))
            issuance_map = dict(MedicalCertificate.ISSUANCE_STATUS_CHOICES)
            issuance_distribution = [
                {'status': issuance_map.get(item['issuance_status'], item['issuance_status']), 'count': item['count']}
                for item in issuance_counts
            ]

            # 4. Average Turnaround Time (issued_at - created_at)
            issued_certs = certs.filter(issuance_status='issued', issued_at__isnull=False)
            avg_turnaround = 0
            if issued_certs.exists():
                durations = []
                for c in issued_certs.only('created_at', 'issued_at'):
                    if c.issued_at and c.created_at:
                        diff = c.issued_at - c.created_at
                        durations.append(diff.total_seconds() / 3600)
                if durations:
                    avg_turnaround = sum(durations) / len(durations)

            # 5. Doctor Workload
            doctor_workload = list(certs.filter(issuing_doctor__isnull=False)
                                  .values(name=F('issuing_doctor__last_name'))
                                  .annotate(count=Count('id')).order_by('-count'))

            return {
                'total_certificates': certs.count(),
                'fitness_distribution': fitness_distribution,
                'purpose_distribution': purpose_distribution,
                'avg_turnaround_hours': round(avg_turnaround, 2),
                'doctor_workload': doctor_workload,
                'issuance_status_distribution': issuance_distribution
            }
        except Exception as e:
            logger.error(f"Error in get_certification_analytics: {str(e)}")
            return {'error': str(e)}
    @staticmethod
    def get_certification_summary_data(date_start=None, date_end=None, filters=None):
        """Standardized data collection for tabular certification exports"""
        try:
            from medical_certificates.models import MedicalCertificate
            filters = filters or {}
            
            queryset = MedicalCertificate.objects.select_related('patient__user', 'template', 'issuing_doctor').filter(created_at__range=(date_start, date_end))
            
            # Apply standard filters
            if filters.get('role'):
                roles = filters['role']
                if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]
                if roles: queryset = queryset.filter(patient__user__role__in=roles)
            if filters.get('campus'):
                campus_names = [c.strip() for c in filters['campus'].split(',')] if isinstance(filters['campus'], str) else filters['campus']
                course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(c in info['campus'] for c in campus_names)]
                queryset = queryset.filter(patient__user__course__in=course_ids)
            if filters.get('school'):
                school_names = [s.strip() for s in filters['school'].split(',')] if isinstance(filters['school'], str) else filters['school']
                course_ids = [cid for cid, info in ACADEMIC_DIRECTORY_MAP.items() if any(s in info['school'] for s in school_names)]
                queryset = queryset.filter(patient__user__course__in=course_ids)
            if filters.get('course'):
                courses = [c.strip() for c in filters['course'].split(',')] if isinstance(filters['course'], str) else filters['course']
                queryset = queryset.filter(patient__user__course__in=courses)
            if filters.get('year_level'):
                levels = [l.strip() for l in filters['year_level'].split(',')] if isinstance(filters['year_level'], str) else filters['year_level']
                queryset = queryset.filter(patient__user__year_level__in=levels)

            # Domain specific filters
            if filters.get('fitness_status'):
                queryset = queryset.filter(fitness_status=filters['fitness_status'])
            if filters.get('issuance_status'):
                queryset = queryset.filter(issuance_status=filters['issuance_status'])
            if filters.get('template'):
                queryset = queryset.filter(template__name=filters['template'])
            if filters.get('doctor'):
                queryset = queryset.filter(issuing_doctor__last_name=filters['doctor'])

            if filters.get('search'):
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(patient__first_name__icontains=filters['search']) |
                    Q(patient__last_name__icontains=filters['search']) |
                    Q(patient__user__id_number__icontains=filters['search']) |
                    Q(template__name__icontains=filters['search'])
                )
            
            results = []
            for c in queryset.order_by('-created_at'):
                results.append({
                    'id': c.id,
                    'patient': f"{c.patient.first_name} {c.patient.last_name}",
                    'usc_id': getattr(c.patient.user, 'id_number', 'N/A'),
                    'template': c.template.name,
                    'fitness': c.get_fitness_status_display(),
                    'status': c.get_issuance_status_display(),
                    'doctor': f"Dr. {c.issuing_doctor.last_name}" if c.issuing_doctor else "N/A",
                    'date': c.created_at.strftime('%Y-%m-%d')
                })
            
            # Get enriched analytics once safely
            try:
                analytics = ReportDataService.get_certification_analytics(date_start, date_end, filters)
            except Exception as ae:
                logger.warning(f"Secondary analytics failed in summary: {ae}")
                analytics = {}
            
            return {
                'total_certificates': analytics.get('total_certificates', queryset.count()),
                'avg_turnaround_hours': analytics.get('avg_turnaround_hours', 0),
                'fitness_distribution': analytics.get('fitness_distribution', []),
                'purpose_distribution': analytics.get('purpose_distribution', []),
                'issuance_status_distribution': analytics.get('issuance_status_distribution', []),
                'doctor_workload': analytics.get('doctor_workload', []),
                'certificates_log': results
            }
        except Exception as e:
            logger.error(f"Error in get_certification_summary_data: {str(e)}")
            return {'error': str(e)}

    @staticmethod
    def get_comprehensive_system_analytics(date_start=None, date_end=None, filters=None):
        """Aggregate data for system-wide dashboard visualizations"""
        try:
            filters = filters or {}

            # Prioritize explicit dates (especially for 'custom' range)
            if filters.get('date_range') == 'custom' and date_start and date_end:
                pass # Use provided dates
            elif filters.get('date_range'):
                range_type = filters['date_range']
                now = timezone.now()
                if range_type == '7days':
                    date_start = now - timedelta(days=7)
                elif range_type == '30days':
                    date_start = now - timedelta(days=30)
                elif range_type == '6months':
                    date_start = now - timedelta(days=180)
                elif range_type == 'all':
                    # Full Academic History starts from 2024 institutional rollout
                    date_start = timezone.make_aware(datetime(2024, 1, 1, 0, 0, 0))
                    # End date is always current for full history
                    date_end = now
                    logger.info(f"System Analytics: Applied Full History range ({date_start} to {date_end})")
                
                if range_type != 'all':
                    date_end = now

            date_start = date_start or (timezone.now() - timedelta(days=365))
            date_end = date_end or timezone.now()

            # Ensure awareness and normalize to full day coverage
            current_tz = timezone.get_current_timezone()
            if hasattr(date_start, 'tzinfo') and date_start.tzinfo is None:
                date_start = timezone.make_aware(date_start)
            elif hasattr(date_start, 'astimezone'):
                date_start = date_start.astimezone(current_tz)

            if hasattr(date_end, 'tzinfo') and date_end.tzinfo is None:
                date_end = timezone.make_aware(date_end)
            elif hasattr(date_end, 'astimezone'):
                date_end = date_end.astimezone(current_tz)

            if hasattr(date_start, 'replace'):
                date_start = date_start.replace(hour=0, minute=0, second=0, microsecond=0)
            if hasattr(date_end, 'replace'):
                date_end = date_end.replace(hour=23, minute=59, second=59, microsecond=999999)

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

                # Standardized service/visit type filtering
                s_type = filters.get('service_type') or filters.get('visit_type')
                if s_type:
                    s_type = s_type.upper()
                    if s_type == 'MEDICAL':
                        dental_records = dental_records.none()
                    elif s_type == 'DENTAL':
                        medical_records = medical_records.none()

                if filters.get('search'):
                    medical_records = medical_records.filter(diagnosis__icontains=filters['search'])
                    dental_records = dental_records.filter(procedure_performed__icontains=filters['search'])

                # Role filter
                if filters.get('role'):
                    roles = filters['role'].split(',')
                    medical_records = medical_records.filter(patient__user__role__in=roles)
                    dental_records = dental_records.filter(patient__user__role__in=roles)


            trends = ReportDataService.get_visit_trends_data(date_start, date_end, filters)

            medical_count = medical_records.count()
            dental_count = dental_records.count()

            medical_stats = ReportDataService.get_medical_statistics_data(date_start, date_end, filters)
            dental_stats = ReportDataService.get_dental_statistics_data(date_start, date_end, filters)

            feedback = ReportDataService.get_feedback_analysis_data(date_start, date_end, filters)
            certifications = ReportDataService.get_certification_summary_data(date_start, date_end, filters)
            campaigns = ReportDataService.get_campaign_performance_data(date_start, date_end, filters)

            # Get demographic stats based on requested scope
            patient_scope = filters.get('patient_scope', 'active_with_records')
            
            # Delegate demographic collection to specialized method for consistency and filter support
            demographics = ReportDataService.get_patient_summary_data(date_start, date_end, filters)
            total_active_count = demographics.get('total_patients', 0)
            college_participation = demographics.get('college_participation', [])
            course_distribution = demographics.get('course_distribution', [])
            role_distribution = demographics.get('role_distribution', {})
            year_level_distribution = demographics.get('year_level_distribution', [])

            # Calculate Peak Hours (Always based on records in timeline)
            peak_hours = ReportDataService._get_peak_hours(list(medical_records) + list(dental_records))

            return {
                'demographics': {
                    'colleges': college_participation,
                    'courses': course_distribution,
                    'roles': role_distribution,
                    'year_levels': year_level_distribution,
                    'total_active': total_active_count
                },
                'visits': {
                    'monthly': trends.get('monthly', []),
                    'types': {'medical': medical_count, 'dental': dental_count},
                    'total': trends.get('total_visits', 0),
                    'granularity': trends.get('granularity')
                },
                'clinical': {
                    'top_diagnoses': medical_stats.get('top_diagnoses', []),
                    'top_procedures': dental_stats.get('common_procedures', [])
                },
                'certifications': certifications,
                'satisfaction': {
                    'distribution': feedback.get('rating_distribution', []),
                    'average': feedback.get('avg_rating', 0),
                    'metrics': feedback.get('service_metrics', {}),
                    'raw_comments': feedback.get('raw_feedback', [])
                },
                'operations': {
                    'peak_hours': peak_hours
                },
                'campaign_performance': campaigns.get('campaign_performance', []),
                'period': {
                    'start': date_start.strftime('%Y-%m-%d'),
                    'end': date_end.strftime('%Y-%m-%d')
                }
            }
        except Exception as e:
            logger.error(f"Error in get_comprehensive_system_analytics: {str(e)}")
            return {'error': str(e)}

from reportlab.lib.enums import TA_CENTER, TA_LEFT

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
                    
                    # Pre-fetch QuickChart images as base64 to prevent xhtml2pdf network/SSL crashes
                    if context.get('visual_charts'):
                        import requests
                        import base64
                        charts_b64 = context.get('charts_base64', [])
                        if not isinstance(charts_b64, list): charts_b64 = []
                        
                        for url in context['visual_charts']:
                            try:
                                resp = requests.get(url, timeout=10)
                                if resp.status_code == 200:
                                    b64 = base64.b64encode(resp.content).decode('utf-8')
                                    charts_b64.append(f"data:image/png;base64,{b64}")
                            except Exception as ce:
                                logger.warning(f"Chart fetch failed: {ce}")
                        context['charts_base64'] = charts_b64
                        context['visual_charts'] = []

                    html = Template(template_content).render(Context(context))
                    buffer = BytesIO()
                    pisa_status = pisa.CreatePDF(html, dest=buffer)
                    if not pisa_status.err:
                        pdf_data = buffer.getvalue()
                        if pdf_data and len(pdf_data) > 100: 
                            return pdf_data
                    
                    logger.error(f"xhtml2pdf rendering failed: {pisa_status.err}")
                    for log in pisa_status.logs:
                        logger.error(f"xhtml2pdf log: {log}")
                except Exception as e:
                    logger.error(f"xhtml2pdf engine critical failure: {str(e)}")
                    import traceback
                    logger.error(traceback.format_exc())

            # 2. Specialized ReportLab Generators (Keep only for complex layouts like Timelines)
            buffer = BytesIO()
            
            if report_type == 'HEALTH_HISTORY':
                # UNIFIED HISTORY SPECIALIZED REPORT (Keep ReportLab for landscape timeline)
                patient_info = {
                    'name': report_data.get('patient_name', 'N/A'),
                    'usc_id': report_data.get('usc_id', 'N/A')
                }
                generator = USCUnifiedHistoryReport(buffer, user, patient_info)
                generator.build(report_data.get('history', []), report_data.get('breakdown', {}))
                return buffer.getvalue()
            
            # If we reached here, the HTML engine failed and no specialized generator is available.
            # We return None to let the caller handle the failure (e.g., return an error message).
            logger.error(f"PDF export failed for report type {report_type}: HTML engine failed and no fallback available.")
            return None
            
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
                    ['Applied Filters', ", ".join(report_data.get('applied_filters', ["None"]))],
                    ['System', 'USC Patient Information System']
                ]
                pd.DataFrame(info_data, columns=['Report Metadata', 'Value']).to_excel(writer, sheet_name='Report Info', index=False)

                # 2. Summary Metrics (Align with PDF Executive Summary)
                summary_items = []; list_keys = []
                skip_keys = ['report_title', 'date_range_start', 'date_range_end', 'generated_at', 'system_name', 'report_date', 'report_type', 'visual_charts', 'charts_base64', 'visual_analytics']
                
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
            writer.writerow([f"REPORT: {title.upper()}"])
            writer.writerow([f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}"])
            writer.writerow([f"Filters: {', '.join(report_data.get('applied_filters', ['None']))}"])
            writer.writerow([])
            list_keys = []; writer.writerow(["SUMMARY OVERVIEW"])
            skip_keys = ['report_title', 'date_range_start', 'date_range_end', 'generated_at', 'system_name', 'report_date', 'report_type', 'visual_charts', 'charts_base64', 'visual_analytics']
            
            for k, v in report_data.items():
                if k in skip_keys: continue
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
            <title>{{{{ title }}}}</title>
            <meta name="engine" content="xhtml2pdf-engine-verification">
            <style>
                @page {{
                    size: A4 landscape;
                    margin: 1.0cm;
                }}
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #1e293b; font-size: 9pt; }}

                .usc-header {{
                    text-align: center;
                    border-bottom: 3px solid #003366;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                }}
                .usc-logo-text {{ font-size: 18pt; font-weight: bold; color: #003366; margin: 0; text-transform: uppercase; }}
                .usc-sub-text {{ font-size: 10pt; color: #64748b; margin: 5px 0 0 0; font-weight: bold; }}

                .report-title {{ text-align: center; font-size: 14pt; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }}

                .section {{ margin-bottom: 20px; }}
                .visual-section {{ page-break-before: always; margin-bottom: 20px; }}
                .section-title {{
                    background-color: #f1f5f9;
                    color: #0f172a;
                    font-size: 10pt;
                    font-weight: bold;
                    padding: 6px 10px;
                    border-left: 5px solid #003366;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }}

                .chart-container {{ text-align: center; margin: 15px auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa; display: block; width: 95%; max-width: 800px; }}

                .data-table {{ width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; }}
                .data-table th {{ background-color: #003366; color: #ffffff; padding: 6px; text-align: left; font-size: 8pt; text-transform: uppercase; }}
                .data-table td {{ padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 8pt; color: #334155; word-wrap: break-word; }}
                .data-table tr:nth-child(even) {{ background-color: #f8fafc; }}
                
                .metric-table {{ width: 100%; margin-bottom: 20px; border-spacing: 10px; border-collapse: separate; }}
                .metric-box {{ background: #ffffff; border: 2px solid #f1f5f9; padding: 20px 10px; text-align: center; border-radius: 10px; width: 25%; }}
                .metric-val {{ font-size: 18pt; font-weight: bold; color: #003366; display: block; }}
                .metric-lbl {{ font-size: 7.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; margin-top: 8px; display: block; letter-spacing: 0.5px; }}
                
                .density-badge {{
                    background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 7.5pt; text-transform: uppercase;
                }}

                .footer-sign {{ margin-top: 50px; text-align: right; font-size: 10pt; }}
                .signature-line {{ border-top: 1.5px solid #0f172a; width: 240px; display: inline-block; margin-top: 45px; }}
                
                .usc-footer {{
                    margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 8.5pt; color: #94a3b8;
                }}
            </style>
        </head>
        <body>
            <div class="usc-header">
                <p class="usc-logo-text">University of San Carlos</p>
                <p class="usc-sub-text">Health Services Department - Patient Information System</p>
            </div>
            
            <div class="report-title">{{{{ title }}}}</div>

            <div class="section" style="margin-top: -15px; margin-bottom: 20px;">
                <div style="font-size: 9pt; color: #475569; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <strong>Institutional Reporting Context</strong><br/>
                    <span style="color: #64748b;">Reporting Period:</span> {{{{ date_range_start|format_date:"%b %d, %Y" }}}} to {{{{ date_range_end|format_date:"%b %d, %Y" }}}}<br/>
                    <span style="color: #64748b;">Applied Parameters:</span> {{{{ applied_filters|join:", " }}}}
                </div>
            </div>

            {{% if visual_charts or charts_base64 %}}
            <div class="visual-section">
                <div class="section-title">Comparative Analysis & Visual Intelligence</div>
                <div style="text-align: center;">
                    {{% for chart_url in visual_charts %}}
                    <div class="chart-container" style="display: block; width: 95%; max-width: 800px; margin: 15px auto;">
                        <img src="{{{{ chart_url }}}}" width="100%" />
                    </div>
                    {{% endfor %}}
                    {{% for chart_b64 in charts_base64 %}}
                    <div class="chart-container" style="display: block; width: 95%; max-width: 800px; margin: 15px auto;">
                        <img src="{{{{ chart_b64 }}}}" width="100%" />
                    </div>
                    {{% endfor %}}
                </div>
                <p style="font-size: 8pt; color: #64748b; font-style: italic; text-align: center; margin-top: 10px;">
                    * Data visualizations generated based on institutional parameters and historical trends.
                </p>
            </div>
            {{% endif %}}

            {{% if report_focus == 'CLINICAL OPERATIONAL DENSITY' %}}
            <div class="section">
                <div class="section-title">Clinical Interaction Intelligence</div>
                <table class="metric-table">
                    <tr>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ total_clinic_interactions|default:"0" }}}}</span>
                            <span class="metric-lbl">Total Clinic Visits</span>
                        </td>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ peak_interaction_count|default:"0" }}}}</span>
                            <span class="metric-lbl">Peak Interaction Density</span>
                        </td>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ peak_operational_hour|default:"N/A" }}}}</span>
                            <span class="metric-lbl">Max Traffic Hour</span>
                        </td>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ institutional_patient_reach|default:"0" }}}}</span>
                            <span class="metric-lbl">Unique Patient Reach</span>
                        </td>
                    </tr>
                </table>
            </div>

            {{% elif report_type == "MEDICAL_CERTIFICATE" %}}
            <div class="section">
                <div class="section-title">Certification Issuance Summary</div>
                <table class="metric-table">
                    <tr>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ total_certificates|default:"0" }}}}</span>
                            <span class="metric-lbl">Total Certificates*</span>
                        </td>
                        <td class="metric-box">
                            <span class="metric-val">{{{{ certificates_log|length }}}}</span>
                            <span class="metric-lbl">Detailed Audit Rows</span>
                        </td>
                    </tr>
                </table>
                <p style="font-size: 8pt; color: #64748b; font-style: italic; margin-top: 5px;">
                    * Institutional aggregate includes certificates across all issuance and workflow statuses (including Issued, Pending, and Rejected).
                </p>
            </div>

            <div class="section">
                <div class="section-title">Fitness Distribution Analysis</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Fitness Determination</th><th>Volume</th></tr>
                    </thead>
                    <tbody>
                        {{% for item in fitness_distribution %}}
                        <tr>
                            <td>{{{{ item.status|title_clean }}}}</td>
                            <td>{{{{ item.count }}}} certificates</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            {{% if purpose_distribution %}}
            <div class="section">
                <div class="section-title">Certificate Purpose Distribution</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Template / Purpose</th><th>Volume</th></tr>
                    </thead>
                    <tbody>
                        {{% for item in purpose_distribution %}}
                        <tr>
                            <td>{{{{ item.name|title_clean }}}}</td>
                            <td>{{{{ item.count }}}} certificates</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            {{% if issuance_status_breakdown %}}
            <div class="section">
                <div class="section-title">Issuance Status Breakdown</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Status</th><th>Volume</th></tr>
                    </thead>
                    <tbody>
                        {{% for item in issuance_status_breakdown %}}
                        <tr>
                            <td>{{{{ item.status|title_clean }}}}</td>
                            <td>{{{{ item.count }}}} certificates</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            {{% if doctor_workload_tally %}}
            <div class="section">
                <div class="section-title">Physician Issuance Workload</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Medical Officer</th><th>Certificates Signed</th></tr>
                    </thead>
                    <tbody>
                        {{% for item in doctor_workload_tally %}}
                        <tr>
                            <td>Dr. {{{{ item.name|title_clean }}}}</td>
                            <td>{{{{ item.count }}}} certificates</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>
            {{% endif %}}

            <div class="section">
                <div class="section-title">Certificate Issuance Log</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Patient Name</th>
                            <th>Fitness Status</th>
                            <th>Issuing Doctor</th>
                            <th>Date Issued</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{% for item in certificates_log %}}
                        <tr>
                            <td>{{{{ item.patient }}}} ({{{{ item.usc_id }}}})</td>
                            <td>{{{{ item.fitness }}}}</td>
                            <td>{{{{ item.doctor }}}}</td>
                            <td>{{{{ item.date }}}}</td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            {{% elif hourly_traffic_density %}}
            <div class="section">
                <div class="section-title">Hourly Traffic Density & Workload Classification</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th width="40%">Operational Hour Block</th>
                            <th width="30%">Patient Interactions</th>
                            <th width="30%">Intensity Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{% for entry in hourly_traffic_density %}}
                        <tr>
                            <td><strong>{{{{ entry.hour }}}}:00 - {{{{ entry.hour }}}}:59</strong></td>
                            <td>{{{{ entry.count }}}} interactions</td>
                            <td>
                                {{% if entry.count >= 10 %}}
                                    <span class="density-badge" style="background-color: #fee2e2; color: #991b1b;">PEAK INTENSITY</span>
                                {{% elif entry.count >= 5 %}}
                                    <span class="density-badge" style="background-color: #fff7ed; color: #9a3412;">HEAVY FLOW</span>
                                {{% else %}}
                                    <span class="density-badge" style="background-color: #f0fdf4; color: #166534;">STABLE OPERATIONS</span>
                                {{% endif %}}
                            </td>
                        </tr>
                        {{% endfor %}}
                    </tbody>
                </table>
            </div>

            {{% else %}}
            <div class="section">
                <div class="section-title">Summary Operational Metrics</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Metric Category</th><th>Aggregated Value</th></tr>
                    </thead>
                    <tbody>
                    {{% for k, v in report_data.items %}}
                        {{% if v|is_simple and k not in "report_title,date_range_start,date_range_end,generated_at,system_name,report_type,visual_charts,charts_base64,report_focus" %}}
                            <tr>
                                <td><strong>{{{{ k|title_clean }}}}</strong></td>
                                <td>{{{{ v }}}}</td>
                            </tr>
                        {{% endif %}}
                    {{% endfor %}}
                    </tbody>
                </table>
            </div>

            {{% for k, v in report_data.items %}}
                {{% if v|is_list and v|has_data and k not in "visual_charts,charts_base64,visual_analytics,system_log,administrative_audit_trail,hourly_traffic_density" %}}
                <div class="{{% if mapped_charts|get_item:k %}}visual-section{{% else %}}section{{% endif %}}">
                    <div class="section-title">{{{{ k|title_clean }}}} Data Analysis</div>
                    
                    {{% if mapped_charts|get_item:k %}}
                    <div class="chart-container" style="display: block; width: 95%; max-width: 800px; margin: 15px auto;">
                        <img src="{{{{ mapped_charts|get_item:k }}}}" width="100%" />
                    </div>
                    {{% endif %}}
                    
                    <table class="data-table">
                        {{% with first_item=v|first %}}
                            {{% if first_item|is_dict %}}
                                <thead>
                                    <tr>
                                        {{% for key in first_item.keys %}}
                                            {{% if key != "id" and key != "timestamp" and key != "charts_base64" and key != "meta" and key != "usc_id" %}}
                                                {{% if key|lower == "comments" or key|lower == "improvement" or key|lower == "suggestions" %}}
                                                    <th width="30%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "summary" or key|lower == "notes" or key|lower == "findings" or key|lower == "formatted_summary" %}}
                                                    <th width="40%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "diagnosis" or key|lower == "procedure" or key|lower == "treatment" or key|lower == "primary_info" or key|lower == "title" or key|lower == "actor_email" %}}
                                                    <th width="22%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "recommend" or key|lower == "courteous" %}}
                                                    <th width="10%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "status" or key|lower == "rating" or key|lower == "performance" or key|lower == "priority" %}}
                                                    <th width="8%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "date" or key|lower == "created_at" or key|lower == "updated_at" or key|lower == "visit_date" or key|lower == "period" or key|lower == "timestamp" %}}
                                                    <th width="12%">{{{{ key|title_clean }}}}</th>
                                                {{% elif key|lower == "total_visits" or key|lower == "view_count" or key|lower == "count" or key|lower == "engagement_count" or key|lower == "enrollment" or key|lower == "percentage" %}}
                                                    <th width="9%">{{{{ key|title_clean }}}}</th>
                                                {{% else %}}
                                                    <th>{{{{ key|title_clean }}}}</th>
                                                {{% endif %}}
                                            {{% endif %}}
                                        {{% endfor %}}
                                    </tr>
                                </thead>
                                <tbody>
                                    {{% for item in v %}}
                                        <tr>
                                            {{% for key in first_item.keys %}}
                                                {{% if key != "id" and key != "timestamp" and key != "charts_base64" and key != "meta" and key != "usc_id" %}}
                                                <td style="word-wrap: break-word; overflow-wrap: break-word; vertical-align: top;">{{{{ item|get_item:key }}}}</td>
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
                {{% elif v|is_dict and v|has_data and k not in "patient,demographics,visits,clinical,feedback,service_segmentation,clinical_service_intensity,population_demographics" %}}
                <div class="section">
                    <div class="section-title">{{{{ k|title_clean }}}} Detailed Metrics</div>
                    <table class="data-table" width="100%">
                        <thead>
                            <tr><th width="40%">Dimension / Metric</th><th width="60%">Clinical Value</th></tr>
                        </thead>
                        <tbody>
                            {{% for key, val in v.items %}}
                            <tr>
                                <td><strong>{{{{ key|title_clean }}}}</strong></td>
                                <td>{{{{ val }}}}</td>
                            </tr>
                            {{% endfor %}}
                        </tbody>
                    </table>
                </div>
                {{% endif %}}
            {{% endfor %}}
            {{% endif %}}

            <div class="footer-sign">
                <div class="signature-line"></div>
                <p><strong>AUTHORIZED MEDICAL PERSONNEL</strong></p>
                <p>University of San Carlos Health Services</p>
            </div>

            <div class="usc-footer">
                <p><strong>CONFIDENTIAL INSTITUTIONAL DOCUMENT</strong></p>
                <p>Generated by {{{{ user.get_full_name|default:user|default:"Clinic Administrator" }}}} on {{{{ generated_at|format_date:"%Y-%m-%d %H:%M:%S" }}}}</p>
                <p>&copy; 2026 USC Health Services Department</p>
            </div>
        </body>
        </html>"""

    def _generate_chart_url_complex(self, chart_type, labels, datasets, title="Analysis"):
        """Generate a QuickChart.io URL for embedding complex multi-series charts in reports"""
        import json
        import urllib.parse
        
        # Limit labels for readability - increased for workshop support
        raw_labels = labels[:60]
        wrapped_labels = []
        for label in raw_labels:
            if not isinstance(label, str):
                wrapped_labels.append(label)
                continue
            words = label.split(' ')
            lines = []
            curr_line = ""
            for word in words:
                if len(curr_line + word) > 20:
                    if curr_line: lines.append(curr_line.strip())
                    curr_line = word + " "
                else:
                    curr_line += word + " "
            if curr_line: lines.append(curr_line.strip())
            wrapped_labels.append(lines if len(lines) > 1 else lines[0] if lines else "")
        labels = wrapped_labels
        
        processed_datasets = []
        for i, ds in enumerate(datasets):
            ds_data = ds.get('data', [])[:60]
            ds_label = ds.get('label', f'Series {i+1}')
            
            # Use Workshop-standard colors
            palette = [
                'rgba(59, 130, 246, 0.8)', # blue-500
                'rgba(16, 185, 129, 0.8)', # emerald-500
                'rgba(245, 158, 11, 0.8)', # amber-500
                'rgba(239, 68, 68, 0.8)',  # red-500
                'rgba(139, 92, 246, 0.8)', # violet-500
                'rgba(236, 72, 153, 0.8)', # pink-500
                'rgba(20, 184, 166, 0.8)', # teal-500
                'rgba(107, 114, 128, 0.8)'  # gray-500
            ]

            # For pie/doughnut/single-series bar charts, we need an array of colors for each slice/bar
            if (chart_type in ['pie', 'doughnut'] and len(datasets) == 1) or \
               (chart_type == 'bar' and len(datasets) == 1):
                bg_colors = [palette[j % len(palette)] for j in range(len(ds_data))]
                border_colors = [c.replace('0.8', '1') for c in bg_colors]
            else:
                bg_colors = ds.get('backgroundColor') or palette[i % len(palette)]
                border_colors = ds.get('borderColor') or (bg_colors.replace('0.8', '1') if isinstance(bg_colors, str) else [c.replace('0.8', '1') for c in bg_colors])

            processed_datasets.append({
                'label': ds_label,
                'data': ds_data,
                'backgroundColor': bg_colors,
                'borderColor': border_colors,
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
                    'yAxes': [{'ticks': {'beginAtZero': True}}],
                    'xAxes': [{'ticks': {'autoSkip': False, 'maxRotation': 45, 'minRotation': 45}}]
                } if chart_type not in ['pie', 'doughnut'] else {}
            }
        }
        
        config_str = json.dumps(chart_config)
        encoded_config = urllib.parse.quote(config_str)
        return f"https://quickchart.io/chart?c={encoded_config}&w=600&h=350"

    def collect_report_data(self, report_type, title, date_start=None, date_end=None, filters=None, **kwargs):
        """Standardized data collection for any report type with complex Workshop visualizations"""
        rtype = str(report_type or '').strip().upper()
        
        import json
        if isinstance(filters, str):
            try:
                filters = json.loads(filters)
            except Exception:
                filters = {}
        filters = filters or {}
        
        # Standardize dates
        date_start = date_start or kwargs.get('date_range_start')
        date_end = date_end or kwargs.get('date_range_end') or timezone.now()

        # Apply institutional floor and ensure range for "Full Academic History"
        if filters.get('date_range') == 'all':
            from datetime import datetime
            # Always start from 2024 rollout
            date_start = timezone.make_aware(datetime(2024, 1, 1, 0, 0, 0))
            # No hard ceiling for 'all', use provide date_end (which defaults to now)
            logger.info("Applying academic history floor (2024) to report export")
        
        # Final fallback for missing start date
        date_start = date_start or (timezone.now() - timedelta(days=365))

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
            elif rtype == 'MEDICAL_CERTIFICATE':
                data = self.data_service.get_certification_summary_data(date_start, date_end, filters)
                report_title = title or "Medical Fitness & Certification Analysis"
            elif rtype == 'USER_ACTIVITY' or rtype == 'OPERATIONS':
                analytics = self.data_service.get_comprehensive_system_analytics(date_start, date_end, filters)
                if 'error' in analytics:
                    data = {
                        'hourly_traffic_density': [],
                        'service_segmentation': {},
                        'total_operational_volume': 0,
                        'clinical_service_intensity': {},
                        'population_demographics': {},
                        'system_status': 'Temporarily Unavailable',
                        'error_context': analytics['error']
                    }
                else:
                    peak_hours = analytics.get('operations', {}).get('peak_hours', [])
                    max_hour = max(peak_hours, key=lambda x: x['count']) if peak_hours else {'hour': 'N/A', 'count': 0}
                    
                    data = {
                        'report_focus': 'CLINICAL OPERATIONAL DENSITY',
                        'total_clinic_interactions': analytics.get('visits', {}).get('total', 0),
                        'peak_operational_hour': f"{max_hour['hour']}:00 - {max_hour['hour']}:59",
                        'peak_interaction_count': max_hour['count'],
                        'medical_service_volume': analytics.get('visits', {}).get('types', {}).get('medical', 0),
                        'dental_service_volume': analytics.get('visits', {}).get('types', {}).get('dental', 0),
                        'institutional_patient_reach': analytics.get('demographics', {}).get('total_active', 0),
                        'hourly_traffic_density': peak_hours,
                        'service_segmentation': analytics.get('visits', {}).get('types', {}),
                        'clinical_service_intensity': analytics.get('clinical', {}),
                        'population_demographics': analytics.get('demographics', {}),
                        'administrative_audit_trail': []
                    }
                    
                    # Enhanced Audit Trail Collection with filtering
                    audit_qs = AuditLog.objects.filter(timestamp__range=(date_start, date_end)).exclude(
                        target_model__icontains='Notification'
                    ).exclude(
                        target_model__in=['NotificationLog', 'NotificationCampaign', 'NotificationTemplate']
                    )
                    
                    if filters:
                        if filters.get('search'):
                            from django.db.models import Q
                            s = filters['search']
                            audit_qs = audit_qs.filter(Q(actor_email__icontains=s) | Q(target_model__icontains=s) | Q(changes_summary__description__icontains=s))
                        if filters.get('action_type'):
                            audit_qs = audit_qs.filter(action_type=filters['action_type'])
                        if filters.get('target_model'):
                            audit_qs = audit_qs.filter(target_model=filters['target_model'])
                        if filters.get('actor_role'):
                            audit_qs = audit_qs.filter(actor_role=filters['actor_role'])
                    
                    trail = []
                    from .templatetags.report_tags import format_audit_summary
                    
                    for log in audit_qs.order_by('-timestamp')[:200]:
                        log_dict = {
                            'timestamp': log.timestamp,
                            'actor_email': log.actor_email,
                            'actor_role': log.actor_role,
                            'action_type': log.action_type,
                            'target_model': log.target_model,
                            'target_object_id': log.target_object_id,
                            'changes_summary': log.changes_summary,
                            'formatted_summary': format_audit_summary({
                                'actor_email': log.actor_email,
                                'action_type': log.action_type,
                                'target_model': log.target_model,
                                'changes_summary': log.changes_summary,
                                'target_object_id': log.target_object_id
                            })
                        }
                        trail.append(log_dict)
                    
                    data['administrative_audit_trail'] = trail
                
                if rtype == 'USER_ACTIVITY':
                    report_title = title or "System Usage & Administrative Audit Log"
                else:
                    report_title = title or "Clinic Operational Flow & Density Analysis"

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
            mapped_charts = {}
            
            if True:
                if rtype == 'PATIENT_SUMMARY':
                    if data.get('course_distribution'):
                        mapped_charts['course_distribution'] = self._generate_chart_url_complex('pie', 
                            [d.get('name', 'Other') for d in data['course_distribution'][:8]], 
                            [{'label': 'Enrollment', 'data': [d.get('count', 0) for d in data['course_distribution'][:8]]}],
                            "Course Enrollment Distribution")
                    
                    if data.get('age_distribution'):
                        age_data = data['age_distribution']
                        mapped_charts['age_distribution'] = self._generate_chart_url_complex('bar',
                            [d.get('group', 'N/A') for d in age_data],
                            [{'label': 'Patients', 'data': [d.get('count', 0) for d in age_data], 'backgroundColor': '#10b981'}],
                            "Age Demographic Distribution")

                    if data.get('gender_distribution'):
                        gender_data = data['gender_distribution']
                        mapped_charts['gender_distribution'] = self._generate_chart_url_complex('doughnut',
                            [d.get('gender', 'N/A') for d in gender_data],
                            [{'label': 'Gender', 'data': [d.get('count', 0) for d in gender_data]}],
                            "Gender Classification Share")

                    if data.get('year_level_distribution'):
                        yl_data = data['year_level_distribution']
                        mapped_charts['year_level_distribution'] = self._generate_chart_url_complex('bar',
                            [f"Year {d.get('year_level', 'N/A')}" for d in yl_data],
                            [{'label': 'Students', 'data': [d.get('count', 0) for d in yl_data], 'backgroundColor': '#6366f1'}],
                            "Year Level Distribution")
                    
                    if data.get('college_participation'):
                        mapped_charts['college_participation'] = self._generate_chart_url_complex('pie',
                            [d.get('name', 'N/A') for d in data['college_participation'][:8]],
                            [{'label': 'Students', 'data': [d.get('count', 0) for d in data['college_participation'][:8]]}],
                            "College Distribution")

                    if data.get('role_distribution'):
                        mapped_charts['role_distribution'] = self._generate_chart_url_complex('doughnut',
                            [d.get('name', 'N/A') for d in data['role_distribution']],
                            [{'label': 'Roles', 'data': [d.get('count', 0) for d in data['role_distribution']]}],
                            "Role Distribution")

                elif rtype == 'VISIT_TRENDS' and data.get('longitudinal_trends') and data.get('total_visits', 0) > 0:
                    periodic = data['longitudinal_trends']
                    mapped_charts['longitudinal_trends'] = self._generate_chart_url_complex('line', 
                        [p['period'] for p in periodic], 
                        [
                            {'label': 'Aggregate Trends', 'data': [p['total_visits'] for p in periodic], 'borderDash': [5, 5], 'borderColor': '#1e293b'},
                            {'label': 'Medical', 'data': [p['medical_visits'] for p in periodic], 'borderColor': '#3b82f6'},
                            {'label': 'Dental', 'data': [p['dental_visits'] for p in periodic], 'borderColor': '#10b981'}
                        ],
                        "Longitudinal Interaction Timeline")
                    
                    if data.get('top_diagnoses'):
                        mapped_charts['top_diagnoses'] = self._generate_chart_url_complex('bar',
                            [d.get('name', 'N/A')[:20] for d in data['top_diagnoses'][:8]],
                            [{'label': 'Cases', 'data': [d.get('count', 0) for d in data['top_diagnoses'][:8]]}],
                            "Top Clinical Diagnoses")
                    
                    if data.get('top_treatments'):
                        mapped_charts['top_treatments'] = self._generate_chart_url_complex('bar',
                            [d.get('name', 'N/A')[:20] for d in data['top_treatments'][:8]],
                            [{'label': 'Treatments', 'data': [d.get('count', 0) for d in data['top_treatments'][:8]]}],
                            "Top Clinical Treatments")

                    if data.get('total_medical') or data.get('total_dental'):
                        mapped_charts['service_distribution'] = self._generate_chart_url_complex('doughnut',
                            ['Medical', 'Dental'],
                            [{'label': 'Service Share', 'data': [data.get('total_medical', 0), data.get('total_dental', 0)]}],
                            "Service Distribution Analysis")

                elif rtype in ['CAMPAIGN_PERFORMANCE', 'HEALTH_CAMPAIGN'] and data.get('campaign_performance'):
                    perf = data['campaign_performance']
                    mapped_charts['campaign_performance'] = self._generate_chart_url_complex('bar', 
                        [c.get('title', 'N/A')[:20] for c in perf[:8]], 
                        [
                            {'label': 'Total Views', 'data': [c.get('views', c.get('view_count', 0)) for c in perf[:8]], 'backgroundColor': '#ea580c'}
                        ],
                        "Individual Campaign Reach")
                    
                    if data.get('category_distribution'):
                        mapped_charts['category_distribution'] = self._generate_chart_url_complex('pie',
                            [d.get('type', 'N/A') for d in data['category_distribution']],
                            [{'label': 'Category Share', 'data': [d.get('count', 0) for d in data['category_distribution']]}],
                            "Campaign Category Distribution")
                    
                    if data.get('asset_effectiveness'):
                        mapped_charts['asset_effectiveness'] = self._generate_chart_url_complex('bar',
                            [d.get('asset_type', 'N/A') for d in data['asset_effectiveness']],
                            [{'label': 'Avg Views', 'data': [d.get('avg_views', 0) for d in data['asset_effectiveness']]}],
                            "Asset Effectiveness Analysis")

                elif rtype in ['FEEDBACK_ANALYSIS', 'PATIENT_FEEDBACK'] and data.get('rating_distribution'):
                    dist = data['rating_distribution']
                    mapped_charts['rating_distribution'] = self._generate_chart_url_complex('doughnut', 
                        [f"{d.get('category', 'N/A')} Stars" for d in dist], 
                        [{
                            'label': 'Satisfaction', 
                            'data': [d.get('count', 0) for d in dist],
                            'backgroundColor': ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336']
                        }],
                        "Institutional Satisfaction Index")
                    
                    if data.get('service_metrics'):
                        metrics = data['service_metrics']
                        mapped_charts['service_metrics'] = self._generate_chart_url_complex('bar',
                            ['Would Recommend', 'Provider Courtesy'],
                            [
                                {'label': 'Yes', 'data': [metrics.get('recommend_yes', 0), metrics.get('courteous_yes', 0)], 'backgroundColor': '#10b981'},
                                {'label': 'No', 'data': [metrics.get('recommend_no', 0), metrics.get('courteous_no', 0)], 'backgroundColor': '#ef4444'}
                            ],
                            "Service Sentiment Breakdown")
                    
                    if data.get('feedback_trends'):
                        mapped_charts['feedback_trends'] = self._generate_chart_url_complex('line',
                            [m.get('month', 'N/A') for m in data['feedback_trends']],
                            [{'label': 'Avg Rating', 'data': [m.get('avg_rating', 0) for m in data['feedback_trends']]}],
                            "Feedback Satisfaction Trends")

                elif rtype in ['MEDICAL_STATISTICS', 'MEDICAL_STATS'] and data.get('top_diagnoses'):
                    diag = data['top_diagnoses']
                    mapped_charts['top_diagnoses'] = self._generate_chart_url_complex('bar', 
                        [d.get('name', 'N/A')[:25] for d in diag[:10]], 
                        [{'label': 'Frequency', 'data': [d.get('case_count', d.get('count', 0)) for d in diag[:10]]}],
                        "Top Clinical Diagnoses (Medical)")
                    
                    if data.get('gender_distribution'):
                        mapped_charts['gender_distribution'] = self._generate_chart_url_complex('pie',
                            [d.get('name', 'N/A') for d in data['gender_distribution']],
                            [{'label': 'Patients', 'data': [d.get('count', 0) for d in data['gender_distribution']]}],
                            "Medical Service Gender Share")
                    
                    if data.get('role_distribution'):
                        mapped_charts['role_distribution'] = self._generate_chart_url_complex('doughnut',
                            [d.get('name', 'N/A') for d in data['role_distribution']],
                            [{'label': 'Patients', 'data': [d.get('count', 0) for d in data['role_distribution']]}],
                            "Medical Service Role Share")

                elif rtype in ['DENTAL_STATISTICS', 'DENTAL_STATS'] and data.get('common_procedures'):
                    proc = data['common_procedures']
                    mapped_charts['common_procedures'] = self._generate_chart_url_complex('bar', 
                        [p.get('name', 'N/A')[:25] for p in proc[:10]], 
                        [{'label': 'Frequency', 'data': [p.get('count', 0) for p in proc[:10]]}],
                        "Top Procedural Metrics (Dental)")
                    
                    if data.get('gender_distribution'):
                        mapped_charts['gender_distribution'] = self._generate_chart_url_complex('pie',
                            [d.get('name', 'N/A') for d in data['gender_distribution']],
                            [{'label': 'Patients', 'data': [d.get('count', 0) for d in data['gender_distribution']]}],
                            "Dental Service Gender Share")
                    
                    if data.get('role_distribution'):
                        mapped_charts['role_distribution'] = self._generate_chart_url_complex('doughnut',
                            [d.get('name', 'N/A') for d in data['role_distribution']],
                            [{'label': 'Patients', 'data': [d.get('count', 0) for d in data['role_distribution']]}],
                            "Dental Service Role Share")

                elif rtype in ['TREATMENT_OUTCOMES', 'TREATMENT_OUTCOME']:
                    if data.get('top_diagnoses'):
                        diag = data['top_diagnoses']
                        mapped_charts['top_diagnoses'] = self._generate_chart_url_complex('bar', 
                            [d.get('name', 'N/A')[:25] for d in diag[:10]], 
                            [{'label': 'Diagnosis Frequency', 'data': [d.get('count', 0) for d in diag[:10]]}],
                            "Clinical Diagnosis Breakdown")
                    if data.get('treatment_distribution'):
                        treatments = data['treatment_distribution']
                        mapped_charts['treatment_distribution'] = self._generate_chart_url_complex('doughnut', 
                            [t.get('name', 'N/A')[:20] for t in treatments[:6]], 
                            [{'label': 'Treatment Share', 'data': [t.get('count', 0) for t in treatments[:6]]}],
                            "Treatment Outcomes Distribution")
                    if data.get('recovery_rates'):
                        mapped_charts['recovery_rates'] = self._generate_chart_url_complex('bar',
                            [r.get('condition', 'N/A')[:20] for r in data['recovery_rates'][:6]],
                            [{'label': 'Rate', 'data': [r.get('rate', 0) for r in data['recovery_rates'][:6]]}],
                            "Condition Recovery Efficiency")

                elif rtype == 'USER_ACTIVITY' or rtype == 'OPERATIONS' or rtype == 'AUDIT_LOG':
                    peak_hours = data.get('hourly_traffic_density', [])
                    if peak_hours:
                        mapped_charts['hourly_traffic_density'] = self._generate_chart_url_complex('bar', 
                            [f"{h['hour']}:00" for h in peak_hours], 
                            [{
                                'label': 'Hourly Visit Density', 
                                'data': [h['count'] for h in peak_hours],
                                'backgroundColor': '#f59e0b'
                            }],
                            "Operational Flow & Density Analysis")
                    
                    if data.get('service_segmentation'):
                        breakdown = data['service_segmentation']
                        mapped_charts['service_segmentation'] = self._generate_chart_url_complex('pie',
                            ['Medical', 'Dental'],
                            [{'label': 'Service Share', 'data': [breakdown.get('medical', 0), breakdown.get('dental', 0)]}],
                            "Institutional Service Distribution")

                elif rtype == 'COMPREHENSIVE_ANALYTICS' or rtype == 'COMPREHENSIVE':
                    # Multi-dimensional analytics for comprehensive reports
                    if data.get('visits', {}).get('monthly') and data.get('visits', {}).get('total_visits', 0) > 0:
                        monthly = data['visits']['monthly']
                        mapped_charts['monthly'] = self._generate_chart_url_complex('line', 
                            [m['month'] for m in monthly], 
                            [{'label': 'Total Visit Volume', 'data': [m['total_visits'] for m in monthly], 'borderColor': '#3b82f6', 'fill': True}],
                            "Institutional Clinical Throughput")
                    
                    if data.get('clinical', {}).get('top_diagnoses'):
                        diag = data['clinical']['top_diagnoses']
                        mapped_charts['top_diagnoses'] = self._generate_chart_url_complex('pie', 
                            [d.get('name', 'N/A')[:20] for d in diag[:6]], 
                            [{'label': 'Diagnosis Share', 'data': [d.get('case_count', d.get('count', 0)) for d in diag[:6]]}],
                            "Clinical Case Distribution")

                elif rtype == 'MEDICAL_CERTIFICATE':
                    if data.get('fitness_distribution'):
                        dist = data['fitness_distribution']
                        mapped_charts['fitness_distribution'] = self._generate_chart_url_complex('pie',
                            [d.get('status', 'N/A') for d in dist],
                            [{
                                'label': 'Fitness Determination', 
                                'data': [d.get('count', 0) for d in dist],
                                'backgroundColor': ['#ef4444' if 'unfit' in d.get('status', '').lower() else '#10b981' if 'fit' in d.get('status', '').lower() else '#3b82f6' for d in dist]
                            }],
                            "Fitness Determination Distribution")
                    if data.get('purpose_distribution'):
                        dist = data['purpose_distribution']
                        mapped_charts['purpose_distribution'] = self._generate_chart_url_complex('bar',
                            [d.get('name', 'N/A')[:20] for d in dist[:8]],
                            [{'label': 'Certificates Issued', 'data': [d.get('count', 0) for d in dist[:8]]}],
                            "Top Certificate Purposes")
                    if data.get('monthly_trends'):
                        mapped_charts['monthly_trends'] = self._generate_chart_url_complex('line',
                            [m.get('month', 'N/A') for m in data['monthly_trends']],
                            [{'label': 'Volume', 'data': [m.get('count', 0) for m in data['monthly_trends']]}],
                            "Monthly Issuance Trends")

            elif rtype == 'HEALTH_METRICS':
                # Future: Add charts for blood pressure/BMI trends if data is available
                pass

            # Standardize Metadata
            applied_filters = []
            if filters:
                for k, v in filters.items():
                    if v and k not in ['charts_base64', 'visual_analytics']:
                        label = k.replace('_', ' ').title()
                        val = v if not isinstance(v, list) else ", ".join(map(str, v))
                        applied_filters.append(f"{label}: {val}")

            data.update({
                'report_title': report_title,
                'date_range_start': data.get('date_range_start', date_start),
                'date_range_end': data.get('date_range_end', date_end),
                'generated_at': data.get('generated_at', timezone.now()),
                'report_date': timezone.now().strftime('%B %d, %Y'),
                'system_name': "USC Patient Information System",
                'report_type': rtype,
                'visual_charts': charts,
                'mapped_charts': mapped_charts,
                'charts_base64': filters.get('charts_base64', []),
                'applied_filters': applied_filters or ["None"]
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
        is_dummy = template_html and ("Comprehensive Analytics" in template_html or "System Operations & Audit Log" in template_html)
        # Force modern template for operational/audit reports if dummy or missing
        if not template_html or len(str(template_html)) < 150 or is_dummy or rtype in ['OPERATIONS', 'USER_ACTIVITY', 'AUDIT_LOG']:
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
    def generate_operations_report(self, **kwargs): return self._generate_generic_report('OPERATIONS', "Clinic Operational Flow & Density", **kwargs)
    def generate_health_metrics_report(self, **kwargs): return self._generate_generic_report('HEALTH_METRICS', "Health Metrics", **kwargs)
    def generate_health_history_report(self, **kwargs): return self._generate_generic_report('HEALTH_HISTORY', "Health History", **kwargs)
    def generate_medical_certificate_report(self, **kwargs): return self._generate_generic_report('MEDICAL_CERTIFICATE', "Medical Fitness & Certification Analysis", **kwargs)

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
                        {'label': '5th Year', 'value': '5'},
                        {'label': 'Batch X', 'value': '6'}
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
