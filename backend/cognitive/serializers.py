"""
Cognitive Training — DRF Serializers.

Follows the existing StudyBee pattern (studysessions/serializers.py):
ModelSerializers with explicit field lists and read_only_fields.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import (
    CognitiveSession,
    CognitiveTask,
    CognitiveTrial,
    UserCognitiveProfile,
)


# ─────────────────────────────────────────────────────────────────────────────
# CognitiveTask
# ─────────────────────────────────────────────────────────────────────────────

class CognitiveTaskSerializer(serializers.ModelSerializer):
    """Full task representation including scientific context."""

    class Meta:
        model = CognitiveTask
        fields = [
            "id",
            "slug",
            "display_name",
            "description",
            "brain_regions",
            "cognitive_domains",
            "research_refs",
            "icon_name",
            "min_difficulty",
            "max_difficulty",
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────────────────────
# CognitiveTrial
# ─────────────────────────────────────────────────────────────────────────────

class CognitiveTrialSerializer(serializers.ModelSerializer):
    """Read-only representation of a single trial within a session."""

    class Meta:
        model = CognitiveTrial
        fields = [
            "id",
            "trial_index",
            "stimulus",
            "response",
            "is_correct",
            "reaction_time_ms",
            "error_type",
            "timestamp",
        ]
        read_only_fields = fields


class CognitiveTrialInputSerializer(serializers.Serializer):
    """
    Write-only serializer for trial data submitted when completing a session.

    This is NOT a ModelSerializer — it validates incoming trial dicts before
    they are bulk-created by the view.
    """

    trial_index = serializers.IntegerField(min_value=0)
    stimulus = serializers.JSONField()
    response = serializers.JSONField()
    is_correct = serializers.BooleanField()
    reaction_time_ms = serializers.IntegerField(min_value=0, max_value=60000)
    error_type = serializers.CharField(
        max_length=32,
        required=False,
        default="",
        allow_blank=True,
    )

    def validate_error_type(self, value: str) -> str:
        allowed = {"", "interference", "omission", "commission"}
        if value and value not in allowed:
            raise serializers.ValidationError(
                f"error_type must be one of {sorted(allowed - {''})}, got {value!r}."
            )
        return value


# ─────────────────────────────────────────────────────────────────────────────
# CognitiveSession
# ─────────────────────────────────────────────────────────────────────────────

class CognitiveSessionListSerializer(serializers.ModelSerializer):
    """
    Compact representation for session history lists.

    Includes the task slug inline for convenience (avoids N+1 lookups).
    """

    task_slug = serializers.SlugRelatedField(
        source="task",
        slug_field="slug",
        read_only=True,
    )
    task_display_name = serializers.CharField(
        source="task.display_name",
        read_only=True,
    )
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = CognitiveSession
        fields = [
            "id",
            "task_slug",
            "task_display_name",
            "started_at",
            "ended_at",
            "difficulty",
            "total_trials",
            "correct_trials",
            "accuracy",
            "avg_reaction_time_ms",
            "error_breakdown",
            "reward",
            "rl_action",
            "duration_seconds",
        ]
        read_only_fields = fields

    def get_duration_seconds(self, obj: CognitiveSession) -> float | None:
        return obj.duration_seconds


class CognitiveSessionDetailSerializer(CognitiveSessionListSerializer):
    """Full session representation including all trials and task_params."""

    trials = CognitiveTrialSerializer(many=True, read_only=True)
    task_params_detail = serializers.JSONField(
        source="task_params",
        read_only=True,
    )

    class Meta(CognitiveSessionListSerializer.Meta):
        fields = CognitiveSessionListSerializer.Meta.fields + [
            "task_params_detail",
            "trials",
        ]
        read_only_fields = fields


class StartSessionSerializer(serializers.Serializer):
    """Input for POST /sessions/start/."""

    task = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=CognitiveTask.objects.all(),
        help_text='Task slug: "stroop", "nback", "schulte", or "kakuro".',
    )


class CompleteSessionSerializer(serializers.Serializer):
    """Input for POST /sessions/{id}/complete/."""

    ended_at = serializers.DateTimeField()
    trials = CognitiveTrialInputSerializer(many=True)

    def validate_trials(self, value: list[dict]) -> list[dict]:
        if not value:
            raise serializers.ValidationError("At least one trial is required.")
        indices = [t["trial_index"] for t in value]
        if sorted(indices) != list(range(len(value))):
            raise serializers.ValidationError(
                "trial_index values must be a contiguous 0-based sequence."
            )
        return value


# ─────────────────────────────────────────────────────────────────────────────
# Session Start Response
# ─────────────────────────────────────────────────────────────────────────────

class SessionStartResponseSerializer(serializers.Serializer):
    """Output shape for POST /sessions/start/."""

    session_id = serializers.IntegerField()
    task = serializers.CharField()
    difficulty = serializers.IntegerField()
    task_params = serializers.JSONField()
    started_at = serializers.DateTimeField()


# ─────────────────────────────────────────────────────────────────────────────
# Session Complete Response
# ─────────────────────────────────────────────────────────────────────────────

class MetricsSummarySerializer(serializers.Serializer):
    total_trials = serializers.IntegerField()
    correct = serializers.IntegerField()
    accuracy = serializers.FloatField()
    avg_reaction_time_ms = serializers.FloatField()
    error_breakdown = serializers.DictField()
    duration_seconds = serializers.FloatField()


class RLDecisionSerializer(serializers.Serializer):
    reward = serializers.FloatField()
    previous_difficulty = serializers.IntegerField()
    next_difficulty = serializers.IntegerField()
    action_taken = serializers.CharField()


class SessionCompleteResponseSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    metrics = MetricsSummarySerializer()
    rl_decision = RLDecisionSerializer()
    updated_profile = serializers.DictField()


# ─────────────────────────────────────────────────────────────────────────────
# UserCognitiveProfile
# ─────────────────────────────────────────────────────────────────────────────

class UserCognitiveProfileSerializer(serializers.ModelSerializer):
    """Read-only profile with domain scores and task stats."""

    class Meta:
        model = UserCognitiveProfile
        fields = [
            "attention_score",
            "working_memory_score",
            "processing_speed_score",
            "problem_solving_score",
            "task_stats",
            "total_training_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────────────────────
# History / Timeline
# ─────────────────────────────────────────────────────────────────────────────

class HistoryPointSerializer(serializers.Serializer):
    """Single data point for the progress timeline chart."""

    date = serializers.DateField()
    accuracy = serializers.FloatField()
    avg_rt_ms = serializers.FloatField()
    difficulty = serializers.IntegerField()
    session_count = serializers.IntegerField()


class HistoryResponseSerializer(serializers.Serializer):
    task = serializers.CharField()
    data_points = HistoryPointSerializer(many=True)


# ─────────────────────────────────────────────────────────────────────────────
# Leaderboard
# ─────────────────────────────────────────────────────────────────────────────

class LeaderboardEntrySerializer(serializers.Serializer):
    """One row in the leaderboard."""

    rank = serializers.IntegerField()
    username = serializers.CharField()
    sessions_completed = serializers.IntegerField()
    best_accuracy = serializers.FloatField()
    current_difficulty = serializers.IntegerField()
