from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class PhoneDistractionStatus:
    running: bool
    camera_index: int
    recent_events_count: int
    window_seconds: int
    alert_threshold: int
    alert_active: bool
    continuous_detected_seconds: float
    required_continuous_seconds: float
    last_event_at: float | None
    updated_at: float
    error: str | None = None
    message: str | None = None

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "running": self.running,
            "camera_index": self.camera_index,
            "recent_events_count": self.recent_events_count,
            "window_seconds": self.window_seconds,
            "alert_threshold": self.alert_threshold,
            "alert_active": self.alert_active,
            "continuous_detected_seconds": self.continuous_detected_seconds,
            "required_continuous_seconds": self.required_continuous_seconds,
            "last_event_at": self.last_event_at,
            "updated_at": self.updated_at,
        }
        if self.error:
            out["error"] = self.error
        if self.message:
            out["message"] = self.message
        return out


class _PhoneDistractionMonitor:
    def __init__(
        self,
        camera_index: int,
        window_seconds: int = 300,
        alert_threshold: int = 3,
        required_continuous_seconds: float = 120.0,
        event_cooldown: float = 10.0,
        max_hand_phone_distance: float = 200.0,
        phone_conf_hand: float = 0.25,
        phone_conf_global: float = 0.35,
    ):
        self._camera_index = camera_index
        self._window_seconds = max(60, int(window_seconds))
        self._alert_threshold = max(1, int(alert_threshold))
        self._required_continuous_seconds = max(10.0, float(required_continuous_seconds))
        self._event_cooldown = max(1.0, float(event_cooldown))
        self._max_hand_phone_distance = max(20.0, float(max_hand_phone_distance))
        self._phone_conf_hand = float(phone_conf_hand)
        self._phone_conf_global = float(phone_conf_global)

        self._stop = threading.Event()
        self._lock = threading.Lock()
        self._event_timestamps: list[float] = []
        self._last_event_at: float | None = None
        self._continuous_detected_since: float | None = None
        self._continuous_detected_seconds: float = 0.0

        now = time.time()
        self._status = PhoneDistractionStatus(
            running=False,
            camera_index=camera_index,
            recent_events_count=0,
            window_seconds=self._window_seconds,
            alert_threshold=self._alert_threshold,
            alert_active=False,
            continuous_detected_seconds=0.0,
            required_continuous_seconds=self._required_continuous_seconds,
            last_event_at=None,
            updated_at=now,
            error=None,
            message=None,
        )
        self._thread = threading.Thread(target=self._run, name="studybee-phone-monitor", daemon=True)

    def start(self) -> None:
        if self._thread.is_alive():
            return
        self._thread.start()

    def stop(self, timeout: float = 8.0) -> bool:
        self._stop.set()
        self._thread.join(timeout=timeout)
        return not self._thread.is_alive()

    def status(self) -> dict[str, Any]:
        with self._lock:
            return self._status.as_dict()

    def _set_status(self, **updates: Any) -> None:
        with self._lock:
            for key, value in updates.items():
                setattr(self._status, key, value)
            self._status.updated_at = time.time()

    @staticmethod
    def _distance(point1: tuple[float, float], point2: tuple[float, float]) -> float:
        return ((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2) ** 0.5

    @staticmethod
    def _get_hand_regions(frame, hand_landmarks_list):
        h, w = frame.shape[:2]
        hand_regions: list[dict[str, Any]] = []

        for hand_landmarks in hand_landmarks_list:
            x_coords = [lm.x for lm in hand_landmarks.landmark]
            y_coords = [lm.y for lm in hand_landmarks.landmark]

            padding = 50
            x1 = max(0, int(min(x_coords) * w) - padding)
            y1 = max(0, int(min(y_coords) * h) - padding)
            x2 = min(w, int(max(x_coords) * w) + padding)
            y2 = min(h, int(max(y_coords) * h) + padding)

            center_x = int(sum(x_coords) / len(x_coords) * w)
            center_y = int(sum(y_coords) / len(y_coords) * h)

            hand_regions.append(
                {
                    "bbox": (x1, y1, x2, y2),
                    "center": (center_x, center_y),
                }
            )

        return hand_regions

    def _is_phone_near_hand(self, phone_bbox: tuple[int, int, int, int], hand_regions: list[dict[str, Any]]) -> bool:
        phone_center = ((phone_bbox[0] + phone_bbox[2]) / 2.0, (phone_bbox[1] + phone_bbox[3]) / 2.0)
        for hand in hand_regions:
            distance = self._distance(phone_center, hand["center"])
            if distance <= self._max_hand_phone_distance:
                return True
        return False

    def _detect_phone_global(self, frame, model):
        detections: list[tuple[int, int, int, int]] = []
        results = model.predict(frame, conf=self._phone_conf_global, verbose=False)

        for result in results:
            if result.boxes is None or len(result.boxes) == 0:
                continue
            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]
                if cls_name != "cell phone":
                    continue
                xmin, ymin, xmax, ymax = map(int, box.xyxy[0])
                detections.append((xmin, ymin, xmax, ymax))

        return detections

    def _detect_phone_in_hands(self, frame, model, hand_regions: list[dict[str, Any]]):
        detections: list[tuple[int, int, int, int]] = []

        for hand in hand_regions:
            x1, y1, x2, y2 = hand["bbox"]
            hand_crop = frame[y1:y2, x1:x2]
            if hand_crop.size == 0:
                continue

            results = model.predict(hand_crop, conf=self._phone_conf_hand, verbose=False)

            for result in results:
                if result.boxes is None or len(result.boxes) == 0:
                    continue
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = model.names[cls_id]
                    if cls_name != "cell phone":
                        continue
                    xmin, ymin, xmax, ymax = map(int, box.xyxy[0])
                    detections.append((x1 + xmin, y1 + ymin, x1 + xmax, y1 + ymax))

        return detections

    def _prune_events(self, now: float) -> None:
        cutoff = now - self._window_seconds
        self._event_timestamps = [ts for ts in self._event_timestamps if ts >= cutoff]

    def _record_event(self, now: float) -> None:
        self._event_timestamps.append(now)
        self._last_event_at = now
        self._prune_events(now)
        # Persist event to DB if available. Fail silently if DB not configured.
        try:
            from ..models import PhoneDistractionEvent
            from django.utils import timezone

            PhoneDistractionEvent.objects.create(
                timestamp=timezone.now(),
                confidence=None,
                method="auto",
                camera_index=self._camera_index,
            )
        except Exception:
            # Don't let DB errors kill the monitor loop
            pass

    def _run(self) -> None:
        try:
            import cv2
            import mediapipe as mp
            from ultralytics import YOLO
        except Exception as exc:
            self._set_status(running=False, error="dependencies_missing", message=str(exc))
            return

        def open_capture(index: int):
            backends = []
            if hasattr(cv2, "CAP_DSHOW"):
                backends.append(cv2.CAP_DSHOW)
            if hasattr(cv2, "CAP_MSMF"):
                backends.append(cv2.CAP_MSMF)
            backends.append(cv2.CAP_ANY)

            for backend in backends:
                cap = cv2.VideoCapture(index, backend)
                if cap.isOpened():
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    cap.set(cv2.CAP_PROP_FPS, 30)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    time.sleep(0.8)
                    return cap
            return None

        cap = open_capture(self._camera_index)
        if cap is None:
            self._set_status(running=False, error="camera_open_failed")
            return

        try:
            hands = mp.solutions.hands.Hands(
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
                model_complexity=1,
            )
            model = YOLO("yolov8n.pt")
        except Exception as exc:
            cap.release()
            self._set_status(running=False, error="model_init_failed", message=str(exc))
            return

        doomscroll_start: float | None = None
        frame_count = 0
        consecutive_failures = 0

        self._set_status(running=True, error=None, message=None)

        try:
            while not self._stop.is_set():
                ok, frame = cap.read()
                now = time.time()

                if not ok or frame is None:
                    consecutive_failures += 1
                    if consecutive_failures > 20:
                        self._set_status(error="camera_frame_unavailable")
                    time.sleep(0.08)
                    continue

                consecutive_failures = 0
                frame_count += 1

                try:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    hand_results = hands.process(frame_rgb)
                except Exception:
                    time.sleep(0.05)
                    continue

                hand_regions: list[dict[str, Any]] = []
                if hand_results.multi_hand_landmarks:
                    hand_regions = self._get_hand_regions(frame, hand_results.multi_hand_landmarks)

                detections: list[tuple[int, int, int, int]] = []
                if hand_regions:
                    detections.extend(self._detect_phone_in_hands(frame, model, hand_regions))

                if frame_count % 2 == 0:
                    detections.extend(self._detect_phone_global(frame, model))

                phone_detected = False
                for bbox in detections:
                    if hand_regions:
                        if self._is_phone_near_hand(bbox, hand_regions):
                            phone_detected = True
                            break
                    else:
                        phone_detected = True
                        break

                if phone_detected:
                    if self._continuous_detected_since is None:
                        self._continuous_detected_since = now
                    self._continuous_detected_seconds = now - self._continuous_detected_since

                    since_last = float("inf") if self._last_event_at is None else now - self._last_event_at
                    if since_last >= self._event_cooldown:
                        self._record_event(now)
                else:
                    self._continuous_detected_since = None
                    self._continuous_detected_seconds = 0.0

                self._prune_events(now)
                count = len(self._event_timestamps)
                alert_active = self._continuous_detected_seconds >= self._required_continuous_seconds

                message = None
                if alert_active:
                    message = (
                        f"Phone detected continuously for {int(self._required_continuous_seconds)} seconds. "
                        "Please put it away and refocus for 2 minutes."
                    )

                self._set_status(
                    running=True,
                    recent_events_count=count,
                    alert_active=alert_active,
                    continuous_detected_seconds=self._continuous_detected_seconds,
                    required_continuous_seconds=self._required_continuous_seconds,
                    last_event_at=self._last_event_at,
                    error=None,
                    message=message,
                )

                time.sleep(0.03)
        finally:
            try:
                hands.close()
            except Exception:
                pass
            try:
                cap.release()
            except Exception:
                pass
            self._set_status(running=False)


