from django.urls import path
from . import views

urlpatterns = [
    path('current/', views.get_current_reading, name='current-reading'),
    path('history/', views.get_reading_history, name='reading-history'),
    path('save/', views.save_current_reading, name='save-reading'),
]
