from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from .models import Patient, MedicalRecord
from .serializers import PatientSerializer, MedicalRecordSerializer

# Create your views here.

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Patient.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )
        return queryset

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        total_patients = Patient.objects.count()
        total_records = MedicalRecord.objects.count()
        recent_patients = Patient.objects.order_by('-created_at')[:5]
        
        # Get visit statistics
        visits_by_month = MedicalRecord.objects.annotate(
            month=models.functions.TruncMonth('visit_date')
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
