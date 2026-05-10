"""Cognitive Training — Django admin registration."""

from django.contrib import admin

from .models import (
    CognitiveSession,
    CognitiveTask,
    CognitiveTrial,
    RLAgentState,
    UserCognitiveProfile,
)


@admin.register(CognitiveTask)
class CognitiveTaskAdmin(admin.ModelAdmin):
    list_display = ("slug", "display_name", "min_difficulty", "max_difficulty")
    search_fields = ("slug", "display_name")
    readonly_fields = ("id",)


class CognitiveTrialInline(admin.TabularInline):
    model = CognitiveTrial
    readonly_fields = (
        "trial_index", "stimulus", "response",
        "is_correct", "reaction_time_ms", "error_type", "timestamp",
    )
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(CognitiveSession)
class CognitiveSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user", "task", "difficulty", "accuracy",
        "avg_reaction_time_ms", "reward", "started_at", "ended_at",
    )
    list_filter = ("task__slug", "difficulty")
    search_fields = ("user__username",)
    readonly_fields = (
        "id", "user", "task", "started_at", "ended_at",
        "difficulty", "task_params", "total_trials", "correct_trials",
        "accuracy", "avg_reaction_time_ms", "error_breakdown",
        "reward", "rl_action",
    )
    inlines = [CognitiveTrialInline]

    def has_add_permission(self, request):
        return False


@admin.register(CognitiveTrial)
class CognitiveTrialAdmin(admin.ModelAdmin):
    list_display = (
        "id", "session", "trial_index", "is_correct",
        "reaction_time_ms", "error_type",
    )
    list_filter = ("is_correct", "error_type")
    readonly_fields = (
        "id", "session", "trial_index", "stimulus", "response",
        "is_correct", "reaction_time_ms", "error_type", "timestamp",
    )

    def has_add_permission(self, request):
        return False


@admin.register(UserCognitiveProfile)
class UserCognitiveProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user", "attention_score", "working_memory_score",
        "processing_speed_score", "problem_solving_score",
        "total_training_minutes", "updated_at",
    )
    search_fields = ("user__username",)
    readonly_fields = (
        "user", "attention_score", "working_memory_score",
        "processing_speed_score", "problem_solving_score",
        "task_stats", "total_training_minutes", "created_at", "updated_at",
    )


@admin.register(RLAgentState)
class RLAgentStateAdmin(admin.ModelAdmin):
    list_display = (
        "user", "task", "total_episodes",
        "last_reward", "last_loss", "updated_at",
    )
    list_filter = ("task__slug",)
    search_fields = ("user__username",)
    readonly_fields = (
        "user", "task", "total_episodes",
        "last_reward", "last_loss", "updated_at",
    )
    # Binary fields are not shown in the admin
    exclude = ("policy_weights", "value_weights", "optimizer_state")
