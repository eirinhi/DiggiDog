from django.test import TestCase
from django.urls import reverse
from api.models import User, Competition
from django.contrib.auth import authenticate
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, timedelta

class CreateCompetitionTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user_1", password="test_password")
        self.start_date = datetime.now() + timedelta(days=1)
        self.end_date = datetime.now() + timedelta(days=8)

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
            "max_participants": 50,
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
            "max_participants": 50,
            "user_id": self.user.id
        }, format="json")       

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("competition", response.data)
        self.assertEqual(response.data["competition"]["name"], "Test Competition")        
        self.assertEqual(response.data["competition"]["max_participants"], 50)

        self.assertTrue(Competition.objects.filter(name="Test Competition").exists())

    def test_create_competition_no_description(self):
        url = reverse("create_competition")

        response = self.client.post(url, {
            "name": "Test Competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 100,
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
            "max_participants": 50,
            "user_id": self.user.id
        }, format="json")   

        response2 = self.client.post(url, {
            "name": "Competition 2",
            "description": "Second Competition",
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "max_participants": 100,
            "user_id": self.user.id
        }, format="json")       

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Competition.objects.count(), 2)