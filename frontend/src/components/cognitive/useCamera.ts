import { useCallback, useEffect, useRef, useState } from "react";

// Simple hook that turns the camera on (prompts for permission) and off.
// - No video element is attached (camera view is not shown)
// - No data is recorded or sent anywhere

export function useCamera() {
  const streamRef = useRef<MediaStream | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera not supported");
      return;
    }

    try {
      // Ask for camera permission (video only). This triggers the browser prompt.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Keep the stream in a ref so it can be stopped later. Do NOT attach it to any element.
      streamRef.current = stream;
      setIsOn(true);
    } catch (err: unknown) {
      setIsOn(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Camera permission denied or error");
      streamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {
        // ignore
      }
    }
    streamRef.current = null;
    setIsOn(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        streamRef.current = null;
      }
    };
  }, []);

  return { start, stop, isOn, error } as const;
}
