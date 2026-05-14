from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from fusion import fuse_predictions

# BPM ROUTER
from services.bpm_api import router as bpm_router

import shutil
import json
import os

# -----------------------------------
# FASTAPI APP
# -----------------------------------

app = FastAPI()

# -----------------------------------
# INCLUDE BPM ROUTER
# -----------------------------------

app.include_router(bpm_router)

# -----------------------------------
# VALIDATION ERROR HANDLER
# -----------------------------------


def sanitize_validation_detail(value):

    if isinstance(value, bytes):

        try:
            return value.decode(
                "utf-8",
                errors="replace"
            )

        except Exception:
            return repr(value)

    if isinstance(value, list):

        return [
            sanitize_validation_detail(item)
            for item in value
        ]

    if isinstance(value, dict):

        return {
            key: sanitize_validation_detail(item)
            for key, item in value.items()
        }

    return value


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):

    print("FUSION VALIDATION ERROR:", exc.errors())

    return JSONResponse(

        status_code=422,

        content={
            "detail": sanitize_validation_detail(
                exc.errors()
            )
        },
    )

# -----------------------------------
# CORS
# -----------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# HOME
# -----------------------------------


@app.get("/")
def home():

    return {
        "message": "Fusion Service Running"
    }

# -----------------------------------
# ANALYZE
# -----------------------------------


@app.post("/analyze")
async def analyze(

    audio: UploadFile = File(...),

    image: UploadFile = File(...),

    stress_payload: str = Form(...)

):

    try:

        print("ANALYZE REQUEST RECEIVED")

        # -----------------------------------
        # SAVE AUDIO
        # -----------------------------------

        audio_path = f"temp_{audio.filename}"

        with open(audio_path, "wb") as buffer:

            shutil.copyfileobj(
                audio.file,
                buffer
            )

        # -----------------------------------
        # SAVE IMAGE
        # -----------------------------------

        image_path = f"temp_{image.filename}"

        with open(image_path, "wb") as buffer:

            shutil.copyfileobj(
                image.file,
                buffer
            )

        # -----------------------------------
        # PARSE STRESS PAYLOAD
        # -----------------------------------

        stress_payload_dict = json.loads(
            stress_payload
        )

        print(
            "STRESS PAYLOAD:",
            stress_payload_dict
        )

        # -----------------------------------
        # RUN FUSION
        # -----------------------------------

        result = await fuse_predictions(

            audio_path,

            image_path,

            stress_payload_dict

        )

        print("FUSION RESULT:", result)

        # -----------------------------------
        # CLEAN TEMP FILES
        # -----------------------------------

        if os.path.exists(audio_path):
            os.remove(audio_path)

        if os.path.exists(image_path):
            os.remove(image_path)

        # -----------------------------------
        # RETURN RESULT
        # -----------------------------------

        return result

    except Exception as e:

        print("FUSION ERROR:", str(e))

        return {
            "error": str(e)
        }