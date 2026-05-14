from django.urls import path
from .views import (
    detect_fatigue,
    fatigue_start,
    fatigue_status,
    fatigue_stop,
    phone_events_today,
    phone_record_event,
    phone_start,
    phone_status,
    phone_stop,
)
from .views_test_quick import fatigue_test_quick

urlpatterns = [
    path('detect-fatigue/', detect_fatigue),
    path('fatigue/start/', fatigue_start),
    path('fatigue/status/', fatigue_status),
    path('fatigue/stop/', fatigue_stop),
    path('phone/start/', phone_start),
    path('phone/status/', phone_status),
    path('phone/events/today/', phone_events_today),
    path('phone/events/record/', phone_record_event),
    path('phone/stop/', phone_stop),
    path('fatigue/test-quick/', fatigue_test_quick),
]
