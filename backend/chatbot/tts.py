import re
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from django.conf import settings

client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

VOICES = {
    "female_soft":   "cgSgspJ2msm6clMCkdW9",  # Jessica — française naturelle
    "female_calm":   "EXAVITQu4vr4xnSDxMaL",  # Bella — calme
    "male_deep":     "TxGEqnHWrfWFTfGW9XjX",  # Josh — grave
    "male_friendly": "yoZ06aMxZJJ28mfd3POQ",  # Sam — amical
}

def clean_text(text: str) -> str:
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'[#*_`>]', '', text)
    text = re.sub(r'\n+', ' ', text)
    text = text.strip()
    if len(text) > 2500:
        text = text[:2500] + "..."
    return text

def text_to_speech(text: str, voice: str = "female_soft",
                   stability: float = 0.5,
                   similarity_boost: float = 0.75,
                   style: float = 0.3,
                   speed: float = 1.0) -> bytes:

    clean    = clean_text(text)
    voice_id = VOICES.get(voice, VOICES["female_soft"])

    audio = client.text_to_speech.convert(
        voice_id=voice_id,
        text=clean,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=stability,
            similarity_boost=similarity_boost,
            style=style,
            speed=speed,
        ),
        output_format="mp3_44100_128",
    )

    return b"".join(audio)