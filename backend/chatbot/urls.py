from django.urls import path
from . import views

urlpatterns = [
    path("api/analyze-pdf/",             views.analyze_pdf,      name="analyze_pdf"),
    path("api/summary/",                 views.generate_summary, name="summary"),
    path("api/diagram/",                 views.generate_diagram, name="diagram"),
    path("api/workflow/",                views.generate_workflow,name="workflow"),
    path("api/answer/",                  views.answer_questions, name="answer"),
    path("api/history/<str:session_id>/",views.get_history,      name="history"),
    path("api/clear/<str:session_id>/",  views.clear_history,    name="clear"),
    path("api/transcribe/", views.transcribe, name="transcribe"),
    path("api/speak/", views.speak, name="speak"),
    path("api/avatar/chat/", views.avatar_chat, name="avatar_chat"),
]