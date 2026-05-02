
from rest_framework.decorators import api_view, parser_classes
from .avatar_service import chat_with_avatar
import json
from .speech import transcribe_audio
from .tts import text_to_speech
from django.http import HttpResponse
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from .models import ChatSession, Message
from .rag_engine import (
    extract_chunks, store_chunks,
    generate_with_rag, delete_session_chunks
)



def get_or_create_session(session_id):
    session, _ = ChatSession.objects.get_or_create(session_id=session_id)
    return session

def save_exchange(session, user_msg, assistant_msg):
    Message.objects.create(chat_session=session, role="user",      content=user_msg)
    Message.objects.create(chat_session=session, role="assistant", content=assistant_msg)

@api_view(["POST"])
@parser_classes([MultiPartParser])
def analyze_pdf(request):
    file       = request.FILES.get("file")
    session_id = request.data.get("session_id", "default")
    if not file:
        return Response({"error": "Fichier manquant"}, status=400)
    chunks = extract_chunks(file)
    count  = store_chunks(session_id, chunks)
    get_or_create_session(session_id)
    return Response({"message": f"PDF analysé — {count} chunks stockés"})

@api_view(["POST"])
def generate_summary(request):
    session_id = request.data.get("session_id", "default")
    result     = generate_with_rag(session_id, "résumé du document", "summary")
    save_exchange(get_or_create_session(session_id), "Résumé", result)
    return Response({"result": result})

@api_view(["POST"])
def generate_diagram(request):
    session_id = request.data.get("session_id", "default")
    result     = generate_with_rag(session_id, "diagramme du document", "diagram")
    save_exchange(get_or_create_session(session_id), "Diagramme", result)
    return Response({"result": result})

@api_view(["POST"])
def generate_workflow(request):
    session_id = request.data.get("session_id", "default")
    result     = generate_with_rag(session_id, "workflow du document", "workflow")
    save_exchange(get_or_create_session(session_id), "Workflow", result)
    return Response({"result": result})

@api_view(["POST"])
def answer_questions(request):
    session_id = request.data.get("session_id", "default")
    question   = request.data.get("question", "")
    if not question:
        return Response({"error": "Question manquante"}, status=400)
    result = generate_with_rag(session_id, question, "answer")
    save_exchange(get_or_create_session(session_id), question, result)
    return Response({"result": result})

@api_view(["GET"])
def get_history(request, session_id):
    session  = get_or_create_session(session_id)
    messages = session.messages.values("role", "content", "created_at")
    return Response(list(messages))

@api_view(["DELETE"])
def clear_history(request, session_id):
    session = get_or_create_session(session_id)
    session.messages.all().delete()
    delete_session_chunks(session_id)
    return Response({"message": "Historique et chunks effacés"})

@api_view(["POST"])
@parser_classes([MultiPartParser])
def transcribe(request):
    audio = request.FILES.get("audio")
    if not audio:
        return Response({"error": "Fichier audio manquant"}, status=400)

    try:
        result     = transcribe_audio(audio)
        session_id = request.data.get("session_id", "default")
        variation  = int(request.data.get("variation", 1))
        intent     = result["intent"]
        transcript = result["transcript"]

        # Audio trop bruité ou incompréhensible
        if result.get("low_confidence") or not transcript:
            return Response({
                "error": "Audio incompréhensible. Parle plus clairement ou rapproche-toi du micro."
            }, status=400)

        if intent in ("diagram", "workflow", "summary"):
            generated = generate_with_rag(session_id, transcript, intent, variation)
            save_exchange(
                get_or_create_session(session_id),
                f"[Vocal] {transcript}",
                generated
            )
            return Response({
                "transcript":    transcript,
                "intent":        intent,
                "result":        generated,
                "auto_executed": True
            })

        return Response({
            "transcript":    transcript,
            "intent":        intent,
            "auto_executed": False
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def speak(request):
    text             = request.data.get("text", "")
    voice            = request.data.get("voice", "female_soft")
    stability        = float(request.data.get("stability", 0.5))
    similarity_boost = float(request.data.get("similarity_boost", 0.75))
    style            = float(request.data.get("style", 0.3))
    speed            = float(request.data.get("speed", 1.0))

    if not text:
        return Response({"error": "Texte manquant"}, status=400)

    try:
        audio_bytes = text_to_speech(
            text, voice, stability, similarity_boost, style, speed
        )
        return HttpResponse(
            audio_bytes,
            content_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=response.mp3"}
        )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def avatar_chat(request):
    message = request.data.get("message", "")
    history = request.data.get("history", [])

    print(f"Message reçu: {message}")
    print(f"History: {history}")

    if not message:
        return Response({"error": "Message manquant"}, status=400)

    try:
        result = chat_with_avatar(message, history)
        print(f"Résultat: {result}")
        return Response(result)
    except Exception as e:
        print(f"ERREUR VIEW: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)