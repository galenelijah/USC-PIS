from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from .models import HealthInformation
from .serializers import HealthInformationSerializer

def health_info_placeholder(request):
    return HttpResponse('Health Info app is set up. Replace this with actual views.')

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'STAFF']

class HealthInformationViewSet(viewsets.ModelViewSet):
    queryset = HealthInformation.objects.all().order_by('-created_at')
    serializer_class = HealthInformationSerializer
    permission_classes = [IsStaffOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user) 