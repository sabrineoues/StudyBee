from gradio_client import Client, handle_file

# Hugging Face Space client
client = Client("yas123456789/emotion-recognition")

# Normalize labels across all models
LABEL_MAPPING = {
    "fearful": "fear",
    "surprised": "surprise"
}


async def predict_voice(audio_path: str):

    try:

        # Call Hugging Face Gradio API
        result = client.predict(
            handle_file(audio_path),
            api_name="/predict_emotion"
        )

        print(f"Voice API raw result: {result}")

        prediction_text = result[0]
        probabilities = result[1]

        print(f"Voice prediction_text: {prediction_text}")
        print(f"Voice probabilities: {probabilities}")

        # Extract main label
        label = prediction_text.split("(")[0].strip().lower()

        # Normalize main prediction label
        normalized_label = LABEL_MAPPING.get(
            label,
            label
        )

        # Normalize probabilities labels
        normalized_predictions = {}

        for k, v in probabilities.items():

            normalized_key = LABEL_MAPPING.get(
                k.lower(),
                k.lower()
            )

            normalized_predictions[normalized_key] = float(v)

        confidence = max(normalized_predictions.values()) if normalized_predictions else 0.0

        return {
            "model": "voice",
            "prediction": normalized_label,
            "confidence": confidence,
            "predictions": normalized_predictions
        }

    except Exception as e:
        print(f"Voice API error: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            "model": "voice",
            "error": str(e)
        }