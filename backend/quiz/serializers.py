from rest_framework import serializers
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ["id", "option_text", "order"]


class QuestionDetailSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ["id", "question_type", "question_text", "explanation", "order", "options"]


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "questions", "created_at"]


class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "question_count", "created_at"]
    
    def get_question_count(self, obj):
        return obj.questions.count()


class AnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question_text", read_only=True)
    option_text = serializers.CharField(source="selected_option.option_text", read_only=True)
    
    class Meta:
        model = Answer
        fields = ["id", "question", "question_text", "selected_option", "option_text", "text_answer", "is_correct"]


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "quiz_title", "started_at", "completed_at",
            "score", "total_questions", "correct_answers", "answers"
        ]


class QuizAttemptListSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = ["id", "quiz", "quiz_title", "started_at", "completed_at", "score", "correct_answers", "total_questions", "percentage"]
    
    def get_percentage(self, obj):
        if obj.total_questions == 0:
            return 0
        return (obj.correct_answers / obj.total_questions) * 100


class CreateAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    text_answer = serializers.CharField(required=False, allow_blank=True)
