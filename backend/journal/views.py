from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JournalEntry

import requests
import os

FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8001")

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