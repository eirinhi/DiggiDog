from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from api.models import User, Competition, Participant, Dog, Comment


class CommentAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", name="", password="pwd")
        self.admin.is_admin = True
        self.admin.save()

        self.user = User.objects.create_user(username="user1", name="", password="pwd")
        self.user2 = User.objects.create_user(username="user2", name="", password="pwd")
        self.dog = Dog.objects.create(name="Dog1", breed="Labrador", age=5, owner=self.user)

        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(days=2)
        self.comp = Competition.objects.create(
            name="Comp1",
            description="",
            start_date=start,
            end_date=end,
            max_participants=5,
            created_by=self.admin,
        )
        self.comp.full_clean()
        self.comp.save()

        self.participant = Participant.objects.create(
            user=self.user, competition=self.comp, dog=self.dog
        )

    def test_create_comment_success(self):
        url = reverse("create_comment")
        data = {"user_id": self.user2.id, "participant_id": self.participant.id, "text": "Great dog!"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("comment", resp.data)
        self.assertEqual(resp.data["comment"]["text"], "Great dog!")
        self.assertTrue(Comment.objects.filter(participant=self.participant).exists())

    def test_create_comment_missing_fields(self):
        url = reverse("create_comment")
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    def test_create_comment_user_not_found(self):
        url = reverse("create_comment")
        data = {"user_id": 999, "participant_id": self.participant.id, "text": "Hello"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_comment_participant_not_found(self):
        url = reverse("create_comment")
        data = {"user_id": self.user.id, "participant_id": 999, "text": "Hello"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_comment_blank_text(self):
        url = reverse("create_comment")
        data = {"user_id": self.user.id, "participant_id": self.participant.id, "text": "   "}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_comments(self):
        Comment.objects.create(user=self.user, participant=self.participant, text="Comment 1")
        Comment.objects.create(user=self.user2, participant=self.participant, text="Comment 2")
        url = reverse("get_comments", args=[self.participant.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_get_comments_participant_not_found(self):
        url = reverse("get_comments", args=[999])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_comment(self):
        comment = Comment.objects.create(user=self.user, participant=self.participant, text="To delete")
        url = reverse("delete_comment", args=[comment.id])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_create_comment_too_long(self):
        url = reverse("create_comment")
        data = {"user_id": self.user.id, "participant_id": self.participant.id, "text": "a" * 251}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_comment_not_found(self):
        url = reverse("delete_comment", args=[999])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
