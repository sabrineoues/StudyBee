from django.urls import path

from .views import (
    AdminStudySessionDetailAPIView,
    AdminStudySessionListAPIView,
    StudySessionDetailAPIView,
    StudySessionListCreateAPIView,
    StudySessionStatsAPIView,
    StudySessionTaskDetailAPIView,
    StudySessionTaskListCreateAPIView,
)

urlpatterns = [
    path("sessions/", StudySessionListCreateAPIView.as_view(), name="api_sessions"),
    path("sessions/stats/", StudySessionStatsAPIView.as_view(), name="api_session_stats"),
    path("sessions/<int:session_id>/", StudySessionDetailAPIView.as_view(), name="api_session_detail"),
    path("sessions/<int:session_id>/tasks/", StudySessionTaskListCreateAPIView.as_view(), name="api_session_tasks"),
    path(
        "sessions/<int:session_id>/tasks/<int:task_id>/",
        StudySessionTaskDetailAPIView.as_view(),
        name="api_session_task_detail",
    ),
    path("admin/sessions/", AdminStudySessionListAPIView.as_view(), name="api_admin_sessions"),
    path("admin/sessions/<int:session_id>/", AdminStudySessionDetailAPIView.as_view(), name="api_admin_session_detail"),
]
