from django.test import TestCase
from .models import HealthInfoPlaceholder

class HealthInfoPlaceholderTest(TestCase):
    def test_placeholder_creation(self):
        obj = HealthInfoPlaceholder.objects.create(info='Test Info')
        self.assertEqual(obj.info, 'Test Info') 