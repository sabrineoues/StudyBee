from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import JournalEntry
from ai.analyzer import analyze_text

@api_view(['POST'])
def analyze_journal(request):
    text = request.data.get("text")


    # Validate input
    if not text or not text.strip():
        return Response({"error": "Text is required"}, status=400)

    # Run AI analysis
    result = analyze_text(text)

    if "error" in result:
        return Response({"error": result["error"]}, status=500)

    try:
        # ✅ Save to database (no need for json.dumps/loads)
        entry = JournalEntry.objects.create(
            text=text,
            emotion=result["emotion"],
            physical=result["physical"]
        )
    except Exception as e:
        return Response({"error": f"Database error: {str(e)}"}, status=500)

    # Return clean response
    return Response({
        "text": text,
        "emotion": result["emotion"],
        "physical": result["physical"]
    })

