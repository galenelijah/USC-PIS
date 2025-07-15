from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from .models import Patient, MedicalRecord, Consultation, DentalRecord
from .serializers import PatientSerializer, MedicalRecordSerializer, ConsultationSerializer, DentalRecordSerializer
from authentication.models import User
from .permissions import MedicalRecordPermission
from .validators import (
    patient_validator, duplicate_detector, record_validator, consistency_checker
)
import logging
import traceback

logger = logging.getLogger(__name__)

# Create your views here.

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array
    
    def get_queryset(self):
        user = self.request.user
        
        # Base queryset with optimized prefetch and select_related
        queryset = Patient.objects.select_related('user', 'created_by').prefetch_related(
            'medical_records__created_by',
            'dental_records__created_by',
            'consultations__created_by'
        )

        # Filter based on user role
        if user.role == User.Role.STUDENT:
            # Students see only their own linked patient record
            queryset = queryset.filter(user=user)
        elif user.role in [User.Role.DOCTOR, User.Role.NURSE, User.Role.STAFF, User.Role.ADMIN]:
            # Staff/Admin/Doctor/Nurse can see all patients
            pass
        else:
            # If user role is undefined or unexpected, return empty queryset
            queryset = Patient.objects.none()

        # Apply search filter if provided
        search = self.request.query_params.get('search', None)
        if search and queryset.exists():
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(user__email__icontains=search)
            )
            
        return queryset

    def create(self, request, *args, **kwargs):
        """Enhanced patient creation with comprehensive validation."""
        try:
            user = request.user
            
            # Check permissions - only admin/staff can create patients manually
            if user.role not in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
                return Response({
                    'detail': 'Only medical staff can create patient records manually.',
                    'error_code': 'PERMISSION_DENIED'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Validate patient data
            validation_errors = patient_validator.validate_patient_data(request.data)
            if validation_errors:
                return Response({
                    'detail': 'Patient data validation failed',
                    'errors': validation_errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for potential duplicates
            potential_duplicates = duplicate_detector.find_potential_duplicates(request.data)
            if potential_duplicates:
                # If high similarity duplicates found, require confirmation
                high_similarity = [d for d in potential_duplicates if d['similarity_score'] > 0.9]
                if high_similarity:
                    return Response({
                        'detail': 'Potential duplicate patients found',
                        'duplicates': [{
                            'patient_id': dup['patient'].id,
                            'patient_name': f"{dup['patient'].first_name} {dup['patient'].last_name}",
                            'similarity_score': dup['similarity_score'],
                            'matching_fields': dup['matching_fields']
                        } for dup in high_similarity],
                        'confirmation_required': True,
                        'error_code': 'DUPLICATE_PATIENT'
                    }, status=status.HTTP_409_CONFLICT)
            
            # If user is specified, check consistency
            if 'user' in request.data or 'user_id' in request.data:
                try:
                    linked_user_id = request.data.get('user') or request.data.get('user_id')
                    linked_user = User.objects.get(id=linked_user_id)
                    
                    # Check if user already has a patient profile
                    if hasattr(linked_user, 'patient_profile'):
                        return Response({
                            'detail': 'User already has a patient profile',
                            'existing_patient_id': linked_user.patient_profile.id
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Check data consistency
                    consistency_errors = consistency_checker.check_user_patient_consistency(
                        linked_user, request.data
                    )
                    if consistency_errors:
                        return Response({
                            'detail': 'Data consistency issues found',
                            'errors': consistency_errors,
                            'warning': True
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                except User.DoesNotExist:
                    return Response({
                        'detail': 'Specified user does not exist'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create patient with transaction safety
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    # Set created_by field
                    patient = serializer.save(created_by=user)
                    
                    logger.info(f"Patient created: {patient.id} by user {user.email}")
                    
                    return Response({
                        'detail': 'Patient created successfully',
                        'patient': PatientSerializer(patient).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'detail': 'Invalid patient data',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except IntegrityError as e:
            logger.error(f"Patient creation integrity error: {str(e)}")
            return Response({
                'detail': 'Database integrity error. Patient may already exist.',
                'error_code': 'INTEGRITY_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Patient creation error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                'detail': 'An error occurred while creating patient',
                'error_code': 'CREATION_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Enhanced patient update with validation."""
        try:
            instance = self.get_object()
            user = request.user
            
            # Check permissions
            if user.role == User.Role.STUDENT and instance.user != user:
                return Response({
                    'detail': 'Students can only update their own patient profile'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Validate updated data
            validation_errors = patient_validator.validate_patient_data(request.data)
            if validation_errors:
                return Response({
                    'detail': 'Patient data validation failed',
                    'errors': validation_errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for potential duplicates (excluding current patient)
            potential_duplicates = duplicate_detector.find_potential_duplicates(
                request.data, exclude_id=instance.id
            )
            if potential_duplicates:
                high_similarity = [d for d in potential_duplicates if d['similarity_score'] > 0.9]
                if high_similarity and not request.data.get('force_update'):
                    return Response({
                        'detail': 'Update would create potential duplicate',
                        'duplicates': [{
                            'patient_id': dup['patient'].id,
                            'patient_name': f"{dup['patient'].first_name} {dup['patient'].last_name}",
                            'similarity_score': dup['similarity_score'],
                            'matching_fields': dup['matching_fields']
                        } for dup in high_similarity],
                        'confirmation_required': True,
                        'error_code': 'DUPLICATE_PATIENT'
                    }, status=status.HTTP_409_CONFLICT)
            
            # If linked user exists, check consistency
            if instance.user:
                consistency_errors = consistency_checker.check_user_patient_consistency(
                    instance.user, request.data
                )
                if consistency_errors:
                    logger.warning(f"Consistency warnings for patient {instance.id}: {consistency_errors}")
            
            # Perform update
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                with transaction.atomic():
                    patient = serializer.save()
                    
                    logger.info(f"Patient updated: {patient.id} by user {user.email}")
                    
                    return Response({
                        'detail': 'Patient updated successfully',
                        'patient': PatientSerializer(patient).data
                    })
            else:
                return Response({
                    'detail': 'Invalid patient data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ObjectDoesNotExist:
            return Response({
                'detail': 'Patient not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Patient update error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                'detail': 'An error occurred while updating patient',
                'error_code': 'UPDATE_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def check_duplicates(self, request, pk=None):
        """Check for potential duplicate patients."""
        try:
            patient = self.get_object()
            
            # Check permissions
            if request.user.role not in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
                return Response({
                    'detail': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            patient_data = {
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'date_of_birth': patient.date_of_birth,
                'email': patient.email,
                'phone_number': patient.phone_number
            }
            
            duplicates = duplicate_detector.find_potential_duplicates(
                patient_data, exclude_id=patient.id
            )
            
            return Response({
                'patient_id': patient.id,
                'potential_duplicates': [{
                    'patient_id': dup['patient'].id,
                    'patient_name': f"{dup['patient'].first_name} {dup['patient'].last_name}",
                    'similarity_score': dup['similarity_score'],
                    'matching_fields': dup['matching_fields'],
                    'created_at': dup['patient'].created_at
                } for dup in duplicates]
            })
            
        except Exception as e:
            logger.error(f"Duplicate check error: {str(e)}")
            return Response({
                'detail': 'Error checking for duplicates'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [MedicalRecordPermission]
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        """Filter records based on user role with enhanced error handling."""
        try:
            user = self.request.user
            queryset = MedicalRecord.objects.select_related('patient', 'created_by').all()

            if user.role == User.Role.STUDENT:
                # Find the patient profile linked to the student user
                try:
                    patient = Patient.objects.get(user=user)
                    queryset = queryset.filter(patient=patient)
                except Patient.DoesNotExist:
                    logger.warning(f"Student user {user.email} has no patient profile")
                    queryset = MedicalRecord.objects.none()
                except Patient.MultipleObjectsReturned:
                    logger.error(f"Student user {user.email} has multiple patient profiles")
                    # Return all records for this user's patients as fallback
                    patients = Patient.objects.filter(user=user)
                    queryset = queryset.filter(patient__in=patients)
                    
            elif user.role in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
                # Medical staff can see all records
                pass
            else:
                # Unknown role, return no records
                logger.warning(f"User {user.email} has unknown role: {user.role}")
                queryset = MedicalRecord.objects.none()

            return queryset.order_by('-visit_date')
            
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return MedicalRecord.objects.none()

    def create(self, request, *args, **kwargs):
        """Enhanced medical record creation with validation."""
        try:
            user = request.user
            
            # Validate medical record data
            validation_errors = record_validator.validate_medical_record(request.data)
            if validation_errors:
                return Response({
                    'detail': 'Medical record validation failed',
                    'errors': validation_errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get patient and validate access
            patient_id = request.data.get('patient')
            if not patient_id:
                return Response({
                    'detail': 'Patient ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return Response({
                    'detail': 'Patient not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if user.role == User.Role.STUDENT:
                if not hasattr(user, 'patient_profile') or user.patient_profile != patient:
                    return Response({
                        'detail': 'Students cannot create medical records'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Check for duplicate records on same date
            visit_date = request.data.get('visit_date')
            if visit_date:
                existing_record = MedicalRecord.objects.filter(
                    patient=patient, 
                    visit_date=visit_date
                ).first()
                
                if existing_record:
                    return Response({
                        'detail': f'Medical record already exists for {visit_date}',
                        'existing_record_id': existing_record.id,
                        'suggestion': 'Update the existing record or choose a different date'
                    }, status=status.HTTP_409_CONFLICT)
            
            # Create record with transaction safety
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    record = serializer.save(created_by=user)
                    
                    logger.info(f"Medical record created: {record.id} for patient {patient.id} by {user.email}")
                    
                    return Response({
                        'detail': 'Medical record created successfully',
                        'record': MedicalRecordSerializer(record).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'detail': 'Invalid medical record data',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"Medical record creation error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                'detail': 'An error occurred while creating medical record',
                'error_code': 'CREATION_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

class DentalRecordViewSet(viewsets.ModelViewSet):
    queryset = DentalRecord.objects.all()
    serializer_class = DentalRecordSerializer
    permission_classes = [MedicalRecordPermission]  # Use same permission as medical records
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        """Filter dental records based on user role with enhanced error handling."""
        try:
            user = self.request.user
            queryset = DentalRecord.objects.select_related('patient', 'created_by').all()

            if user.role == User.Role.STUDENT:
                # Find the patient profile linked to the student user
                try:
                    patient = Patient.objects.get(user=user)
                    queryset = queryset.filter(patient=patient)
                except Patient.DoesNotExist:
                    logger.warning(f"Student user {user.email} has no patient profile")
                    queryset = DentalRecord.objects.none()
                except Patient.MultipleObjectsReturned:
                    logger.error(f"Student user {user.email} has multiple patient profiles")
                    # Return all records for this user's patients as fallback
                    patients = Patient.objects.filter(user=user)
                    queryset = queryset.filter(patient__in=patients)
                    
            elif user.role in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
                # Medical staff can see all records
                pass
            else:
                # Unknown role, return no records
                logger.warning(f"User {user.email} has unknown role: {user.role}")
                queryset = DentalRecord.objects.none()

            # Apply filters from query parameters
            procedure = self.request.query_params.get('procedure', None)
            if procedure:
                queryset = queryset.filter(procedure_performed=procedure)
            
            priority = self.request.query_params.get('priority', None)
            if priority:
                queryset = queryset.filter(priority=priority)
            
            date_from = self.request.query_params.get('date_from', None)
            if date_from:
                queryset = queryset.filter(visit_date__gte=date_from)
            
            date_to = self.request.query_params.get('date_to', None)
            if date_to:
                queryset = queryset.filter(visit_date__lte=date_to)

            return queryset.order_by('-visit_date')
            
        except Exception as e:
            logger.error(f"Error in dental records get_queryset: {str(e)}")
            return DentalRecord.objects.none()

    def create(self, request, *args, **kwargs):
        """Enhanced dental record creation with validation."""
        try:
            user = request.user
            
            # Get patient and validate access
            patient_id = request.data.get('patient')
            if not patient_id:
                return Response({
                    'detail': 'Patient ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return Response({
                    'detail': 'Patient not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if user.role == User.Role.STUDENT:
                return Response({
                    'detail': 'Students cannot create dental records'
                }, status=status.HTTP_403_FORBIDDEN)
            elif user.role not in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
                return Response({
                    'detail': 'Insufficient permissions to create dental records'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Validate required fields
            required_fields = ['visit_date', 'procedure_performed', 'diagnosis', 'treatment_performed']
            missing_fields = [field for field in required_fields if not request.data.get(field)]
            if missing_fields:
                return Response({
                    'detail': 'Missing required fields',
                    'missing_fields': missing_fields
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for duplicate records on same date and procedure
            visit_date = request.data.get('visit_date')
            procedure = request.data.get('procedure_performed')
            if visit_date and procedure:
                existing_record = DentalRecord.objects.filter(
                    patient=patient, 
                    visit_date=visit_date,
                    procedure_performed=procedure
                ).first()
                
                if existing_record:
                    return Response({
                        'detail': f'Dental record for {procedure} already exists for {visit_date}',
                        'existing_record_id': existing_record.id,
                        'suggestion': 'Update the existing record, choose a different date, or use a different procedure type'
                    }, status=status.HTTP_409_CONFLICT)
            
            # Validate tooth numbers if provided
            tooth_numbers = request.data.get('tooth_numbers', '')
            if tooth_numbers:
                try:
                    # Parse and validate tooth numbers
                    tooth_nums = [num.strip() for num in tooth_numbers.split(',') if num.strip()]
                    for num in tooth_nums:
                        tooth_num = int(num)
                        if tooth_num < 11 or tooth_num > 48:
                            return Response({
                                'detail': f'Invalid tooth number: {num}. Must be between 11-48 (FDI notation)'
                            }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({
                        'detail': 'Invalid tooth number format. Use comma-separated numbers (e.g., 11,12,21)'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create record with transaction safety
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    record = serializer.save(created_by=user)
                    
                    logger.info(f"Dental record created: {record.id} for patient {patient.id} by {user.email}")
                    
                    return Response({
                        'detail': 'Dental record created successfully',
                        'record': DentalRecordSerializer(record).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'detail': 'Invalid dental record data',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"Dental record creation error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                'detail': 'An error occurred while creating dental record',
                'error_code': 'CREATION_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def procedures(self, request):
        """Get list of available dental procedures."""
        procedures = [{'value': choice[0], 'label': choice[1]} for choice in DentalRecord.PROCEDURE_CHOICES]
        return Response({'procedures': procedures})

    @action(detail=False, methods=['get'])
    def tooth_conditions(self, request):
        """Get list of available tooth conditions."""
        conditions = [{'value': choice[0], 'label': choice[1]} for choice in DentalRecord.TOOTH_CONDITION_CHOICES]
        return Response({'tooth_conditions': conditions})

    @action(detail=True, methods=['get'])
    def treatment_history(self, request, pk=None):
        """Get complete dental treatment history for a patient."""
        try:
            record = self.get_object()
            patient = record.patient
            
            # Get all dental records for this patient
            all_records = DentalRecord.objects.filter(patient=patient).order_by('-visit_date')
            
            serializer = DentalRecordSerializer(all_records, many=True)
            
            return Response({
                'patient_id': patient.id,
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'total_visits': all_records.count(),
                'treatment_history': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error getting treatment history: {str(e)}")
            return Response({
                'detail': 'Error retrieving treatment history'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        """Filter consultations based on user role."""
        user = self.request.user
        queryset = Consultation.objects.select_related('patient', 'created_by').all()

        if user.role == User.Role.STUDENT:
            # Find the patient profile linked to the student user
            try:
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                # If student has no patient profile, return no consultations
                queryset = Consultation.objects.none()
        elif user.role in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
            # Admin/Staff/Doctor/Nurse can see all consultations
            pass
        else:
            # Unknown role, return no consultations
            queryset = Consultation.objects.none()

        return queryset.order_by('-date_time')  # Order by date_time descending

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        user = request.user
        
        # Optimized queries with select_related and prefetch_related
        total_patients = Patient.objects.count()
        total_records = MedicalRecord.objects.count()
        total_dental_records = DentalRecord.objects.count()
        
        # Optimized recent patients query with related data
        recent_patients = Patient.objects.select_related('user', 'created_by').prefetch_related(
            'medical_records__created_by',
            'dental_records__created_by'
        ).order_by('-created_at')[:5]
        
        # Optimized monthly visits aggregation
        visits_by_month = MedicalRecord.objects.annotate(
            month=TruncMonth('visit_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Optimized dental visits aggregation
        dental_visits_by_month = DentalRecord.objects.annotate(
            month=TruncMonth('visit_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Optimized today's appointments and pending requests
        today = timezone.now().date()
        appointments_today = Consultation.objects.filter(date_time__date=today).count()
        pending_requests = Consultation.objects.filter(remarks__icontains='pending').count()

        # Role-based stats
        if user.role in [User.Role.ADMIN, User.Role.STAFF, User.Role.DOCTOR, User.Role.NURSE]:
            # Admin/Staff/Doctor/Nurse dashboard
            return Response({
                'total_patients': total_patients,
                'total_records': total_records,
                'total_dental_records': total_dental_records,
                'recent_patients': PatientSerializer(recent_patients, many=True).data,
                'visits_by_month': list(visits_by_month),
                'dental_visits_by_month': list(dental_visits_by_month),
                'appointments_today': appointments_today,
                'pending_requests': pending_requests,
            })
        elif user.role == User.Role.STUDENT:
            # Student/Patient dashboard - optimized for single patient
            patient = getattr(user, 'patient_profile', None)
            if patient:
                # Get patient's next appointment and recent records
                next_consultation = Consultation.objects.filter(
                    patient=patient,
                    date_time__gt=timezone.now()
                ).order_by('date_time').first()
                
                recent_medical_record = MedicalRecord.objects.filter(
                    patient=patient
                ).order_by('-visit_date').first()
                
                recent_dental_record = DentalRecord.objects.filter(
                    patient=patient
                ).order_by('-visit_date').first()
                
                next_appointment = next_consultation.date_time if next_consultation else None
                profile_completion = calculate_profile_completion(user, patient)
                
                return Response({
                    'next_appointment': next_appointment,
                    'recent_medical_record': recent_medical_record.diagnosis if recent_medical_record else None,
                    'recent_dental_record': recent_dental_record.diagnosis if recent_dental_record else None,
                    'profile_completion': profile_completion,
                    'patient_id': patient.id,
                })
            else:
                return Response({
                    'next_appointment': None,
                    'recent_medical_record': None,
                    'recent_dental_record': None,
                    'profile_completion': 0,
                    'patient_id': None,
                })
        else:
            return Response({'error': 'Unknown user role'}, status=400)
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def calculate_profile_completion(user, patient):
    """Calculate profile completion percentage for a user and patient."""
    total_fields = 0
    completed_fields = 0
    
    # User fields to check
    user_fields = [
        'first_name', 'last_name', 'email', 'phone', 'birthday',
        'address_present', 'emergency_contact', 'emergency_contact_number'
    ]
    
    for field in user_fields:
        total_fields += 1
        if getattr(user, field, None):
            completed_fields += 1
    
    # Patient fields to check
    patient_fields = [
        'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth',
        'gender', 'address'
    ]
    
    for field in patient_fields:
        total_fields += 1
        if getattr(patient, field, None):
            completed_fields += 1
    
    return int((completed_fields / total_fields) * 100) if total_fields > 0 else 0
