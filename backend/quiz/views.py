from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Quiz, QuizAttempt, Question, QuestionOption, Answer
from .serializers import (
    QuizListSerializer,
    QuizDetailSerializer,
    QuizAttemptDetailSerializer,
    QuizAttemptListSerializer,
    CreateAnswerSerializer,
)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """View for listing and retrieving quizzes."""
    
    queryset = Quiz.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return QuizDetailSerializer
        return QuizListSerializer
    
    @action(detail=True, methods=["post"])
    def start_attempt(self, request, pk=None):
        """Start a new quiz attempt."""
        quiz = self.get_object()
        
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            total_questions=quiz.questions.count()
        )
        
        return Response(
            QuizAttemptDetailSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )


class QuizAttemptViewSet(viewsets.ViewSet):
    """View for managing quiz attempts."""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=["get"])
    def my_attempts(self, request):
        """Get all attempts by the current user."""
        attempts = QuizAttempt.objects.filter(user=request.user)
        serializer = QuizAttemptListSerializer(attempts, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get a specific attempt."""
        attempt = get_object_or_404(QuizAttempt, pk=pk, user=request.user)
        serializer = QuizAttemptDetailSerializer(attempt)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"])
    def submit_answer(self, request):
        """Submit an answer to a question."""
        serializer = CreateAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        attempt_id = request.data.get("attempt_id")
        question_id = serializer.validated_data.get("question_id")
        selected_option_id = serializer.validated_data.get("selected_option_id")
        text_answer = serializer.validated_data.get("text_answer", "")
        
        attempt = get_object_or_404(QuizAttempt, pk=attempt_id, user=request.user)
        question = get_object_or_404(Question, pk=question_id, quiz=attempt.quiz)
        
        # Check if answer already exists
        answer = Answer.objects.filter(attempt=attempt, question=question).first()
        if not answer:
            answer = Answer.objects.create(
                attempt=attempt,
                question=question
            )
        
        # Update the answer based on question type
        is_correct = False
        
        if question.question_type == "mcq":
            if selected_option_id:
                option = get_object_or_404(QuestionOption, pk=selected_option_id, question=question)
                answer.selected_option = option
                is_correct = option.is_correct
        
        elif question.question_type == "true_false":
            if selected_option_id:
                option = get_object_or_404(QuestionOption, pk=selected_option_id, question=question)
                answer.selected_option = option
                is_correct = option.is_correct
        
        elif question.question_type == "short_answer":
            answer.text_answer = text_answer
            # For short answer, mark as correct if there's a match (can implement fuzzy matching)
            is_correct = text_answer.lower().strip() == ""  # Placeholder logic
        
        answer.is_correct = is_correct
        answer.save()
        
        # Update attempt scores
        if answer.is_correct and not getattr(answer, '_was_correct_before', False):
            attempt.correct_answers = attempt.answers.filter(is_correct=True).count()
        
        attempt.save()
        
        return Response(
            {
                "id": answer.id,
                "is_correct": is_correct,
                "correct_answers": attempt.correct_answers,
                "total_questions": attempt.total_questions
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=["post"])
    def submit_quiz(self, request):
        """Complete a quiz attempt and calculate final score."""
        attempt_id = request.data.get("attempt_id")
        
        attempt = get_object_or_404(QuizAttempt, pk=attempt_id, user=request.user)
        
        # Calculate final score
        attempt.correct_answers = attempt.answers.filter(is_correct=True).count()
        if attempt.total_questions > 0:
            attempt.score = (attempt.correct_answers / attempt.total_questions) * 100
        else:
            attempt.score = 0
        
        attempt.completed_at = timezone.now()
        attempt.save()
        
        return Response(
            QuizAttemptDetailSerializer(attempt).data,
            status=status.HTTP_200_OK
        )
