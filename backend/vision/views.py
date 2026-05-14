from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.blink_detector import (
    get_fatigue_monitor_status,
    run_blink_detection,
    start_fatigue_monitor,
    stop_fatigue_monitor,
)
from .services.phone_detector import (
    get_phone_monitor_status,
    start_phone_monitor,
    stop_phone_monitor,
)
from django.utils import timezone
from .models import PhoneDistractionEvent

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@api_view(['GET'])
def detect_fatigue(request):
    try:
        duration = int(request.query_params.get("duration", "60"))
    except (TypeError, ValueError):
        duration = 60
    duration = max(5, min(duration, 120))

    try:
        camera = int(request.query_params.get("camera", "0"))
    except (TypeError, ValueError):
        camera = 0

    result = run_blink_detection(duration_seconds=duration, camera_index=camera)
    return Response(result)


@api_view(["GET"])
def fatigue_start(request):
    try:
        camera = int(request.query_params.get("camera", "0"))
    except (TypeError, ValueError):
        camera = 0
    return Response(start_fatigue_monitor(camera_index=camera))


@api_view(["GET"])
def fatigue_status(request):
    return Response(get_fatigue_monitor_status())


@api_view(["GET"])
def fatigue_stop(request):
    return Response(stop_fatigue_monitor())


@api_view(["GET"])
def phone_start(request):
    try:
        camera = int(request.query_params.get("camera", "0"))
    except (TypeError, ValueError):
        camera = 0
    return Response(start_phone_monitor(camera_index=camera))


@api_view(["GET"])
def phone_status(request):
    return Response(get_phone_monitor_status())


@api_view(["GET"])
def phone_stop(request):
    return Response(stop_phone_monitor())


@api_view(["GET"])
def phone_events_today(request):
    user = request.user if request.user and request.user.is_authenticated else None
    now = timezone.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    qs = PhoneDistractionEvent.objects.filter(timestamp__gte=start_of_day)
    if user:
        qs = qs.filter(user=user)
    count = qs.count()
    return Response({"count": count})


@api_view(["POST"]) 
def phone_record_event(request):
    user = request.user if request.user and request.user.is_authenticated else None
    data = request.data or {}
    try:
        confidence = float(data.get("confidence")) if data.get("confidence") is not None else None
    except Exception:
        confidence = None
    method = data.get("method") or "api"
    try:
        camera_index = int(data.get("camera_index")) if data.get("camera_index") is not None else None
    except Exception:
        camera_index = None

    ev = PhoneDistractionEvent.objects.create(
        user=user,
        confidence=confidence,
        method=method,
        camera_index=camera_index,
    )
    return Response({"created": True, "id": ev.id})
