from django.test import TestCase
from django.urls import reverse
from api.models import User, Competition
from django.contrib.auth import authenticate
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from django.utils import timezone

class CreateCompetitionTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user_1", password="test_password")
        self.start_date = timezone.now() + timedelta(days=1)
        self.end_date = timezone.now() + timedelta(days=8)
        self.user.is_admin = True
        self.user.save()

    def test_create_competition_no_data(self):
        url = reverse("create_competition")

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_missing_required_fields(self):
        url = reverse("create_competition")
        
        response = self.client.post(url, {
            "name": "Test Competition",
            "description": "Test description"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_user_not_found(self):
        url = reverse("create_competition")
        
        response = self.client.post(url, {
            "name": "Test Competition",
            "description": "Test description",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 20,
            "user_id": 999
        }, format="json")       

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_create_competition_success(self):
        url = reverse("create_competition")
        
        response = self.client.post(url, {
            "name": "Test Competition",
            "description": "This is a test competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 1,
            "user_id": self.user.id
        }, format="json")       

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("competition", response.data)
        self.assertEqual(response.data["competition"]["name"], "Test Competition")        
        self.assertEqual(response.data["competition"]["max_participants"], 1)

        self.assertTrue(Competition.objects.filter(name="Test Competition").exists())

    def test_create_competition_no_description(self):
        url = reverse("create_competition")

        response = self.client.post(url, {
            "name": "Test Competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 2,
            "user_id": self.user.id
        }, format="json")       

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["competition"]["description"], "")

        competition = Competition.objects.get(name="Test Competition")
        self.assertEqual(competition.description, "")

    def test_create_competition_multiple(self):
        url = reverse("create_competition")
        
        response1 = self.client.post(url, {
            "name": "Competition 1",
            "description": "First Competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")   

        response2 = self.client.post(url, {
            "name": "Competition 2",
            "description": "Second Competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")       

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Competition.objects.count(), 2)

    def test_create_competition_start_date_in_past(self):
        url = reverse("create_competition")
        past_start = timezone.now() - timedelta(days=1)
        future_end = timezone.now() + timedelta(days=7)

        response = self.client.post(url, {
            "name": "Past Competition",
            "description": "Competition in the past",
            "start_date": past_start.isoformat(),
            "end_date": future_end.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_end_date_before_start_date(self):
        url = reverse("create_competition")
        start = timezone.now() + timedelta(days=5)
        end = timezone.now() + timedelta(days=2)

        response = self.client.post(url, {
            "name": "Invalid Competition",
            "description": "End before start",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
    
    def test_create_competition_start_equals_end_date(self):
        url = reverse("create_competition")
        same_date = timezone.now() + timedelta(days=3)

        response = self.client.post(url, {
            "name": "Same Date Competition",
            "description": "Start and end on same date",
            "start_date": same_date.isoformat(),
            "end_date": same_date.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
    
    def test_create_competition_valid_date_limits(self):
        url = reverse("create_competition")

        response = self.client.post(url, {
            "name": "Valid Competition",
            "description": "Proper date range",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")     

        self.assertIn("message", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_competition_minimal_duration(self):
        url = reverse("create_competition")
        start = timezone.now() + timedelta(hours=1)
        end = timezone.now() + timedelta(hours=2)

        response = self.client.post(url, {
            "name": "Short Competition",
            "description": "One hour duration",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "max_participants": 10,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_competition_long_duration(self):
        url = reverse("create_competition")
        start = timezone.now() + timedelta(days=1)
        end = timezone.now() + timedelta(days=365)

        response = self.client.post(url, {
            "name": "Year Long Competition",
            "description": "One year duration",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "max_participants": 20,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_participants_too_low(self):
        url = reverse("create_competition")

        response = self.client.post(url, {
            "name": "Too Few Participants",
            "description": "Less than minimum",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 0,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_participants_too_high(self):
        url = reverse("create_competition")

        response = self.client.post(url, {
            "name": "Too Many Participants",
            "description": "More than maximum",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 21,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_competition_too_far_in_the_future(self):
        url = reverse("create_competition")
        start = timezone.now() + timedelta(days=65)
        end = start + timedelta(days=8)

        response = self.client.post(url, {
            "name": "Future Competition",
            "description": "Competition to far in the future",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "max_participants": 21,
            "user_id": self.user.id
        }, format="json")     

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

