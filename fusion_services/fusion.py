from services.voice_api import predict_voice
from services.face_api import predict_face
from services.stress_api import predict_stress
from services.bpm_api import predict_bpm_payload

import asyncio

# -----------------------------------
# UNIVERSAL EMOTION SPACE
# -----------------------------------

EMOTIONS = [
    "happy",
    "calm",
    "neutral",
    "sad",
    "fear",
    "angry",
    "stress",
    "surprise",
    "disgust"
]

# -----------------------------------
# MODEL WEIGHTS
# -----------------------------------

WEIGHTS = {

    "voice": 0.1,

    "face": 0.6,

    "stress": 0.15,

    "bpm": 0.15
}


def resolve_weights(voice_result, face_result):

    voice_available = "predictions" in voice_result
    face_available = "predictions" in face_result

    if voice_available or face_available:
        return WEIGHTS

    # When microphone/camera are unavailable, rely mostly on stress + BPM.
    return {
        "voice": 0.0,
        "face": 0.0,
        "stress": 0.55,
        "bpm": 0.45,
    }

# -----------------------------------
# LABEL NORMALIZATION
# -----------------------------------


def normalize_emotion_label(label):

    if not isinstance(label, str):
        return None

    normalized = label.strip().lower()

    label_mapping = {

        # happy
        "joy": "happy",
        "joyful": "happy",
        "happiness": "happy",
        "happy": "happy",

        # calm
        "calm": "calm",
        "normal": "calm",

        # neutral
        "neutral": "neutral",

        # sad
        "sad": "sad",
        "sadness": "sad",

        # fear
        "fear": "fear",
        "fearful": "fear",

        # angry
        "angry": "angry",
        "anger": "angry",

        # stress
        "stress": "stress",
        "stressed": "stress",

        # surprise
        "surprise": "surprise",
        "surprised": "surprise",

        # disgust
        "disgust": "disgust"
    }

    return label_mapping.get(
        normalized,
        normalized
    )

# -----------------------------------
# BPM WRAPPER
# -----------------------------------


async def predict_bpm(stress_payload):

    result = predict_bpm_payload(
        stress_payload
    )

    if not result["success"]:

        return {

            "model": "bpm",

            "predictions": {
                "neutral": 1.0
            }
        }

    raw_result = result["result"]

    probabilities = raw_result.get(
        "probabilities",
        {}
    )

    normalized_predictions = {}

    for emotion, score in probabilities.items():

        normalized_emotion = normalize_emotion_label(
            emotion
        )

        normalized_predictions[
            normalized_emotion
        ] = float(score)

    return {

        "model": "bpm",

        "prediction": normalize_emotion_label(
            raw_result.get(
                "prediction",
                "normal"
            )
        ),

        "confidence": raw_result.get(
            "confidence",
            0.0
        ),

        "predictions": normalized_predictions
    }

# -----------------------------------
# MAIN FUSION
# -----------------------------------


async def fuse_predictions(

    audio_path,
    image_path,
    stress_payload

):

    # -----------------------------------
    # RUN ALL MODELS
    # -----------------------------------

    voice_result, face_result, stress_result, bpm_result = await asyncio.gather(

        predict_voice(audio_path),

        predict_face(image_path),

        predict_stress(stress_payload),

        predict_bpm(stress_payload)
    )

    # -----------------------------------
    # DEBUG LOGS
    # -----------------------------------

    print("VOICE RESULT:", voice_result)

    print("FACE RESULT:", face_result)

    print("STRESS RESULT:", stress_result)

    print("BPM RESULT:", bpm_result)

    active_weights = resolve_weights(voice_result, face_result)
    print("ACTIVE WEIGHTS:", active_weights)

    # -----------------------------------
    # INIT FINAL SCORES
    # -----------------------------------

    final_scores = {

        emotion: 0.0
        for emotion in EMOTIONS
    }

    # -----------------------------------
    # VOICE FUSION
    # -----------------------------------

    if "predictions" in voice_result:

        for emotion, score in voice_result[
            "predictions"
        ].items():

            normalized_emotion = normalize_emotion_label(
                emotion
            )

            if normalized_emotion in final_scores:

                final_scores[
                    normalized_emotion
                ] += (
                    float(score)
                    * active_weights["voice"]
                )

    # -----------------------------------
    # FACE FUSION
    # -----------------------------------

    if "predictions" in face_result:

        for emotion, score in face_result[
            "predictions"
        ].items():

            normalized_emotion = normalize_emotion_label(
                emotion
            )

            if normalized_emotion in final_scores:

                final_scores[
                    normalized_emotion
                ] += (
                    float(score)
                    * active_weights["face"]
                )

    # -----------------------------------
    # STRESS FUSION
    # -----------------------------------

    if "predictions" in stress_result:

        for emotion, score in stress_result[
            "predictions"
        ].items():

            normalized_emotion = normalize_emotion_label(
                emotion
            )

            if normalized_emotion in final_scores:

                final_scores[
                    normalized_emotion
                ] += (
                    float(score)
                    * active_weights["stress"]
                )

    # -----------------------------------
    # BPM FUSION
    # -----------------------------------

    if "predictions" in bpm_result:

        for emotion, score in bpm_result[
            "predictions"
        ].items():

            normalized_emotion = normalize_emotion_label(
                emotion
            )

            if normalized_emotion in final_scores:

                final_scores[
                    normalized_emotion
                ] += (
                    float(score)
                    * active_weights["bpm"]
                )

    # -----------------------------------
    # FINAL DECISION
    # -----------------------------------

    final_emotion = max(
        final_scores,
        key=final_scores.get
    )

    final_confidence = final_scores[
        final_emotion
    ]

    print("FINAL SCORES:", final_scores)

    # -----------------------------------
    # RETURN RESPONSE
    # -----------------------------------

    return {

        "final_prediction": {

            "emotion": final_emotion,

            "confidence": round(
                final_confidence,
                4
            )
        },

        "fusion_scores": {

            emotion: round(score, 4)

            for emotion, score in final_scores.items()
        },

        "individual_results": {

            "voice": voice_result,

            "face": face_result,

            "stress": stress_result,

            "bpm": bpm_result
        }
    }