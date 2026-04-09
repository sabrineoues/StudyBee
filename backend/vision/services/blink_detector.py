from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class FatigueStatus:
    running: bool
    blinks_per_minute: int
    tired: bool
    camera_index: int
    face_detected: bool
    window_started_at: float
    updated_at: float
    error: str | None = None

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "running": self.running,
            "blinks_per_minute": self.blinks_per_minute,
            "tired": self.tired,
            "camera_index": self.camera_index,
            "face_detected": self.face_detected,
            "window_started_at": self.window_started_at,
            "updated_at": self.updated_at,
        }
        if self.error:
            out["error"] = self.error
        return out


class _FatigueMonitor:
    def __init__(self, camera_index: int):
        self._camera_index = camera_index
        self._stop = threading.Event()
        self._lock = threading.Lock()
        now = time.time()
        self._status = FatigueStatus(
            running=False,
            blinks_per_minute=0,
            tired=False,
            camera_index=camera_index,
            face_detected=False,
            window_started_at=now,
            updated_at=now,
            error=None,
        )
        self._thread = threading.Thread(target=self._run, name="studybee-fatigue-monitor", daemon=True)

    def start(self) -> None:
        if self._thread.is_alive():
            return
        self._thread.start()

    def stop(self, timeout: float = 5.0) -> bool:
        self._stop.set()
        self._thread.join(timeout=timeout)
        return not self._thread.is_alive()

    def status(self) -> dict[str, Any]:
        with self._lock:
            return self._status.as_dict()

    def _set_status(self, **updates: Any) -> None:
        with self._lock:
            for k, v in updates.items():
                setattr(self._status, k, v)
            self._status.updated_at = time.time()

    def _run(self) -> None:
        import platform
        from pathlib import Path

        import cv2
        import dlib
        import imutils
        from imutils import face_utils
        from scipy.spatial import distance as dist

        def eye_aspect_ratio(eye):
            A = dist.euclidean(eye[1], eye[5])
            B = dist.euclidean(eye[2], eye[4])
            C = dist.euclidean(eye[0], eye[3])
            return (A + B) / (2.0 * C)

        EYE_AR_THRESH = 0.3
        EYE_AR_CONSEC_FRAMES = 3

        # Reduce OpenCV backend warning spam when available.
        try:
            if hasattr(cv2, "utils") and hasattr(cv2.utils, "logging"):
                cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
        except Exception:
            pass

        predictor_path = Path(__file__).resolve().parent / "shape_predictor_68_face_landmarks.dat"
        if not predictor_path.exists():
            self._set_status(running=False, error="predictor_not_found")
            return

        def open_capture(index: int):
            if platform.system().lower().startswith("win") and hasattr(cv2, "CAP_DSHOW"):
                cap0 = cv2.VideoCapture(index, cv2.CAP_DSHOW)
                if cap0.isOpened():
                    return cap0

            if hasattr(cv2, "CAP_MSMF"):
                cap1 = cv2.VideoCapture(index, cv2.CAP_MSMF)
                if cap1.isOpened():
                    return cap1

            cap2 = cv2.VideoCapture(index)
            return cap2 if cap2.isOpened() else None

        cap = open_capture(self._camera_index)
        if cap is None:
            self._set_status(running=False, error="camera_open_failed")
            return

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        time.sleep(0.6)

        detector = dlib.get_frontal_face_detector()
        predictor = dlib.shape_predictor(str(predictor_path))
        (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
        (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]

        counter = 0
        face_detected = False
        consecutive_fail = 0
        window_started_at = time.time()
        blinks_in_window = 0

        self._set_status(
            running=True,
            error=None,
            face_detected=False,
            blinks_per_minute=0,
            tired=False,
            window_started_at=window_started_at,
        )

        try:
            while not self._stop.is_set():
                try:
                    ok, frame = cap.read()
                except Exception:
                    ok, frame = False, None

                if not ok or frame is None:
                    consecutive_fail += 1
                    if consecutive_fail >= 60:
                        self._set_status(error="camera_frame_unavailable")
                        time.sleep(0.2)
                    else:
                        time.sleep(0.05)
                    continue

                consecutive_fail = 0

                try:
                    frame = imutils.resize(frame, width=450)
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                except Exception:
                    self._set_status(error="frame_processing_failed")
                    time.sleep(0.05)
                    continue

                try:
                    rects = detector(gray, 0)
                except Exception:
                    rects = []

                if not rects:
                    self._set_status(face_detected=False)
                    time.sleep(0.01)
                    continue

                face_detected = True

                try:
                    rect = rects[0]
                    shape = predictor(gray, rect)
                    shape = face_utils.shape_to_np(shape)

                    leftEye = shape[lStart:lEnd]
                    rightEye = shape[rStart:rEnd]
                    ear = (eye_aspect_ratio(leftEye) + eye_aspect_ratio(rightEye)) / 2.0
                except Exception:
                    self._set_status(error="landmarks_failed")
                    time.sleep(0.02)
                    continue

                now = time.time()
                # Reset the per-minute counter every 60 seconds.
                if now - window_started_at >= 60.0:
                    minutes_passed = int((now - window_started_at) // 60.0)
                    window_started_at += 60.0 * max(1, minutes_passed)
                    blinks_in_window = 0

                if ear < EYE_AR_THRESH:
                    counter += 1
                else:
                    if counter >= EYE_AR_CONSEC_FRAMES:
                        blinks_in_window += 1
                    counter = 0

                # In this mode, `blinks_per_minute` is the number of blinks in the current 60s window.
                bpm = int(blinks_in_window)
                tired = bpm > 20
                self._set_status(
                    face_detected=face_detected,
                    blinks_per_minute=bpm,
                    tired=tired,
                    window_started_at=window_started_at,
                    error=None,
                )

                time.sleep(0.01)
        finally:
            try:
                cap.release()
            except Exception:
                pass
            self._set_status(running=False)


_monitor_lock = threading.Lock()
_monitor: _FatigueMonitor | None = None


def start_fatigue_monitor(camera_index: int = 0) -> dict[str, Any]:
    global _monitor
    with _monitor_lock:
        if _monitor is None or not _monitor.status().get("running"):
            _monitor = _FatigueMonitor(camera_index=camera_index)
            _monitor.start()
        return _monitor.status()


def get_fatigue_monitor_status() -> dict[str, Any]:
    with _monitor_lock:
        if _monitor is None:
            return FatigueStatus(
                running=False,
                blinks_per_minute=0,
                tired=False,
                camera_index=0,
                face_detected=False,
                window_started_at=time.time(),
                updated_at=time.time(),
                error="not_started",
            ).as_dict()
        return _monitor.status()


def stop_fatigue_monitor() -> dict[str, Any]:
    global _monitor
    with _monitor_lock:
        if _monitor is None:
            return {"stopped": True}
        stopped = _monitor.stop()
        if stopped:
            _monitor = None
            return {"stopped": True}
        return {"stopped": False, "error": "still_stopping"}

def run_blink_detection(duration_seconds: int = 60, camera_index: int = 0):
    import time
    from pathlib import Path
    import platform

    import cv2
    import dlib
    import imutils
    from imutils import face_utils
    from scipy.spatial import distance as dist

    def eye_aspect_ratio(eye):
        A = dist.euclidean(eye[1], eye[5])
        B = dist.euclidean(eye[2], eye[4])
        C = dist.euclidean(eye[0], eye[3])
        return (A + B) / (2.0 * C)

    EYE_AR_THRESH = 0.3
    EYE_AR_CONSEC_FRAMES = 3

    counter = 0
    total_blinks = 0
    seen_face = False

    start_time = time.time()

    detector = dlib.get_frontal_face_detector()
    predictor_path = Path(__file__).resolve().parent / "shape_predictor_68_face_landmarks.dat"
    if not predictor_path.exists():
        return {
            "blinks_per_minute": 0,
            "tired": False,
            "error": "predictor_not_found",
        }
    predictor = dlib.shape_predictor(str(predictor_path))

    (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
    (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]

    # Reduce OpenCV backend warning spam when available.
    try:
        if hasattr(cv2, "utils") and hasattr(cv2.utils, "logging"):
            cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
    except Exception:
        pass

    def open_capture(index: int):
        # On Windows, MSMF can be flaky; DSHOW is usually more stable.
        if platform.system().lower().startswith("win") and hasattr(cv2, "CAP_DSHOW"):
            cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            if cap.isOpened():
                return cap

        if hasattr(cv2, "CAP_MSMF"):
            cap = cv2.VideoCapture(index, cv2.CAP_MSMF)
            if cap.isOpened():
                return cap

        cap = cv2.VideoCapture(index)
        return cap if cap.isOpened() else None

    cap = open_capture(camera_index)
    if cap is None:
        return {
            "blinks_per_minute": 0,
            "tired": False,
            "error": "camera_open_failed",
        }

    # Best-effort camera warmup.
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    time.sleep(0.6)

    consecutive_none_frames = 0

    try:
        while True:
            now = time.time()
            elapsed_time = now - start_time
            if elapsed_time >= duration_seconds:
                break

            ok, frame = cap.read()
            if not ok or frame is None:
                consecutive_none_frames += 1
                if consecutive_none_frames >= 30 and elapsed_time >= min(5, duration_seconds):
                    return {
                        "blinks_per_minute": 0,
                        "tired": False,
                        "error": "camera_frame_unavailable",
                    }
                time.sleep(0.05)
                continue

            consecutive_none_frames = 0

            frame = imutils.resize(frame, width=450)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            rects = detector(gray, 0)
            if not rects:
                continue

            seen_face = True
            rect = rects[0]
            shape = predictor(gray, rect)
            shape = face_utils.shape_to_np(shape)

            leftEye = shape[lStart:lEnd]
            rightEye = shape[rStart:rEnd]

            ear = (eye_aspect_ratio(leftEye) + eye_aspect_ratio(rightEye)) / 2.0

            if ear < EYE_AR_THRESH:
                counter += 1
            else:
                if counter >= EYE_AR_CONSEC_FRAMES:
                    total_blinks += 1
                counter = 0
    finally:
        try:
            cap.release()
        except Exception:
            pass

    elapsed_time = max(time.time() - start_time, 0.001)
    blinks_per_minute = int(round(total_blinks * 60.0 / elapsed_time))
    tired = blinks_per_minute >= 20

    result = {
        "blinks_per_minute": blinks_per_minute,
        "tired": tired,
    }

    if not seen_face:
        result["error"] = "no_face_detected"

    return result
