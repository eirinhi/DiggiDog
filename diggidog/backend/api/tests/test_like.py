from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase

from api.models import Competition, Dog, Like, Participant, User


class LikeParticipantTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user_1", name="", password="test_password")
        self.user.is_admin = True
        self.user.save()
        self.competition = Competition.objects.create(
            name="Test Competition",
            description="A test competition",
            start_date=timezone.now() + timedelta(days=1),
            end_date=timezone.now() + timedelta(days=3),
            max_participants=10,
            created_by=self.user
        )
        self.dog = Dog.objects.create(
            name="Test Dog",
            breed="Test Breed",
            age=5,
            owner=self.user
        )
        self.participant = Participant.objects.create(
            user=self.user,
            competition=self.competition,
            dog=self.dog
        )

    def test_like_participant(self):
        url = reverse("like_participant")
        data = {
            "user_id": self.user.id,
            "participant_id": self.participant.id
        }
        response = self.client.post(url, data=data)

        self.assertEqual(response.status_code, 201)
        like = response.data
        self.assertEqual(like['user_id'], self.user.id)

    def test_like_participant_user_not_found(self):
        url = reverse("like_participant")
        data = {
            "user_id": 999,
            "participant_id": self.participant.id
        }
        response = self.client.post(url, data=data)

        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.data)

    def test_like_participant_duplicate(self):
        url = reverse("like_participant")
        data = {
            "user_id": self.user.id,
            "participant_id": self.participant.id
        }
        self.client.post(url, data=data)
        response = self.client.post(url, data=data)

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "Already liked")

    def test_get_likes(self):
        Like.objects.create(user=self.user, participant=self.participant)
        url = reverse("get_likes")
        response = self.client.get(url, data={"participant_id": self.participant.id})

        self.assertEqual(response.status_code, 200)
        self.assertIn("likes", response.data)
        self.assertEqual(len(response.data["likes"]), 1)
        self.assertEqual(response.data["likes"][0]["user_id"], self.user.id)

    def test_get_likes_participant_not_found(self):
        url = reverse("get_likes")
        response = self.client.get(url, data={"participant_id": 999})

        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.data)

    def test_unlike_participant(self):
        Like.objects.create(user=self.user, participant=self.participant)
        url = reverse("unlike_participant")
        data = {
            "user_id": self.user.id,
            "participant_id": self.participant.id
        }
        response = self.client.delete(url, data=data)

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "Participant unliked")
