from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from patients.models import Patient  # Fixed import
from .models import Feedback

User = get_user_model()

class FeedbackAnalyticsAPITests(APITestCase):

    def setUp(self):
        # Create users with different roles
        self.admin_user = User.objects.create_user(email='admin@test.com', username='admin', password='password123', role='ADMIN')
        self.staff_user = User.objects.create_user(email='staff@test.com', username='staff', password='password123', role='STAFF')
        self.student_user = User.objects.create_user(email='student@test.com', username='student', password='password123', role='STUDENT')

        # Create patients (link student to a patient profile)
        self.patient1 = Patient.objects.create(email='patient1@test.com', first_name='P1', last_name='LN1', date_of_birth='2000-01-01')
        self.patient_student = Patient.objects.create(user=self.student_user, email=self.student_user.email, first_name='Student', last_name='User', date_of_birth='2002-05-05')
        self.student_user.patient_profile = self.patient_student
        self.student_user.save()

        # Create Feedback entries
        Feedback.objects.create(patient=self.patient1, rating=5, comments='Great!', courteous='yes', recommend='yes')
        Feedback.objects.create(patient=self.patient1, rating=4, comments='Good', courteous='yes', recommend='no')
        Feedback.objects.create(patient=self.patient_student, rating=3, comments='Okay', courteous='no', recommend='no')
        Feedback.objects.create(patient=self.patient_student, rating=5, comments='Excellent', courteous='yes', recommend='yes')
        Feedback.objects.create(patient=self.patient1, rating=5, comments='Superb') # Unanswered courteous/recommend

        self.analytics_url = reverse('feedback-analytics') # Assumes basename='feedback' and default router naming
        self.client = APIClient()

    def test_access_admin(self):
        """Ensure ADMIN can access analytics."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_staff(self):
        """Ensure STAFF can access analytics."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_denied_student(self):
        """Ensure STUDENT cannot access analytics."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_access_denied_anonymous(self):
        """Ensure anonymous users cannot access analytics."""
        self.client.logout()
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_analytics_aggregation(self):
        """Test the aggregated data returned by the endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['total_feedback'], 5)
        self.assertEqual(data['average_rating'], (5 + 4 + 3 + 5 + 5) / 5) # Should be 4.4
        self.assertEqual(data['ratings_distribution'][5], 3)
        self.assertEqual(data['ratings_distribution'][4], 1)
        self.assertEqual(data['ratings_distribution'][3], 1)
        self.assertEqual(data['ratings_distribution'].get(2, 0), 0) # Check non-existent rating defaults to 0
        self.assertEqual(data['ratings_distribution'].get(1, 0), 0)

        self.assertEqual(data['courteous_counts']['yes'], 3)
        self.assertEqual(data['courteous_counts']['no'], 1)
        self.assertEqual(data['courteous_counts']['unanswered'], 1) # 5 total - 3 yes - 1 no

        self.assertEqual(data['recommend_counts']['yes'], 2)
        self.assertEqual(data['recommend_counts']['no'], 2)
        self.assertEqual(data['recommend_counts']['unanswered'], 1) # 5 total - 2 yes - 2 no

    def test_analytics_no_feedback(self):
        """Test analytics endpoint when no feedback exists."""
        Feedback.objects.all().delete()
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['total_feedback'], 0)
        self.assertIsNone(data['average_rating'])
        self.assertEqual(data['ratings_distribution'], {})
        self.assertEqual(data['courteous_counts'], {'yes': 0, 'no': 0, 'unanswered': 0})
        self.assertEqual(data['recommend_counts'], {'yes': 0, 'no': 0, 'unanswered': 0})

class FeedbackModelTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email='fb@example.com', password='testpass')
        self.patient = Patient.objects.create(
            user=self.user,
            first_name='Jane',
            last_name='Doe',
            date_of_birth='2000-01-01',
            gender='F',
            email='jane.doe@example.com',
            phone_number='1234567890',
            address='123 Main St'
        )
    def test_create_feedback(self):
        feedback = Feedback.objects.create(
            patient=self.patient,
            rating=5
        )
        self.assertEqual(feedback.rating, 5)

class FeedbackEndpointTest(TestCase):
    def test_feedback_list_endpoint(self):
        try:
            url = reverse('feedback:feedback-list')
        except:
            url = '/api/feedback/'
        response = self.client.get(url)
        self.assertIn(response.status_code, [200, 403, 401])
