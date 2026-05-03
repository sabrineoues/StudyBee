# backend/journal/urls.py
from django.urls import path
from .views import analyze_journal, delete_journal, get_my_journals

urlpatterns = [
    path('analyze/', analyze_journal),
    path('history/', get_my_journals),
    path('delete/<int:id>/', delete_journal),  # 👈 NEW
]