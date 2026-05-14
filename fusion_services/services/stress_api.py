from gradio_client import Client
import json

# Hugging Face client
client = Client("tou17/study-buddy-stress-api")


async def predict_stress(payload: dict):

    try:

        result = client.predict(
            json.dumps(payload),
            api_name="/gradio_predict"
        )

        # result is returned as stringified JSON
        parsed = json.loads(result)

        # Convert stress labels to emotion-like labels
        prediction = parsed["stress_label_3"].lower()

        return {
            "model": "stress",
            "prediction": prediction,
            "confidence": parsed["confidence"],
            "stress_score": parsed["stress_score"],
            "predictions": parsed["probabilities_5"]
        }

    except Exception as e:

        return {
            "model": "stress",
            "error": str(e)
        }