from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from .models import Patient, MedicalRecord
from .serializers import PatientSerializer, MedicalRecordSerializer
from authentication.models import User # Import User model

# Create your views here.

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Base queryset with prefetch
        queryset = Patient.objects.prefetch_related('medical_records')

        # Filter based on user role
        if user.role == User.Role.STUDENT:
            # Students see only their own linked patient record
            queryset = queryset.filter(user=user)
        elif user.role in [User.Role.DOCTOR, User.Role.NURSE, User.Role.STAFF, User.Role.ADMIN]:
            # Staff/Admin/Doctor/Nurse can see all patients (or apply other filters)
            # Add select_related if user info is often needed in list display for staff
            queryset = queryset.select_related('user').all()
        else:
            # If user role is undefined or unexpected, return empty queryset
            queryset = Patient.objects.none()

        # Apply search filter if provided
        search = self.request.query_params.get('search', None)
        if search and queryset.exists(): # Only apply search if queryset is not empty
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(user__email__icontains=search) # Also search by linked user email if needed
            )
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        total_patients = Patient.objects.count()
        total_records = MedicalRecord.objects.count()
        recent_patients = Patient.objects.prefetch_related('medical_records').order_by('-created_at')[:5]
        
        # Get visit statistics
        visits_by_month = MedicalRecord.objects.annotate(
            month=TruncMonth('visit_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        return Response({
            'total_patients': total_patients,
            'total_records': total_records,
            'recent_patients': PatientSerializer(recent_patients, many=True).data,
            'visits_by_month': list(visits_by_month)
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
