from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import Feedback
from .serializers import FeedbackSerializer
from .permissions import IsAdminOrStaff
from patients.models import Patient  # Add this import at the top if not present

# Create your views here.

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    # Keep default IsAuthenticated for most actions, override for specific ones
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination to return data as array

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'STAFF']:
            return Feedback.objects.all().order_by('-created_at')
        elif hasattr(user, 'patient_profile'):
            return Feedback.objects.filter(patient=user.patient_profile).order_by('-created_at')
        return Feedback.objects.none()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Allow any authenticated user for create (perform_create handles logic),
        restrict analytics to Admin/Staff.
        """
        if self.action == 'analytics':
            permission_classes = [IsAdminOrStaff]
        elif self.action == 'create':
            # perform_create checks if the user is a patient
            permission_classes = [IsAuthenticated]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
             # Let default IsAuthenticated handle, or add more specific logic if needed
             # e.g., check if patient owns the feedback for retrieve/update/destroy
            permission_classes = [IsAuthenticated]
            # Add object-level permission checks here if required for update/delete
            # Example: permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly etc.
        else:
            permission_classes = self.permission_classes # Fallback to default

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Ensure the user can submit feedback, finding or creating Patient as needed.
        Handles multiple cases for robust patient linking.
        Also prevents duplicate feedback submissions.
        """
        user = self.request.user
        patient = None
        medical_record = serializer.validated_data.get('medical_record')

        # 1. Try to get patient directly linked to the user
        try:
            patient = Patient.objects.get(user=user)
            print(f"Found patient directly linked to user {user.email}: {patient}")
        except Patient.DoesNotExist:
            print(f"No patient directly linked to user {user.email}. Trying lookup by email.")
            # 2. If no direct link, try getting by email (handles cases where patient exists but link is missing)
            try:
                patient = Patient.objects.get(email=user.email)
                print(f"Found patient by email {user.email}: {patient}")
                # Link the found patient to this user if not already linked to someone
                if patient.user is None:
                    patient.user = user
                    patient.save()
                    print(f"Linked existing patient (ID: {patient.id}) to user {user.email}")
                elif patient.user != user:
                    # This case should ideally not happen if emails are unique per user
                    # But log it if it does.
                    print(f"Warning: Patient with email {user.email} found but linked to different user ({patient.user.email}). Using this patient anyway.")
                # If patient.user == user, it means the get(user=user) failed but get(email=...) found the correct one - unusual case.

            except Patient.DoesNotExist:
                print(f"No patient found by email {user.email}. Creating a new patient.")
                # 3. Create a new patient only if no patient exists with this email/user link
                try:
                    # Use user data if available from profile setup, otherwise use defaults
                    patient = Patient.objects.create(
                        user=user,
                        first_name=user.first_name or 'DefaultFirstName',
                        last_name=user.last_name or 'DefaultLastName',
                        date_of_birth=user.birthday or '2000-01-01',  # Use user's birthday if available
                        gender='M' if user.sex and user.sex.lower().startswith('m') else 'F' if user.sex and user.sex.lower().startswith('f') else 'O',  # Convert sex to gender (M/F/O)
                        email=user.email,
                        phone_number=user.phone or user.phone_number or '0000000000',
                        address=user.address_present or user.address_permanent or 'Default Address'
                    )
                    print(f"Created new patient for user {user.email}: {patient}")
                except Exception as e:
                    # Catch potential integrity errors during creation
                    print(f"Error creating patient for {user.email}: {str(e)}")
                    raise PermissionDenied(f"Could not create or link patient profile. Error: {str(e)}")
        
        # Ensure we have a patient object before proceeding
        if not patient:
             # This should theoretically not be reached if the logic above is sound
             print(f"Critical Error: Could not find or create patient for user {user.email} before saving feedback.")
             raise PermissionDenied("Could not associate feedback with a patient profile.")

        # Check for duplicate feedback submissions
        existing_feedback = None
        if medical_record:
            # Check for existing feedback on this specific medical record
            existing_feedback = Feedback.objects.filter(
                patient=patient,
                medical_record=medical_record
            ).first()
            if existing_feedback:
                print(f"Duplicate feedback attempt for medical record {medical_record.id} by patient {patient.id}")
                raise PermissionDenied("You have already submitted feedback for this medical visit.")
        else:
            # Check for existing general feedback (where medical_record is null)
            existing_feedback = Feedback.objects.filter(
                patient=patient,
                medical_record__isnull=True
            ).first()
            if existing_feedback:
                print(f"Duplicate general feedback attempt by patient {patient.id}")
                raise PermissionDenied("You have already submitted general feedback.")

        # Save the feedback, linked to the found/created patient
        try:
            serializer.save(patient=patient)
            print(f"Successfully created feedback for patient: {patient.id} (User: {user.email})")
        except Exception as e:
            print(f"Error saving feedback for user {user.email}: {str(e)}")
            raise PermissionDenied(f"Error submitting feedback: {str(e)}")

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='check-existing')
    def check_existing(self, request):
        """
        Check if the current user has already submitted feedback for a specific medical record or general feedback.
        Query parameter: medical_record_id (optional, if not provided, checks for general feedback)
        """
        user = request.user
        medical_record_id = request.query_params.get('medical_record_id')
        
        try:
            # Get patient for current user
            patient = Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            # If no patient exists, no feedback exists either
            return Response({'has_feedback': False})

        if medical_record_id and medical_record_id != 'general':
            # Check for specific medical record feedback
            existing_feedback = Feedback.objects.filter(
                patient=patient,
                medical_record_id=medical_record_id
            ).exists()
        else:
            # Check for general feedback (medical_record is null)
            existing_feedback = Feedback.objects.filter(
                patient=patient,
                medical_record__isnull=True
            ).exists()

        return Response({'has_feedback': existing_feedback})

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrStaff], url_path='analytics')
    def analytics(self, request):
        """
        Provides aggregated feedback analytics for Admin/Staff users.
        """
        queryset = Feedback.objects.all()
        total_feedback = queryset.count()

        if total_feedback == 0:
            return Response({
                'total_feedback': 0,
                'average_rating': None,
                'ratings_distribution': {},
                'courteous_counts': {'yes': 0, 'no': 0, 'unanswered': 0},
                'recommend_counts': {'yes': 0, 'no': 0, 'unanswered': 0},
            })

        average_rating = queryset.aggregate(Avg('rating'))['rating__avg']

        # Get counts for each rating value (1-5)
        ratings_dist = queryset.values('rating').annotate(count=Count('id')).order_by('rating')
        ratings_distribution = {item['rating']: item['count'] for item in ratings_dist}
        # Ensure all ratings 1-5 are present, even if count is 0
        for i in range(1, 6):
            if i not in ratings_distribution:
                ratings_distribution[i] = 0

        # Get counts for courteous (handling null/empty strings)
        courteous_yes = queryset.filter(courteous__iexact='yes').count()
        courteous_no = queryset.filter(courteous__iexact='no').count()
        courteous_unanswered = total_feedback - courteous_yes - courteous_no

        # Get counts for recommend (handling null/empty strings)
        recommend_yes = queryset.filter(recommend__iexact='yes').count()
        recommend_no = queryset.filter(recommend__iexact='no').count()
        recommend_unanswered = total_feedback - recommend_yes - recommend_no

        data = {
            'total_feedback': total_feedback,
            'average_rating': round(average_rating, 2) if average_rating is not None else None,
            'ratings_distribution': ratings_distribution,
            'courteous_counts': {
                'yes': courteous_yes,
                'no': courteous_no,
                'unanswered': courteous_unanswered
            },
            'recommend_counts': {
                'yes': recommend_yes,
                'no': recommend_no,
                'unanswered': recommend_unanswered
            },
        }
        return Response(data)
