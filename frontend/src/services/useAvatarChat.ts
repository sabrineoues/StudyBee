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

const BASE = "http://localhost:8000";

// Clé localStorage pour persister l'historique
const HISTORY_KEY = "buzzy_history";

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: Message[]) {
  try {
    // Garder seulement les 50 derniers messages
    const trimmed = history.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function useAvatarChat() {
  const [history, setHistory] = useState<Message[]>(loadHistory);
  const [avatarState, setAvatarState] = useState<AvatarState>({
    emotion:      "neutral",
    isTalking:    false,
    isListening:  false,
    speechBubble: history.length > 0
      ? `Bon retour ! 🐝 On continuait à parler de "${history[history.length - 1]?.content.slice(0, 30)}..."`
      : "Salut ! Je suis Buzzy 🐝 Parle-moi !",
    isThinking:   false,
  });

  const recognitionRef    = useRef<any>(null);
  const isListeningRef    = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});

  // ── Fallback Web Speech ──────────────────────────────────────
  const speakFallback = useCallback((
    text:    string,
    emotion: AvatarEmotion,
    lang:    string
  ) => {
    window.speechSynthesis.cancel();
    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.lang   = lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-SA" : "en-US";
    utterance.rate   = emotion === "happy" ? 1.2 : emotion === "sad" ? 0.88 : 1.05;
    utterance.pitch  = emotion === "happy" ? 1.5 : emotion === "sad" ? 0.85 : 1.35;
    utterance.onstart = () => setAvatarState(s => ({ ...s, isTalking: true }));
    utterance.onend   = () => {
      setAvatarState(s => ({ ...s, isTalking: false, emotion: "neutral" }));
      setTimeout(() => startListeningRef.current(), 500);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Jouer audio Edge TTS ─────────────────────────────────────
  const playAudio = useCallback((
    b64:          string,
    emotion:      AvatarEmotion,
    fallbackText: string,
    lang:         string
  ) => {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    setAvatarState(s => ({ ...s, isTalking: true }));
    audio.onended = () => {
      setAvatarState(s => ({ ...s, isTalking: false, emotion: "neutral" }));
      setTimeout(() => startListeningRef.current(), 500);
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

    const userMsg: Message = {
      id:      `${Date.now()}-user`,
      role:    "user",
      content: text,
    };

    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    saveHistory(newHistory);

    try {
      // Envoyer les 10 derniers messages pour contexte
      const contextHistory = newHistory.slice(-10).map(m => ({
        role:    m.role,
        content: m.content,
      }));

      const res = await fetch(`${BASE}/api/avatar/chat/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message: text,
          history: contextHistory,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setAvatarState(s => ({
          ...s,
          isThinking:   false,
          emotion:      "sad",
          speechBubble: "Oups, une erreur s'est produite.",
        }));
        return;
      }

      const emotion      = data.emotion as AvatarEmotion;
      const responseText = data.text    as string;
      const lang         = (data.lang   as string) || "fr";

      const modelMsg: Message = {
        id:      `${Date.now()}-model`,
        role:    "model",
        content: responseText,
      };

      const finalHistory = [...newHistory, modelMsg];
      setHistory(finalHistory);
      saveHistory(finalHistory);

      setAvatarState(s => ({
        ...s,
        isThinking:   false,
        emotion,
        speechBubble: responseText,
      }));

      if (data.audio) {
        playAudio(data.audio, emotion, responseText, lang);
      } else {
        speakFallback(responseText, emotion, lang);
      }

    } catch {
      setAvatarState(s => ({
        ...s,
        isThinking:   false,
        emotion:      "sad",
        speechBubble: "Erreur de connexion.",
      }));
    }
  }, [history, speakFallback, playAudio]);

  // ── Speech-to-Text ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListeningRef.current) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Utilise Chrome pour la reconnaissance vocale.");
      return;
    }

    const recognition           = new SpeechRecognitionAPI();
    recognition.lang            = "fr-FR";
    recognition.continuous      = false;
    recognition.interimResults  = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setAvatarState(s => ({
        ...s,
        isListening:  true,
        speechBubble: "Je t'écoute... 🐝",
        emotion:      "neutral",
      }));
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAvatarState(s => ({ ...s, speechBubble: transcript }));
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setAvatarState(s => ({ ...s, isListening: false }));
    };

    recognition.onend = () => {
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendMessage]);

  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    isListeningRef.current = false;
    setAvatarState(s => ({ ...s, isListening: false }));
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    setAvatarState(s => ({ ...s, speechBubble: text }));
    sendMessage(text);
  }, [sendMessage]);

  const clearHistory = useCallback(() => {
    window.speechSynthesis.cancel();
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setAvatarState({
      emotion:      "neutral",
      isTalking:    false,
      isListening:  false,
      speechBubble: "Salut ! Je suis Buzzy 🐝 Parle-moi !",
      isThinking:   false,
    });
  }, []);

  return {
    avatarState,
    history,
    toggleListening,
    sendText,
    clearHistory,
  };
}