_phone_monitor_lock = threading.Lock()
_phone_monitor: _PhoneDistractionMonitor | None = None


def start_phone_monitor(camera_index: int = 0) -> dict[str, Any]:
    global _phone_monitor
    with _phone_monitor_lock:
        if _phone_monitor is None or not _phone_monitor.status().get("running"):
            _phone_monitor = _PhoneDistractionMonitor(camera_index=camera_index)
            _phone_monitor.start()
        return _phone_monitor.status()


def get_phone_monitor_status() -> dict[str, Any]:
    with _phone_monitor_lock:
        if _phone_monitor is None:
            return PhoneDistractionStatus(
                running=False,
                camera_index=0,
                recent_events_count=0,
                window_seconds=300,
                alert_threshold=3,
                alert_active=False,
                continuous_detected_seconds=0.0,
                required_continuous_seconds=120.0,
                last_event_at=None,
                updated_at=time.time(),
                error="not_started",
                message=None,
            ).as_dict()
        return _phone_monitor.status()


def stop_phone_monitor() -> dict[str, Any]:
    global _phone_monitor
    with _phone_monitor_lock:
        if _phone_monitor is None:
            return {"stopped": True}
        stopped = _phone_monitor.stop()
        if stopped:
            _phone_monitor = None
            return {"stopped": True}
        return {"stopped": False, "error": "still_stopping"}
