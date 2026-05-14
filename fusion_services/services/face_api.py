from gradio_client import Client, handle_file

# Hugging Face client
client = Client("nessmakarnit/pi2026")

# Normalize labels if needed
LABEL_MAPPING = {
    "fear": "fear",
    "surprise": "surprise"
}


async def predict_face(image_path: str):

    try:

        result = client.predict(
            image=handle_file(image_path),
            api_name="/predict_emotion"
        )

        # Main prediction
        prediction = result["label"].lower()

        normalized_prediction = LABEL_MAPPING.get(
            prediction,
            prediction
        )

        # Convert confidences list → dictionary
        normalized_predictions = {}

        for item in result["confidences"]:

            label = item["label"].lower()

            normalized_label = LABEL_MAPPING.get(
                label,
                label
            )

            normalized_predictions[normalized_label] = float(
                item["confidence"]
            )

        return {
            "model": "face",
            "prediction": normalized_prediction,
            "confidence": normalized_predictions.get(
                normalized_prediction,
                0.0
            ),
            "predictions": normalized_predictions
        }

    except Exception as e:

        return {
            "model": "face",
            "error": str(e)
        }