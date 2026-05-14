from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JournalEntry, UserHabit

import requests
import os

FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8001")


def clamp_int(value, default, minimum, maximum):
    try:
        return max(minimum, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


def parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)

def analyze_text(text):
    try:
        response = requests.post(
            f"{FASTAPI_URL}/analyze",
            json={"text": text},
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    except Exception as e:
        print("FASTAPI ERROR:", e)
        return {
            "emotion": {"label": "unknown", "score": 0},
            "physical": {"label": "unknown", "score": 0}
        }


def habit_defaults():
    return {
        "hydration": 3,
        "walk": False,
        "sleep_early": False,
        "sleep_quality": 6,
    }


def serialize_habit(habit):
    return {
        "hydration": habit.hydration,
        "walk": habit.walk,
        "sleep_early": habit.sleep_early,
        "sleep_quality": habit.sleep_quality,
        "updated_at": habit.updated_at,
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_journal(request):
    text = request.data.get("text")

    if not text or not text.strip():
        return Response({"error": "Text is required"}, status=400)

    result = analyze_text(text)

    if "emotion" not in result or "physical" not in result:
        return Response({"error": "AI service unavailable"}, status=500)

    entry = JournalEntry.objects.create(
        user=request.user,
        text=text,
        emotion=result["emotion"],
        physical=result["physical"]
    )

    return Response({
        "text": entry.text,
        "emotion": entry.emotion,
        "physical": entry.physical
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_journals(request):
    entries = JournalEntry.objects.filter(user=request.user).order_by('-created_at')

    data = [
        {
            "id": e.id,
            "text": e.text,
            "emotion": e.emotion,
            "physical": e.physical,
            "created_at": e.created_at
        }
        for e in entries
    ]

    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_journal(request, id):
    try:
        entry = JournalEntry.objects.get(id=id, user=request.user)
    except JournalEntry.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    entry.delete()
    return Response({"message": "Deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_habits(request):
    habit, _ = UserHabit.objects.get_or_create(user=request.user, defaults=habit_defaults())
    return Response(serialize_habit(habit))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_habits(request):
    habit, _ = UserHabit.objects.get_or_create(user=request.user, defaults=habit_defaults())

    habit.hydration = clamp_int(request.data.get("hydration"), habit.hydration, 0, 8)
    habit.walk = parse_bool(request.data.get("walk"), habit.walk)
    habit.sleep_early = parse_bool(
        request.data.get("sleepEarly", request.data.get("sleep_early")),
        habit.sleep_early,
    )
    habit.sleep_quality = clamp_int(
        request.data.get("sleepQuality", request.data.get("sleep_quality")),
        habit.sleep_quality,
        0,
        10,
    )
    habit.save()

    return Response(serialize_habit(habit))

