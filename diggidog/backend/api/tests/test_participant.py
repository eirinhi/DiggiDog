from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from api.models import User, Competition, Participant


class ParticipantAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", name="", password="pwd")
        self.admin.is_admin = True
        self.admin.save()

        self.user = User.objects.create_user(username="user1", name="", password="pwd")
        self.user2 = User.objects.create_user(username="user2", name="", password="pwd")

        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(days=2)
        self.comp = Competition.objects.create(
            name="Comp1",
            description="",
            start_date=start,
            end_date=end,
            max_participants=2,
            created_by=self.admin,
        )
        self.comp.full_clean()
        self.comp.save()

        self.comp_small = Competition.objects.create(
            name="CompSmall",
            description="",
            start_date=start,
            end_date=end,
            max_participants=1,
            created_by=self.admin,
        )
        self.comp_small.full_clean()
        self.comp_small.save()

    def test_register_participant_success(self):
        url = reverse("register_participant")
        data = {"user_id": self.user.id, "competition_id": self.comp.id, "dog_id": "dog-A"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("participant", resp.data)
        self.assertTrue(Participant.objects.filter(user=self.user, competition=self.comp).exists())

    def test_register_missing_fields(self):
        url = reverse("register_participant")
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    def test_register_user_not_found(self):
        url = reverse("register_participant")
        resp = self.client.post(url, {"user_id": 999, "competition_id": self.comp.id, "dog_id": "d"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_register_competition_not_found(self):
        url = reverse("register_participant")
        resp = self.client.post(url, {"user_id": self.user.id, "competition_id": 999, "dog_id": "d"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_register_duplicate_dog(self):
        Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="dog1")
        url = reverse("register_participant")
        resp = self.client.post(url, {"user_id": self.user.id, "competition_id": self.comp.id, "dog_id": "dog1"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_competition_full(self):
        Participant.objects.create(user=self.user, competition=self.comp_small, dog_identifier="dogA")
        url = reverse("register_participant")
        resp = self.client.post(url, {"user_id": self.user2.id, "competition_id": self.comp_small.id, "dog_id": "dogB"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_participants(self):
        p1 = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="d1")
        p2 = Participant.objects.create(user=self.user2, competition=self.comp, dog_identifier="d2")
        url = reverse("get_participants", args=[self.comp.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in resp.data}
        self.assertIn(p1.id, ids)
        self.assertIn(p2.id, ids)

    def test_update_participant(self):
        p = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="old")
        url = reverse("participant_detail", args=[p.id])
        resp = self.client.patch(url, {"dog_id": "new"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        p.refresh_from_db()
        self.assertEqual(p.dog_identifier, "new")

    def test_update_duplicate_dog_error(self):
        p1 = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="a")
        p2 = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="b")
        url = reverse("participant_detail", args=[p2.id])
        resp = self.client.patch(url, {"dog_id": "a"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_different_users_same_dog_allowed(self):
        p1 = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="same_dog")
        p2 = Participant.objects.create(user=self.user2, competition=self.comp, dog_identifier="other_dog")
        url = reverse("participant_detail", args=[p2.id])
        resp = self.client.patch(url, {"dog_id": "same_dog"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        p2.refresh_from_db()
        self.assertEqual(p2.dog_identifier, "same_dog")

    def test_delete_participant(self):
        p = Participant.objects.create(user=self.user, competition=self.comp, dog_identifier="xyz")
        url = reverse("participant_detail", args=[p.id])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Participant.objects.filter(id=p.id).exists())
