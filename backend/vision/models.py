from django.conf import settings
from django.db import models
from django.utils import timezone


class PhoneDistractionEvent(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
	)
	timestamp = models.DateTimeField(default=timezone.now, db_index=True)
	session_id = models.CharField(max_length=128, null=True, blank=True)
	confidence = models.FloatField(null=True, blank=True)
	method = models.CharField(max_length=64, null=True, blank=True)
	camera_index = models.IntegerField(null=True, blank=True)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-timestamp"]

	def __str__(self) -> str:  # pragma: no cover - trivial
		u = self.user.username if self.user else "anonymous"
		return f"PhoneDistractionEvent {u} @ {self.timestamp.isoformat()}"
