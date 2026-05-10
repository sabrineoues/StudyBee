# from elevenlabs.client import ElevenLabs  # COMMENTÉ
# from elevenlabs import VoiceSettings      # COMMENTÉ
# from django.conf import settings          # COMMENTÉ

# Nouvelle version avec edge-tts
import edge_tts
import asyncio

def text_to_speech(text, output_file="output.mp3"):
    """Convertit du texte en audio avec edge-tts"""
    voice = "fr-FR-DeniseNeural"
    
    async def generate():
        tts = edge_tts.Communicate(text, voice)
        await tts.save(output_file)
    
    asyncio.run(generate())
    return output_file