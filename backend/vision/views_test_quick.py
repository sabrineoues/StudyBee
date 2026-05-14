from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.blink_detector import run_blink_detection

@api_view(["GET"])
def fatigue_test_quick(request):
    """Run a short 5-second blink detection test and return the result immediately."""
    result = run_blink_detection(duration_seconds=5, camera_index=0)
    return Response(result)
