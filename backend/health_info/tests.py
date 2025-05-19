# USC-PIS/backend/health_info/tests.py

from django.test import TestCase
from .models import HealthInformation
from django.urls import reverse

class HealthInformationModelTest(TestCase):
    def test_create_health_info(self):
        hi = HealthInformation.objects.create(
            title='Test Info',
            content='Some content',
            category='General'
        )
        self.assertEqual(hi.title, 'Test Info')

class HealthInfoEndpointTest(TestCase):
    def test_health_info_list_endpoint(self):
        try:
            url = reverse('health_info:healthinformation-list')
        except:
            url = '/api/health-info/health-information/'
        response = self.client.get(url)
        self.assertIn(response.status_code, [200, 403, 401]) 