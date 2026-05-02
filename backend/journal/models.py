from django.db import models

class JournalEntry(models.Model):
    text = models.TextField()
    emotion = models.JSONField()
    physical = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]