from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# Load models ONCE
emotion_model = pipeline(
    "text-classification",
    model="bedda23/emotion-model"
)

physical_model = pipeline(
    "text-classification",
    model="bedda23/physical-model"
)

class TextInput(BaseModel):
    text: str

@app.post("/analyze")
def analyze(input: TextInput):
    try:
        emotion = emotion_model([input.text])[0]
        physical = physical_model([input.text])[0]

        return {
            "emotion": {
                "label": emotion["label"],
                "score": round(emotion["score"], 2)
            },
            "physical": {
                "label": physical["label"],
                "score": round(physical["score"], 2)
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"status": "ok"}