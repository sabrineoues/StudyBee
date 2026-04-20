"""Cognitive Training — URL configuration."""

from django.urls import path

from . import views

app_name = "cognitive"

urlpatterns = [
    # Tasks
    path("tasks/",
         views.CognitiveTaskListView.as_view(),
         name="task-list"),
    path("tasks/<slug:slug>/",
         views.CognitiveTaskDetailView.as_view(),
         name="task-detail"),

    # Sessions
    path("sessions/start/",
         views.StartSessionView.as_view(),
         name="session-start"),
    path("sessions/<int:session_id>/complete/",
         views.CompleteSessionView.as_view(),
         name="session-complete"),
    path("sessions/",
         views.SessionListView.as_view(),
         name="session-list"),
    path("sessions/<int:session_id>/",
         views.SessionDetailView.as_view(),
         name="session-detail"),

    # Profile
    path("profile/",
         views.CognitiveProfileView.as_view(),
         name="profile"),
    path("profile/history/",
         views.ProfileHistoryView.as_view(),
         name="profile-history"),
    path("profile/leaderboard/",
         views.LeaderboardView.as_view(),
         name="leaderboard"),
]
