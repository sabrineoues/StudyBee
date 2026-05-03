from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.blink_detector import (
    get_fatigue_monitor_status,
    run_blink_detection,
    start_fatigue_monitor,
    stop_fatigue_monitor,
)

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
