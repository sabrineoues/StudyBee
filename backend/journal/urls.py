# backend/journal/urls.py
from django.urls import path
from .views import analyze_journal, delete_journal, get_habits, get_my_journals, save_habits

urlpatterns = [
    path('analyze/', analyze_journal),
    path('history/', get_my_journals),
    path('delete/<int:id>/', delete_journal),  # 👈 NEW
    path('habits/', get_habits),
    path('habits/save/', save_habits),
]