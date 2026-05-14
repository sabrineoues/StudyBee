from fastapi import FastAPI
from pydantic import BaseModel
from gradio_client import Client
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Client("yas123456789/pomodoro-predictor")


class PredictionInput(BaseModel):
    sleep_quality: float
    stress_level: float
    mood_score: float
    hour_of_day: int
    is_weekend: bool


@app.post("/predict-focus")
async def predict_focus(data: PredictionInput):

    result = client.predict(
        sleep_quality=data.sleep_quality,
        stress_level=data.stress_level,
        mood_score=data.mood_score,
        hour_of_day=data.hour_of_day,
        is_weekend=data.is_weekend,
        api_name="/predict_focus",
    )

    return {
        "prediction": result
    }