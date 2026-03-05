from django.urls import reverse
from api.models import User, Dog
from rest_framework.test import APITestCase
from rest_framework import status


class CreateDogTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user_1", name="Test User", password="test_password")
        self.url = reverse("create_dog")

    def test_create_dog_success(self):
        response = self.client.post(self.url, {
            "name": "Buddy",
            "age": 3,
            "breed": "Golden Retriever",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("dog", response.data)
        self.assertEqual(response.data["dog"]["name"], "Buddy")
        self.assertEqual(response.data["dog"]["age"], 3)
        self.assertEqual(response.data["dog"]["breed"], "Golden Retriever")
        self.assertEqual(response.data["dog"]["owner"], self.user.id)
        self.assertTrue(Dog.objects.filter(name="Buddy").exists())

    def test_create_dog_with_picture(self):
        response = self.client.post(self.url, {
            "name": "Rex",
            "age": 5,
            "breed": "German Shepherd",
            "owner": self.user.id,
            "picture": "data:image/png;base64,abc123",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["dog"]["picture"], "data:image/png;base64,abc123")

    def test_create_dog_no_data(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_dog_owner_not_found(self):
        response = self.client.post(self.url, {
            "name": "Buddy",
            "age": 3,
            "breed": "Labrador",
            "owner": 999,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_create_multiple_dogs(self):
        response1 = self.client.post(self.url, {
            "name": "Buddy",
            "age": 3,
            "breed": "Golden Retriever",
            "owner": self.user.id,
        }, format="json")

        response2 = self.client.post(self.url, {
            "name": "Luna",
            "age": 1,
            "breed": "Poodle",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Dog.objects.count(), 2)

    def test_create_dog_blank_name(self):
        response = self.client.post(self.url, {
            "name": "   ",
            "age": 3,
            "breed": "Labrador",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_dog_blank_breed(self):
        response = self.client.post(self.url, {
            "name": "Buddy",
            "age": 3,
            "breed": "   ",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_dog_age_exceeds_max(self):
        response = self.client.post(self.url, {
            "name": "Buddy",
            "age": 35,
            "breed": "Labrador",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_dog_age_at_max(self):
        response = self.client.post(self.url, {
            "name": "Buddy",
            "age": 30,
            "breed": "Labrador",
            "owner": self.user.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class DeleteDogTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user_1", name="Test User", password="test_password")
        self.dog = Dog.objects.create(name="Buddy", age=3, breed="Labrador", owner=self.user)

    def test_delete_dog_success(self):
        url = reverse("delete_dog", args=[self.dog.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertFalse(Dog.objects.filter(id=self.dog.id).exists())

    def test_delete_dog_not_found(self):
        url = reverse("delete_dog", args=[999])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)


class GetDogsTestCase(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username="user_1", name="User One", password="test_password")
        self.user2 = User.objects.create_user(username="user_2", name="User Two", password="test_password")
        self.dog1 = Dog.objects.create(name="Buddy", age=3, breed="Labrador", owner=self.user1)
        self.dog2 = Dog.objects.create(name="Luna", age=2, breed="Poodle", owner=self.user1)
        self.dog3 = Dog.objects.create(name="Rex", age=5, breed="German Shepherd", owner=self.user2)

    def test_get_all_dogs(self):
        url = reverse("get_dogs")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_get_dogs_by_owner(self):
        url = reverse("get_dogs")

        response = self.client.get(url, {"owner": self.user1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        for dog in response.data:
            self.assertEqual(dog["owner"], self.user1.id)

    def test_get_dogs_empty_database(self):
        Dog.objects.all().delete()
        url = reverse("get_dogs")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
