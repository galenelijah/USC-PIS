from rest_framework import serializers
from .models import HealthInformation

class HealthInformationSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)

    class Meta:
        model = HealthInformation
        fields = [
            'id', 'title', 'content', 'category', 'created_at', 'updated_at',
            'author', 'author_email', 'author_role'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'author_email', 'author_role'] 