from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()


def sanitize_validation_detail(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, list):
        return [sanitize_validation_detail(item) for item in value]
    if isinstance(value, dict):
        return {key: sanitize_validation_detail(item) for key, item in value.items()}
    return value


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    print("AI SERVICE VALIDATION ERROR:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": sanitize_validation_detail(exc.errors())},
    )

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