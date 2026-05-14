from django.contrib import admin
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 1
    fields = ["option_text", "is_correct", "order"]


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ["question_text", "question_type", "order"]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "created_at", "question_count"]
    search_fields = ["title", "description"]
    inlines = [QuestionInline]
    
    def question_count(self, obj):
        return obj.questions.count()
    
    question_count.short_description = "Questions"


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["question_text", "question_type", "quiz", "order"]
    list_filter = ["question_type", "quiz"]
    search_fields = ["question_text"]
    inlines = [QuestionOptionInline]


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ["option_text", "question", "is_correct", "order"]
    list_filter = ["is_correct", "question__quiz"]
    search_fields = ["option_text", "question__question_text"]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ["user", "quiz", "started_at", "completed_at", "score", "correct_answers"]
    list_filter = ["quiz", "started_at", "completed_at"]
    search_fields = ["user__username", "quiz__title"]
    readonly_fields = ["started_at", "completed_at", "score"]


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ["attempt", "question", "is_correct", "answered_at"]
    list_filter = ["is_correct", "answered_at"]
    search_fields = ["attempt__user__username", "question__question_text"]
    readonly_fields = ["answered_at"]
