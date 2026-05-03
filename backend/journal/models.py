from django.db import models
from django.conf import settings  # 👈 add this

class JournalEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="journals"
    )
    text = models.TextField()
    emotion = models.JSONField()
    physical = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]