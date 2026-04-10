import re
from urllib.parse import parse_qs, urlparse

from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


@override_settings(
	EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
	DEFAULT_FROM_EMAIL="StudyBee <no-reply@studybee.local>",
	FRONTEND_URL="http://example.test",
	ALLOWED_HOSTS=["testserver", "example.test"],
)
class PasswordResetFlowTests(APITestCase):
	def test_password_reset_request_sends_email(self):
		user = User.objects.create_user(
			username="alice",
			email="alice@example.com",
			password="OldPassw0rd!",
		)
		url = reverse("api_password_reset")
		res = self.client.post(url, {"email": "alice@example.com"}, format="json")
		self.assertEqual(res.status_code, 200)

		self.assertEqual(len(mail.outbox), 1)
		self.assertIn(user.email, mail.outbox[0].to)
		self.assertTrue(mail.outbox[0].body)

	def test_password_reset_confirm_updates_password(self):
		user = User.objects.create_user(
			username="bob",
			email="bob@example.com",
			password="OldPassw0rd!",
		)

		# Request reset to get token in email
		res = self.client.post(reverse("api_password_reset"), {"email": "bob@example.com"}, format="json")
		self.assertEqual(res.status_code, 200)
		self.assertEqual(len(mail.outbox), 1)

		body = mail.outbox[0].body
		match = re.search(r"https?://\S+", body)
		self.assertIsNotNone(match)
		reset_url = match.group(0)

		parsed = urlparse(reset_url)
		qs = parse_qs(parsed.query)
		uid = qs.get("uid", [""])[0]
		token = qs.get("token", [""])[0]
		self.assertTrue(uid)
		self.assertTrue(token)

		new_password = "N3wPassw0rd!!"
		res2 = self.client.post(
			reverse("api_password_reset_confirm"),
			{
				"uidb64": uid,
				"token": token,
				"new_password": new_password,
				"new_password_confirm": new_password,
			},
			format="json",
		)
		self.assertEqual(res2.status_code, 200)

		user.refresh_from_db()
		self.assertTrue(user.check_password(new_password))
