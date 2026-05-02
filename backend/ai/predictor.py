def analyze_text(text):
    text = text.lower()

    emotion = "neutral"
    sentiment = "neutral"
    energy = "medium"

    if "tired" in text:
        emotion = "tired"
        energy = "low"
        sentiment = "negative"

    elif "happy" in text:
        emotion = "happy"
        energy = "high"
        sentiment = "positive"

    return {
        "emotion": emotion,
        "sentiment": sentiment,
        "energy": energy
    }