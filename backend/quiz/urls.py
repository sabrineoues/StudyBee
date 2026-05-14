from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, QuizAttemptViewSet

router = DefaultRouter()
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"attempts", QuizAttemptViewSet, basename="quiz-attempt")

urlpatterns = [
    path("", include(router.urls)),
]
