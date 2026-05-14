from fastapi import APIRouter
from pydantic import BaseModel
import requests

router = APIRouter()

# -----------------------------------
# HUGGING FACE BPM MODEL API
# -----------------------------------

HF_API_URL = (
    "https://sabrineoueslati-stress-detection-api.hf.space/predict"
)

# -----------------------------------
# PYDANTIC MODELS
# -----------------------------------


class Measure(BaseModel):

    bpm: float
    spo2: float


class BPMRequest(BaseModel):

    mesures: list[Measure]

# -----------------------------------
# INTERNAL HELPER
# Used by fusion.py
# -----------------------------------


def predict_bpm_payload(payload):

    try:

        response = requests.post(

            HF_API_URL,

            json=payload,

            timeout=60
        )

        result = response.json()

        print("BPM MODEL RESULT:", result)

        return {

            "success": True,

            "result": result
        }

    except Exception as e:

        print("BPM MODEL ERROR:", str(e))

        return {

            "success": False,

            "error": str(e)
        }

# -----------------------------------
# API ENDPOINT
# Direct testing endpoint
# -----------------------------------


@router.post("/bpm/analyze")
def analyze_bpm(data: BPMRequest):

    payload = {

        "mesures": [

            {
                "bpm": m.bpm,
                "spo2": m.spo2
            }

            for m in data.mesures
        ]
    }

    return predict_bpm_payload(payload)