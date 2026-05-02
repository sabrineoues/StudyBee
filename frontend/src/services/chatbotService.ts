const BASE = "http://localhost:8000";

export type OutputType = "summary" | "diagram" | "workflow";
export type IntentType = "diagram" | "workflow" | "summary" | "answer";

export interface Message {
  id:      string;
  role:    "user" | "assistant" | "system";
  text:    string;
  intent?: IntentType;
  badge?:  string;
}

export interface ChatbotResponse {
  result?: string;
  error?:  string;
}

export interface TranscribeResponse {
  transcript:    string;
  intent:        IntentType;
  result?:       string;
  auto_executed: boolean;
  error?:        string;
}

export interface VoiceSettings {
  voice:            string;
  stability:        number;
  similarity_boost: number;
  style:            number;
  speed:            number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voice:            "female_soft",
  stability:        0.5,
  similarity_boost: 0.75,
  style:            0.3,
  speed:            1.0,
};

export const chatbotService = {
  async analyzePDF(
    file: File,
    sessionId: string
  ): Promise<{ message?: string; error?: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sessionId);
    const res = await fetch(`${BASE}/api/analyze-pdf/`, {
      method: "POST",
      body: form,
    });
    return res.json();
  },

  async generate(
    type: OutputType,
    sessionId: string,
    variation: number
  ): Promise<ChatbotResponse> {
    const res = await fetch(`${BASE}/api/${type}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, variation }),
    });
    return res.json();
  },

  async answer(
    question: string,
    sessionId: string
  ): Promise<ChatbotResponse> {
    const res = await fetch(`${BASE}/api/answer/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, question, variation: 1 }),
    });
    return res.json();
  },

  async transcribe(
    audioBlob: Blob,
    sessionId: string,
    variation: number
  ): Promise<TranscribeResponse> {
    const form = new FormData();
    form.append("audio", audioBlob, "voice.webm");
    form.append("session_id", sessionId);
    form.append("variation", String(variation));
    const res = await fetch(`${BASE}/api/transcribe/`, {
      method: "POST",
      body: form,
    });
    return res.json();
  },

  async speak(
    text: string,
    settings: VoiceSettings
  ): Promise<Blob> {
    const res = await fetch(`${BASE}/api/speak/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice:            settings.voice,
        stability:        settings.stability,
        similarity_boost: settings.similarity_boost,
        style:            settings.style,
        speed:            settings.speed,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "TTS error");
    }
    return res.blob();
  },

  async clearHistory(sessionId: string): Promise<void> {
    await fetch(`${BASE}/api/clear/${sessionId}/`, { method: "DELETE" });
  },
};
