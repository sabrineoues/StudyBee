import re
import json
import base64
import asyncio
import io
import edge_tts
from groq import Groq
from django.conf import settings

import re
import json
import base64
import asyncio
import io
import edge_tts
from groq import Groq
from django.conf import settings

# Voix plus jeunes et enjouées — moins bébé, plus compagnon
VOICES = {
    "fr": "fr-FR-EloiseNeural",   # jeune féminine naturelle
    "en": "en-US-JennyNeural",    # jeune, amicale, chaleureuse
    "ar": "ar-SA-ZariyahNeural",  # féminine, claire
}

VOICE_STYLE = {
    "happy":    {"rate": "+12%", "pitch": "+10Hz"},
    "sad":      {"rate": "-8%",  "pitch": "-3Hz" },
    "thinking": {"rate": "-3%",  "pitch": "+5Hz" },
    "neutral":  {"rate": "+8%",  "pitch": "+8Hz" },
}

SYSTEM_PROMPT = """
Tu es Buzzy 🐝, un compagnon d'apprentissage bienveillant, intelligent et attachant.
Tu parles TOUJOURS dans la même langue que l'étudiant (français, anglais, arabe).

🎯 Ta mission :
- Aider l'étudiant à comprendre en profondeur
- Développer son autonomie et sa réflexion
- L'encourager à progresser et croire en lui
- Réduire son stress et ses blocages
- Le guider pour qu'il apprenne à apprendre par lui-même

🧠 Ton intelligence :
Tu combines :
- Une intelligence académique (explications claires, structurées, logiques)
- Une intelligence émotionnelle (compréhension des émotions, soutien, motivation)

💬 Ton style de communication :
- Clair, simple et compréhensible
- Pédagogique (tu expliques comme un bon professeur)
- Empathique (tu comprends ce que ressent l'étudiant)
- Motivant (tu encourages toujours)
- Naturel et humain (jamais robotique)
- Tu adaptes ton niveau selon l'étudiant
- Tu peux utiliser "Bzzz!" ou "🍯" occasionnellement

✨ Ta manière de répondre :
- Tu simplifies les idées complexes
- Tu donnes des explications utiles et concrètes
- Tu peux reformuler pour mieux faire comprendre
- Tu guides l'étudiant au lieu de juste donner la réponse
- Tu aides à développer la logique et la réflexion

❤️ Intelligence émotionnelle :
- Si l'étudiant est stressé → tu rassures et simplifies
- S'il est perdu → tu clarifies étape par étape
- S'il réussit → tu félicites avec enthousiasme
- S'il doute → tu renforces sa confiance
- Tu détectes implicitement son état émotionnel

Tu réponds TOUJOURS en JSON avec ce format exact :
{
  "text": "ta réponse (max 3 phrases, naturelle et chaleureuse)",
  "emotion": "neutral",
  "lang": "fr"
}

Règles émotion:
- happy    → succès, bonne humeur, encouragement, progression
- sad      → stress, tristesse, fatigue, découragement, blocage
- thinking → question complexe, réflexion, analyse, explication
- neutral  → conversation normale

Le champ "lang": "fr" pour français, "en" pour anglais, "ar" pour arabe.
Réponds UNIQUEMENT en JSON valide, rien d'autre.
"""

def get_client():
    return Groq(api_key=settings.GROQ_API_KEY)

async def generate_edge_tts(text: str, lang: str, emotion: str) -> bytes:
    voice  = VOICES.get(lang, VOICES["fr"])
    style  = VOICE_STYLE.get(emotion, VOICE_STYLE["neutral"])
    clean  = re.sub(r'[🐝🍯✨🌸🤔❤️🎯🧠💬✨]', '', text).strip()
    if not clean:
        clean = "Je suis là pour toi !"

    communicate = edge_tts.Communicate(
        text=clean,
        voice=voice,
        rate=style["rate"],
        pitch=style["pitch"],
    )

    audio_data = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])

    audio_data.seek(0)
    return audio_data.read()

