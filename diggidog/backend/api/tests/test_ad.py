from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import Ad
from django.core.files.uploadedfile import SimpleUploadedFile
import os

class AdTests(APITestCase):

    def setUp(self):
        self.upload_url = reverse("upload_ad")
        self.get_url = reverse("get_ad")
        self.created_files = []

    def tearDown(self):
        for ad in Ad.objects.all():
            if ad.file and os.path.isfile(ad.file.path):
                os.remove(ad.file.path)
            ad.delete()

        self.created_files.clear()


    def test_get_ad_empty_database(self):
        response = self.client.get(self.get_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_upload_ad_no_file(self):
        response = self.client.post(self.upload_url, {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)



    def test_upload_ad_success(self):
        file = SimpleUploadedFile(
            name="test.jpg",
            content=b"fake_image_data",
            content_type="image/jpeg"
        )

        response = self.client.post(
            self.upload_url,
            {"myfile": file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Ad.objects.count(), 1)


    def test_get_ad_success(self):
        file = SimpleUploadedFile(
            name="test.jpg",
            content=b"fake_image_data",
            content_type="image/jpeg"
        )

        ad = Ad.objects.create(file=file)

        response = self.client.get(self.get_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("id", response.data)
        self.assertIn("image_url", response.data)

        self.assertEqual(response.data["id"], ad.id)
