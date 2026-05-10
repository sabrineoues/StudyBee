import tempfile
import os
from groq import Groq
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)

INTENTS = {
    "diagram":  ["diagramme", "diagram", "schéma", "graphe", "graph", "uml", "classe"],
    "workflow": ["workflow", "flux", "processus", "étapes", "séquence", "flow"],
    "summary":  ["résumé", "résume", "synthèse", "summary", "de quoi parle", "présente"],
}

def detect_intent(text: str) -> str:
    t = text.lower()
    for intent, keywords in INTENTS.items():
        if any(k in t for k in keywords):
            return intent
    return "answer"

def transcribe_audio(file) -> dict:
    suffix = os.path.splitext(file.name)[-1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="fr",
                response_format="verbose_json",
                prompt="StudyBuddy assistant étudiant. Diagramme, workflow, résumé, chatbot, PDF."
            )

        text = response.text.strip()

        if hasattr(response, "segments") and response.segments:
            avg_confidence = sum(
                s.get("avg_logprob", 0) for s in response.segments
            ) / len(response.segments)
            if avg_confidence < -1.0:
                return {
                    "transcript":     "",
                    "intent":         "answer",
                    "language":       "fr",
                    "low_confidence": True
                }

        intent = detect_intent(text)
        return {
            "transcript":     text,
            "intent":         intent,
            "language":       getattr(response, "language", "fr"),
            "low_confidence": False
        }

    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass