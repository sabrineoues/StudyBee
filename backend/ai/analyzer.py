from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

# Base directory

BASE_DIR = Path(__file__).resolve().parent

# Model paths

EMOTION_MODEL_PATH = BASE_DIR / "models" / "emotion_model"
PHYSICAL_MODEL_PATH = BASE_DIR / "models" / "physical_model"

# Cached models (loaded once)

emotion_model = None
physical_model = None

def get_emotion_model():
    global emotion_model

    
    if emotion_model is None:
        print("🔥 Loading emotion model...")

        tokenizer = AutoTokenizer.from_pretrained(
            EMOTION_MODEL_PATH,
            local_files_only=True
        )

        model = AutoModelForSequenceClassification.from_pretrained(
            EMOTION_MODEL_PATH,
            local_files_only=True
        )

        emotion_model = pipeline(
            "text-classification",
            model=model,
            tokenizer=tokenizer,
            top_k=2  # 🔥 allows richer predictions
        )

    return emotion_model


def get_physical_model():
    global physical_model

    if physical_model is None:
        print("🔥 Loading physical model...")

        tokenizer = AutoTokenizer.from_pretrained(
            PHYSICAL_MODEL_PATH,
            local_files_only=True
        )

        model = AutoModelForSequenceClassification.from_pretrained(
            PHYSICAL_MODEL_PATH,
            local_files_only=True
        )

        physical_model = pipeline(
            "text-classification",
            model=model,
            tokenizer=tokenizer,
            top_k=2  # 🔥 allows richer predictions
        )

    return physical_model
    

# Main function

def analyze_text(text):
    try:
        emotion_pipeline = get_emotion_model()
        physical_pipeline = get_physical_model()

    
        # Get top predictions
        emotion_results = emotion_pipeline(text)[0]
        physical_results = physical_pipeline(text)[0]

        # Take best prediction
        top_emotion = emotion_results[0]
        top_physical = physical_results[0]

        return {
                "text": text,
                "emotion": {
                    "label": top_emotion["label"],
                    "score": round(float(top_emotion["score"]), 2),
                    "top_2": [
                        {
                            "label": r["label"],
                            "score": round(float(r["score"]), 2)
                        } for r in emotion_results
                    ]
                },
                "physical": {
                    "label": top_physical["label"],
                    "score": round(float(top_physical["score"]), 2),
                    "top_2": [
                        {
                            "label": r["label"],
                            "score": round(float(r["score"]), 2)
                        } for r in physical_results
                    ]
                }
            }

    except Exception as e:
            print("🔥 ERROR:", str(e))
            return {"error": str(e)}
