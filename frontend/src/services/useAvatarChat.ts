import { useState, useRef, useCallback } from "react";
import type { AvatarEmotion } from "../components/BeeAvatar/BeeAvatar";

export interface Message {
  id:      string;
  role:    "user" | "model";
  content: string;
}

export interface AvatarState {
  emotion:      AvatarEmotion;
  isTalking:    boolean;
  isListening:  boolean;
  speechBubble: string;
  isThinking:   boolean;
}

const BASE        = "http://localhost:8000";
const HISTORY_KEY = "buzzy_history";

// Détection silence
const SILENCE_THRESHOLD = 10;   // volume en dessous duquel c'est considéré silence
const SILENCE_DELAY     = 1200; // ms de silence avant d'arrêter l'écoute
const MAX_RECORD_MS     = 15000; // sécurité : max 15 secondes

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(history: Message[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
  } catch {}
}

export function useAvatarChat() {
  const [history, setHistory] = useState<Message[]>(loadHistory);

  const historyRef = useRef<Message[]>(history);
  historyRef.current = history;

  const [avatarState, setAvatarState] = useState<AvatarState>({
    emotion:      "neutral",
    isTalking:    false,
    isListening:  false,
    speechBubble: history.length > 0
      ? `Bon retour ! 🐝 On continuait à parler de "${history[history.length - 1]?.content.slice(0, 30)}..."`
      : "Salut ! Je suis Buzzy 🐝 Parle-moi !",
    isThinking: false,
  });

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const isListeningRef    = useRef(false);
  const isTalkingRef      = useRef(false);
  const isConversationOn  = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef   = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const animFrameRef      = useRef<number | null>(null);

  // ── Fallback Web Speech TTS ──────────────────────────────────
  const speakFallback = useCallback((text: string, emotion: AvatarEmotion, lang: string) => {
    window.speechSynthesis.cancel();
    const utterance   = new SpeechSynthesisUtterance(text);
    utterance.lang    = lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-SA" : "en-US";
    utterance.rate    = emotion === "happy" ? 1.2 : emotion === "sad" ? 0.88 : 1.05;
    utterance.pitch   = emotion === "happy" ? 1.5 : emotion === "sad" ? 0.85 : 1.35;
    utterance.onstart = () => {
      isTalkingRef.current = true;
      setAvatarState(s => ({ ...s, isTalking: true }));
    };
    utterance.onend = () => {
      isTalkingRef.current = false;
      setAvatarState(s => ({ ...s, isTalking: false, emotion: "neutral" }));
      if (isConversationOn.current) {
        setTimeout(() => startListeningRef.current(), 600);
      }
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Jouer audio Edge TTS ─────────────────────────────────────
  const playAudio = useCallback((b64: string, emotion: AvatarEmotion, fallbackText: string, lang: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    isTalkingRef.current = true;
    setAvatarState(s => ({ ...s, isTalking: true }));
    audio.onended = () => {
      isTalkingRef.current = false;
      setAvatarState(s => ({ ...s, isTalking: false, emotion: "neutral" }));
      if (isConversationOn.current) {
        setTimeout(() => startListeningRef.current(), 600);
      }
    };
    audio.onerror = () => speakFallback(fallbackText, emotion, lang);
    audio.play().catch(() => speakFallback(fallbackText, emotion, lang));
  }, [speakFallback]);

  // ── Envoyer message ──────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    setAvatarState(s => ({
      ...s,
      isListening:  false,
      isThinking:   true,
      emotion:      "thinking",
      speechBubble: "...",
    }));

    const userMsg: Message = { id: `${Date.now()}-user`, role: "user", content: text };
    const newHistory = [...historyRef.current, userMsg];
    setHistory(newHistory);
    saveHistory(newHistory);

    try {
      const contextHistory = newHistory.slice(-10).map(m => ({
        role: m.role, content: m.content,
      }));

      const res = await fetch(`${BASE}/api/avatar/chat/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, history: contextHistory }),
      });

      const data = await res.json();

      if (data.error) {
        setAvatarState(s => ({ ...s, isThinking: false, emotion: "sad", speechBubble: "Oups, une erreur." }));
        return;
      }

      const emotion      = data.emotion as AvatarEmotion;
      const responseText = data.text    as string;
      const lang         = (data.lang   as string) || "fr";

      const modelMsg: Message = { id: `${Date.now()}-model`, role: "model", content: responseText };
      const finalHistory = [...newHistory, modelMsg];
      setHistory(finalHistory);
      saveHistory(finalHistory);

      setAvatarState(s => ({ ...s, isThinking: false, emotion, speechBubble: responseText }));

      if (data.audio) playAudio(data.audio, emotion, responseText, lang);
      else            speakFallback(responseText, emotion, lang);

    } catch {
      setAvatarState(s => ({ ...s, isThinking: false, emotion: "sad", speechBubble: "Erreur de connexion." }));
    }
  }, [speakFallback, playAudio]);

  // ── Arrêter proprement l'analyse audio ──────────────────────
  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // ── Enregistrer avec détection de silence ───────────────────
  const startListening = useCallback(async () => {
    if (isListeningRef.current || isTalkingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
  stopAudioAnalysis();
  stream.getTracks().forEach(t => t.stop());
  isListeningRef.current = false;
  setAvatarState(s => ({ ...s, isListening: false }));

  // ✅ Si conversation arrêtée ou chunks vides → ignorer
  if (!isConversationOn.current || audioChunksRef.current.length === 0) return;

  const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });

        if (blob.size < 1000) {
          if (isConversationOn.current) {
            setTimeout(() => startListeningRef.current(), 300);
          }
          return;
        }

        setAvatarState(s => ({ ...s, isThinking: true, speechBubble: "Je transcris..." }));

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res  = await fetch(`${BASE}/api/transcribe/`, {
            method: "POST",
            body:   formData,
          });
          const data = await res.json();

          if (data.error || !data.transcript) {
            setAvatarState(s => ({ ...s, isThinking: false, speechBubble: "Je n'ai pas compris 🐝" }));
            if (isConversationOn.current) {
              setTimeout(() => startListeningRef.current(), 800);
            }
            return;
          }

          await sendMessage(data.transcript);

        } catch {
          setAvatarState(s => ({ ...s, isThinking: false, speechBubble: "Erreur transcription." }));
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      isListeningRef.current   = true;

      setAvatarState(s => ({
        ...s,
        isListening:  true,
        speechBubble: "Je t'écoute... 🐝",
        emotion:      "neutral",
      }));

      // ── Détection de silence via Web Audio API ───────────────
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source   = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speechDetected = false;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (volume > SILENCE_THRESHOLD) {
          // Parole détectée — annuler timer silence
          speechDetected = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (speechDetected) {
          // Silence après parole → démarrer timer
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }, SILENCE_DELAY);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);

      // Sécurité : arrêt max après 15 secondes
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORD_MS);

    } catch {
      setAvatarState(s => ({ ...s, isListening: false, speechBubble: "Micro non accessible." }));
    }
  }, [sendMessage, stopAudioAnalysis]);

  startListeningRef.current = startListening;

  // ── Stop conversation ────────────────────────────────────────
  const stopListening = useCallback(() => {
  isConversationOn.current = false;
  isListeningRef.current   = false;
  stopAudioAnalysis();
  if (mediaRecorderRef.current?.state === "recording") {
    mediaRecorderRef.current.stop();
    // ✅ Vider les chunks pour ignorer l'audio enregistré
    audioChunksRef.current = [];
  }
  window.speechSynthesis.cancel();
  isTalkingRef.current = false;
  setAvatarState(s => ({ ...s, isListening: false, isTalking: false, speechBubble: "Salut ! Je suis Buzzy 🐝 Parle-moi !" }));
}, [stopAudioAnalysis]);

const toggleListening = useCallback(() => {
  if (isConversationOn.current) {
    isConversationOn.current = false;
    // ✅ Vider chunks AVANT d'arrêter pour que onstop ignore le blob
    audioChunksRef.current = [];
    stopListening();
  } else {
    isConversationOn.current = true;
    startListening();
  }
}, [startListening, stopListening]);
  // ── Envoyer texte manuel ─────────────────────────────────────
  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    setAvatarState(s => ({ ...s, speechBubble: text }));
    sendMessage(text);
  }, [sendMessage]);

  // ── Effacer historique ───────────────────────────────────────
  const clearHistory = useCallback(() => {
    window.speechSynthesis.cancel();
    stopAudioAnalysis();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    isConversationOn.current = false;
    isListeningRef.current   = false;
    isTalkingRef.current     = false;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    historyRef.current = [];
    setAvatarState({
      emotion:      "neutral",
      isTalking:    false,
      isListening:  false,
      speechBubble: "Salut ! Je suis Buzzy 🐝 Parle-moi !",
      isThinking:   false,
    });
  }, [stopAudioAnalysis]);

  return { avatarState, history, toggleListening, sendText, clearHistory };
}