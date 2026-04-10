from rest_framework import serializers

from .models import StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = [
            "id",
            "title",
            "study_duration",
            "break_duration",
            "subject",
            "status",
            "pinned",
            "focusScore",
            "streakscore",
            "date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "date", "created_at", "updated_at"]

    def validate_status(self, value: str):
        if value not in {"in_progress", "completed"}:
            raise serializers.ValidationError("Invalid status.")
        return value


class AdminStudySessionSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = StudySession
        fields = [
            "id",
            "user_id",
            "username",
            "title",
            "study_duration",
            "break_duration",
            "subject",
            "status",
            "pinned",
            "focusScore",
            "streakscore",
            "date",
            "created_at",
            "updated_at",
        ]
