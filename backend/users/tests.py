from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ParentAuthApiTests(APITestCase):
    def test_parent_sign_up_returns_tokens_and_parent_payload(self):
        response = self.client.post(
            reverse("api_parent_sign_up"),
            {
                "email": "parent@example.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
                "first_name": "John",
                "last_name": "Doe",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("parent", response.data)
        self.assertEqual(response.data["parent"]["email"], "parent@example.com")

    def test_parent_sign_in_returns_tokens_and_parent_payload(self):
        user = User.objects.create_user(
            username="parent2@example.com",
            email="parent2@example.com",
            password="StrongPass123!",
            first_name="Jane",
            last_name="Doe",
        )

        response = self.client.post(
            reverse("api_parent_sign_in"),
            {"email": user.email, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("parent", response.data)
        self.assertEqual(response.data["parent"]["email"], user.email)

    def test_parent_profile_returns_current_user_payload(self):
        user = User.objects.create_user(
            username="parent3@example.com",
            email="parent3@example.com",
            password="StrongPass123!",
            first_name="Max",
            last_name="Mustermann",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("api_parent_profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["parent"]["email"], user.email)