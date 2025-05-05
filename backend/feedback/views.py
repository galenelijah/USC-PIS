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
        Ensure only users with a linked patient profile and completed setup can submit feedback.
        """
        user = self.request.user
        if user.completeSetup:
            try:
                patient = Patient.objects.get(user=user)
                serializer.save(patient=patient)
                return
            except Patient.DoesNotExist:
                pass  # Will fall through to error below

        print(f"Feedback submission denied for user: {user.email}, Role: {user.role}, Setup Complete: {user.completeSetup}")
        if not user.completeSetup:
            raise PermissionDenied('Please complete your profile setup before submitting feedback.')
        else:
            raise PermissionDenied('Feedback submission requires a valid patient profile linked to your account.')

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
