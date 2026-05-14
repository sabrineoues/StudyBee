from django.conf import settings
from django.db import models


class Quiz(models.Model):
    """A collection of quiz questions."""
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.title


class Question(models.Model):
    """A single question in a quiz."""
    
    QUESTION_TYPES = [
        ("mcq", "Multiple Choice"),
        ("true_false", "True/False"),
        ("short_answer", "Short Answer"),
    ]
    
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="questions"
    )
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES
    )
    question_text = models.TextField()
    explanation = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["quiz", "order"]
    
    def __str__(self):
        return f"{self.quiz.title} - Q{self.order + 1}"


class QuestionOption(models.Model):
    """An option/choice for a multiple choice question."""
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="options"
    )
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ["question", "order"]
    
    def __str__(self):
        return f"{self.question.question_text[:50]} - {self.option_text[:50]}"


class QuizAttempt(models.Model):
    """A user's attempt at a quiz."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    
    class Meta:
        ordering = ["-started_at"]
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"


class Answer(models.Model):
    """A user's answer to a single question."""
    
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )
    selected_option = models.ForeignKey(
        QuestionOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["attempt", "question__order"]
    
    def __str__(self):
        return f"{self.attempt} - Q{self.question.order + 1}"
