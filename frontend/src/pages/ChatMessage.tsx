import { useState } from "react";
import { type Message, type VoiceSettings, chatbotService } from "../services/chatbotService";
import { MermaidDiagram } from "./MermaidDiagram";

interface ChatMessageProps {
  message:       Message;
  voiceSettings: VoiceSettings;
}

function extractMermaid(text: string): { code: string | null; rest: string } {
  const match = text.match(/```mermaid\s*([\s\S]*?)```/);
  if (!match) return { code: null, rest: text };
  return {
    code: match[1].trim(),
    rest: text.replace(/```mermaid[\s\S]*?```/g, "").trim(),
  };
}

function renderMarkdown(text: string): string {
  return text
    .replace(
      /^## (.+)$/gm,
      '<h3 class="text-base font-bold text-primary mt-3 mb-1">$1</h3>'
    )
    .replace(
      /^### (.+)$/gm,
      '<h4 class="text-sm font-semibold text-primary/80 mt-2 mb-1">$1</h4>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<li class="ml-4 list-decimal text-sm"><strong>$1.</strong> $2</li>'
    )
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

const BADGE_COLORS: Record<string, string> = {
  diagram:  "bg-purple-100 text-purple-700",
  workflow: "bg-green-100  text-green-700",
  summary:  "bg-blue-100   text-blue-700",
  answer:   "bg-gray-100   text-gray-600",
};

export function ChatMessage({ message, voiceSettings }: ChatMessageProps) {
  const [speaking, setSpeaking]   = useState(false);
  const [audioRef, setAudioRef]   = useState<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (audioRef) {
      audioRef.pause();
      setAudioRef(null);
      setSpeaking(false);
      return;
    }
    try {
      const blob  = await chatbotService.speak(message.text, voiceSettings);
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudioRef(audio);
      setSpeaking(true);
      audio.onended = () => {
        setSpeaking(false);
        setAudioRef(null);
        URL.revokeObjectURL(url);
      };
      audio.play();
    } catch (e: unknown) {
      console.error("TTS error:", e);
      setSpeaking(false);
    }
  };

  // ── System ───────────────────────────────────────────────────────
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-tertiary-container/30 px-4 py-1 text-xs font-medium text-on-tertiary-container italic">
          {message.text}
        </span>
      </div>
    );
  }

  // ── User ─────────────────────────────────────────────────────────
  if (message.role === "user") {
    return (
      <div className="ml-auto flex max-w-[85%] flex-row-reverse gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
          <span className="material-symbols-outlined text-sm text-white">
            person
          </span>
        </div>
        <div className="space-y-1 text-right">
          <div className="rounded-tl-xl rounded-b-xl bg-primary p-4 text-white shadow-md">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          {message.badge && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                BADGE_COLORS[message.intent || "answer"]
              }`}
            >
              {message.badge}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Assistant ────────────────────────────────────────────────────
  const { code, rest } = extractMermaid(message.text);

  return (
    <div className="flex max-w-[95%] gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
        <span className="material-symbols-outlined text-sm text-on-secondary-container">
          smart_toy
        </span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="rounded-tr-xl rounded-b-xl bg-white p-5 shadow-sm">
          {/* Mermaid diagram */}
          {code && <MermaidDiagram code={code} />}

          {/* Texte explicatif après le diagramme */}
          {rest && (
            <div
              className="mt-3 text-sm leading-relaxed text-on-surface"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(rest) }}
            />
          )}

          {/* Texte seul (pas de mermaid) */}
          {!code && !rest && (
            <div
              className="text-sm leading-relaxed text-on-surface"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
            />
          )}
        </div>

        {/* Bouton écouter */}
        <button
          onClick={handleSpeak}
          className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-medium text-outline transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[14px]">
            {speaking ? "stop" : "volume_up"}
          </span>
          {speaking ? "Arrêter" : "Écouter"}
        </button>
      </div>
    </div>
  );
}
