from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Feedback
from .serializers import FeedbackSerializer

# Create your views here.

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'STAFF']:
            return Feedback.objects.all().order_by('-created_at')
        elif hasattr(user, 'patient_profile'):
            return Feedback.objects.filter(patient=user.patient_profile).order_by('-created_at')
        return Feedback.objects.none()

    def perform_create(self, serializer):
        # Link feedback to the current patient
        user = self.request.user
        if hasattr(user, 'patient_profile'):
            serializer.save(patient=user.patient_profile)
        else:
            raise PermissionDenied('Only patients can submit feedback.')
