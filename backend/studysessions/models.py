from django.db import models


class StudySession(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=255)
    study_duration = models.PositiveIntegerField()  # minutes
    break_duration = models.PositiveIntegerField()
    subject=models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    pinned = models.BooleanField(default=False)
    focusScore = models.IntegerField()
    streakscore = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='study_sessions')





    def __str__(self):
        return self.title


class StudySessionTask(models.Model):
    session = models.ForeignKey(StudySession, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title