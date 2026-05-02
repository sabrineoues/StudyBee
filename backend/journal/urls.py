# backend/journal/urls.py
from django.urls import path
from .views import analyze_journal

urlpatterns = [
    path('analyze/', analyze_journal),
]