from django.contrib import admin

from .models import StudySession


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "subject", "status", "user", "created_at")
	list_filter = ("status", "subject", "created_at")
	search_fields = ("title", "subject", "user__username", "user__email")
