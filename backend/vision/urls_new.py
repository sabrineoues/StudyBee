from django.urls import path
from .views import detect_fatigue, fatigue_start, fatigue_status, fatigue_stop
from .views_test_quick import fatigue_test_quick

urlpatterns = [
    path('detect-fatigue/', detect_fatigue),
    path('fatigue/start/', fatigue_start),
    path('fatigue/status/', fatigue_status),
    path('fatigue/stop/', fatigue_stop),
    path('fatigue/test-quick/', fatigue_test_quick),
]