def generate_buzzy_voice(text: str, lang: str, emotion: str) -> bytes | None:
    try:
        loop  = asyncio.new_event_loop()
        audio = loop.run_until_complete(generate_edge_tts(text, lang, emotion))
        loop.close()
        return audio if len(audio) > 0 else None
    except Exception as e:
        print(f"Edge TTS error: {e}")
        return None

def chat_with_avatar(message: str, conversation_history: list) -> dict:
    try:
        client   = get_client()
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for msg in conversation_history[-10:]:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})

        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # modèle plus puissant pour meilleure réponse émotionnelle
            messages=messages,
            temperature=0.85,
            max_tokens=200,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'```json|```', '', raw).strip()

        try:
            data    = json.loads(raw)
            text    = data.get("text",    "Je suis là pour toi ! 🐝")
            emotion = data.get("emotion", "neutral")
            lang    = data.get("lang",    "fr")
            if emotion not in ("happy", "sad", "thinking", "neutral"):
                emotion = "neutral"
            if lang not in ("en", "fr", "ar"):
                lang = "fr"
        except Exception:
            text    = raw
            emotion = "neutral"
            lang    = "fr"

        audio_bytes = generate_buzzy_voice(text, lang, emotion)
        audio_b64   = base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else None

        return {
            "text":    text,
            "emotion": emotion,
            "lang":    lang,
            "audio":   audio_b64,
        }

    except Exception as e:
        print(f"ERREUR AVATAR: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_client():
    return Groq(api_key=settings.GROQ_API_KEY)

async def generate_edge_tts(text: str, lang: str, emotion: str) -> bytes:
    """Génère audio avec Edge TTS et retourne les bytes."""
    voice  = VOICES.get(lang, VOICES["en"])
    style  = VOICE_STYLE.get(emotion, VOICE_STYLE["neutral"])

    # Nettoyer le texte
    clean  = re.sub(r'[🐝🍯✨🌸🤔]', '', text).strip()
    if not clean:
        clean = "Bzzz!"

    # Créer le communicator Edge TTS
    communicate = edge_tts.Communicate(
        text=clean,
        voice=voice,
        rate=style["rate"],
        pitch=style["pitch"],
    )

    # Collecter les chunks audio
    audio_data = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])

    audio_data.seek(0)
    return audio_data.read()

def generate_buzzy_voice(text: str, lang: str, emotion: str) -> bytes | None:
    """Wrapper synchrone pour Edge TTS."""
    try:
        loop  = asyncio.new_event_loop()
        audio = loop.run_until_complete(generate_edge_tts(text, lang, emotion))
        loop.close()
        return audio
    except Exception as e:
        print(f"Edge TTS error: {e}")
        return None

def chat_with_avatar(message: str, conversation_history: list) -> dict:
    try:
        client   = get_client()
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for msg in conversation_history[-6:]:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})

        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.9,
            max_tokens=150,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'```json|```', '', raw).strip()

        try:
            data    = json.loads(raw)
            text    = data.get("text",    "Bzzz! Je suis là pour toi ! 🐝")
            emotion = data.get("emotion", "neutral")
            lang    = data.get("lang",    "fr")
            if emotion not in ("happy", "sad", "thinking", "neutral"):
                emotion = "neutral"
            if lang not in ("en", "fr", "ar"):
                lang = "fr"
        except Exception:
            text    = raw
            emotion = "neutral"
            lang    = "fr"

        # Générer audio Edge TTS
        audio_bytes = generate_buzzy_voice(text, lang, emotion)
        audio_b64   = base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else None

        return {
            "text":    text,
            "emotion": emotion,
            "lang":    lang,
            "audio":   audio_b64,
        }

    except Exception as e:
        print(f"ERREUR AVATAR: {e}")
        import traceback
        traceback.print_exc()
        raise