from django.test import TestCase
from django.urls import reverse
from api.models import User
from django.contrib.auth import authenticate
from rest_framework.test import APITestCase
from rest_framework import status

# Create your tests here.

class UserTestCase(TestCase): 
    
    def setUp(self): 
        User.objects.create_user(username="user_1",name="", password="test_password")

    def test_create_user(self): 
        user = authenticate(username="user_1", password="test_password")
        self.assertEqual(user.username, "user_1")
        self.assertEqual(user.id, 1)
        self.assertEqual(user.bio, '')
        self.assertFalse(user.is_admin)
        self.assertIsNotNone(user.date_joined)


class RegisterUserTestCase(APITestCase): 

    def setUp(self):
        User.objects.create_user(username="user_1",name="",  password="test_password")

    
    def test_register_no_data(self): 
        url = reverse("register")

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 
        self.assertIn("error", response.data)

    def test_register_already_exists(self): 
        url = reverse("register")

        response = self.client.post(url, {"username":"user_1", "password":"test_password"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 
        self.assertIn("error", response.data)

    def test_register_success(self): 
        url = reverse("register")

        response = self.client.post(url, {"username":"user_2","name": "",  "password":"test_password"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED) 
        self.assertIn("message", response.data)
        
        self.assertTrue(User.objects.filter(username="user_2").exists())

class LoginUserTestCase(APITestCase):

    def setUp(self):
        User.objects.create_user(username="user_1",name="", password="test_password")

    
    def test_login_no_data(self): 
        url = reverse("login")

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 
        self.assertIn("error", response.data)

    def test_login_user_does_not_exist(self): 
        url = reverse("login")

        response = self.client.post(url, {"username":"user_2", "password":"test_password"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 
        self.assertIn("error", response.data)


    def test_login_success(self):
        url = reverse("login")

        response = self.client.post(url, {"username":"user_1", "password":"test_password"}, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

