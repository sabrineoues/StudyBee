from django.db import models
from django.conf import settings

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


class UserHabit(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_habit",
    )
    hydration = models.IntegerField(default=3)
    walk = models.BooleanField(default=False)
    sleep_early = models.BooleanField(default=False)
    sleep_quality = models.IntegerField(default=6)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Habit profile for {self.user}"