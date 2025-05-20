from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalCertificate, CertificateTemplate
from .serializers import MedicalCertificateSerializer, CertificateTemplateSerializer

# Create your views here.

class IsStaffOrMedicalPersonnel(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role in ['DOCTOR', 'NURSE', 'STAFF']
        )

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]

class MedicalCertificateViewSet(viewsets.ModelViewSet):
    queryset = MedicalCertificate.objects.all()
    serializer_class = MedicalCertificateSerializer
    permission_classes = [IsStaffOrMedicalPersonnel]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by patient if specified
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        # Filter by status if specified
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            issued_by=self.request.user,
            issued_at=timezone.now() if serializer.validated_data.get('status') == 'pending' else None
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        certificate = self.get_object()
        
        if certificate.status != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.is_staff or request.user.role == 'DOCTOR'):
            return Response(
                {'detail': 'Only doctors can approve certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        certificate.status = 'approved'
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        certificate = self.get_object()
        
        if certificate.status != 'pending':
            return Response(
                {'detail': 'Only pending certificates can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not (request.user.is_staff or request.user.role == 'DOCTOR'):
            return Response(
                {'detail': 'Only doctors can reject certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )

        certificate.status = 'rejected'
        certificate.approved_by = request.user
        certificate.approved_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        certificate = self.get_object()
        
        if certificate.status != 'draft':
            return Response(
                {'detail': 'Only draft certificates can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = 'pending'
        certificate.issued_at = timezone.now()
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)
