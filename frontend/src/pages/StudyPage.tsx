import { useState, useRef, useEffect, useCallback } from "react";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { ChatMessage } from "./ChatMessage";
import {
  chatbotService,
  type Message,
  type VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
} from "../services/chatbotService";

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const SESSION_ID = "session_001";

const BEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAA9WzlnKw2cDsXYu08D_iqZ9_DW4uWWmaJSg0i2gxaFApq9m3cn_tXn2iRhGUkQlJoad4Vrt2S0S5FRxLJrnddCYZSqCHRHRlzOiBkFSQyvymkDML_RkK3CghyptPis_zpjvgKKe3fxIKCuMJcf86QktCiIbGpwju8b-ERrG2Y6CaS1pwyP-KY76b7wc6ZtOs5u_cKBI6TkAHpH6FApXkxutKcq4vujXXXiuzhkv4yrAi5HMsAd3L57FH6ynccAD-CwxOzbItlkNs";

const VOICES = [
  { value: "female_soft",   label: "Jessica — Féminine douce" },
  { value: "female_calm",   label: "Bella — Féminine calme"   },
  { value: "male_deep",     label: "Josh — Masculine grave"   },
  { value: "male_friendly", label: "Sam — Masculine amical"   },
];

// ─────────────────────────────────────────────────────────────────
// StudyPage
// ─────────────────────────────────────────────────────────────────
export function StudyPage() {
  // ── State ──────────────────────────────────────────────────────
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isRecording,   setIsRecording]   = useState(false);
  const [pdfStatus,     setPdfStatus]     = useState("");
  const [question,      setQuestion]      = useState("");
  const [showVoice,     setShowVoice]     = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // ── Refs ───────────────────────────────────────────────────────
  const variations      = useRef({ diagram: 1, workflow: 1 });
  const mediaRecorder   = useRef<MediaRecorder | null>(null);
  const audioChunks     = useRef<Blob[]>([]);
  const chatEndRef      = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Helpers ────────────────────────────────────────────────────
  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    const newMsg: Message = { ...msg, id: `${Date.now()}-${Math.random()}` };
    setMessages(prev => [...prev, newMsg]);
  }, []);

  // ── Upload PDF ────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfStatus("Analyse en cours...");
    try {
      const data = await chatbotService.analyzePDF(file, SESSION_ID);
      const msg  = data.message || data.error || "PDF analysé";
      setPdfStatus(msg);
      addMessage({ role: "system", text: msg });
      variations.current = { diagram: 1, workflow: 1 };
    } catch {
      setPdfStatus("Erreur lors de l'analyse du PDF");
    }
  };

  // ── Action (résumé / diagramme / workflow) ────────────────────
  const runAction = async (type: "summary" | "diagram" | "workflow") => {
    const labels = {
      summary:  "Génère un résumé",
      diagram:  "Génère un diagramme visuel",
      workflow: "Génère un workflow visuel",
    };
    const version =
      type !== "summary" ? variations.current[type as "diagram" | "workflow"] : 1;

    addMessage({
      role: "user",
      text: labels[type] + (type !== "summary" ? ` (v${version})` : ""),
    });

    setIsLoading(true);
    try {
      const data = await chatbotService.generate(type, SESSION_ID, version);
      addMessage({ role: "assistant", text: data.result || data.error || "" });
      if (type === "diagram" || type === "workflow") {
        variations.current[type] = (variations.current[type] % 4) + 1;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Question ─────────────────────────────────────────────────
  const askQuestion = async (q: string) => {
    if (!q.trim() || isLoading) return;
    addMessage({ role: "user", text: q });
    setIsLoading(true);
    try {
      const data = await chatbotService.answer(q, SESSION_ID);
      addMessage({ role: "assistant", text: data.result || data.error || "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    askQuestion(question);
    setQuestion("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Micro ────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(audioChunks.current, {
          type: mimeType || "audio/webm",
        });

        setIsLoading(true);
        try {
          const data = await chatbotService.transcribe(
            blob,
            SESSION_ID,
            variations.current.diagram
          );

          if (data.error) {
            addMessage({ role: "system", text: "Erreur : " + data.error });
            return;
          }

          const badgeLabels: Record<string, string> = {
            diagram:  "Diagramme",
            workflow: "Workflow",
            summary:  "Résumé",
            answer:   "Question",
          };

          addMessage({
            role:   "user",
            text:   data.transcript,
            intent: data.intent,
            badge:  badgeLabels[data.intent],
          });

          if (data.auto_executed && data.result) {
            addMessage({ role: "assistant", text: data.result });
            if (data.intent === "diagram" || data.intent === "workflow") {
              variations.current[data.intent] =
                (variations.current[data.intent] % 4) + 1;
            }
          } else {
            const res = await chatbotService.answer(data.transcript, SESSION_ID);
            addMessage({
              role: "assistant",
              text: res.result || res.error || "",
            });
          }
        } finally {
          setIsLoading(false);
        }
      };

      recorder.start(100);
      mediaRecorder.current = recorder;
      setIsRecording(true);
      addMessage({
        role: "system",
        text: "Enregistrement en cours... Clique à nouveau pour arrêter.",
      });
    } catch (e: unknown) {
      addMessage({
        role: "system",
        text: "Accès micro refusé : " + (e as Error).message,
      });
    }
  };

  // ── Clear ────────────────────────────────────────────────────
  const clearHistory = async () => {
    await chatbotService.clearHistory(SESSION_ID);
    setMessages([]);
    setPdfStatus("");
    variations.current = { diagram: 1, workflow: 1 };
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <StudyBeeShell>
      <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 px-8 pb-12 pt-24 md:flex-row">

        {/* ── LEFT PANEL ───────────────────────────────────────── */}
        <div className="flex-1 space-y-8 lg:max-w-[450px]">

          {/* Timer */}
          <section className="relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-container-low p-8 text-center shadow-sm">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5" />
            <span className="label-md mb-6 block uppercase tracking-widest text-outline">
              Deep Focus Mode
            </span>
            <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle className="text-surface-container-high" cx="128" cy="128" r="120"
                  fill="transparent" stroke="currentColor" strokeWidth="8" />
                <circle className="text-primary" cx="128" cy="128" r="120"
                  fill="transparent" stroke="currentColor"
                  strokeDasharray="753.98" strokeDashoffset="188.5" strokeWidth="8" />
              </svg>
              <div className="flex flex-col items-center">
                <span className="font-headline text-6xl font-extrabold tracking-tight text-on-surface">
                  24:59
                </span>
                <span className="mt-1 text-sm font-medium text-outline">
                  minutes remaining
                </span>
              </div>
            </div>
            <div className="flex w-full gap-4">
              <button type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                <span className="material-symbols-outlined">play_arrow</span>
                Start Session
              </button>
              <button type="button"
                className="flex w-16 items-center justify-center rounded-full bg-surface-container-highest text-primary transition-all hover:scale-105 active:scale-95">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </section>

          {/* StudyBee Tip */}
          <section className="relative flex items-start gap-4 rounded-xl bg-tertiary-container/20 p-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-tertiary-container shadow-md">
              <img alt="StudyBee" className="h-10 w-10" src={BEE_IMG} />
            </div>
            <div className="space-y-2">
              <h3 className="font-headline text-lg font-bold text-on-tertiary-container">
                StudyBee Tip
              </h3>
              <p className="text-base italic leading-relaxed text-on-tertiary-container/80">
                &quot;Hey study buddy! You&apos;ve been focused for 45 minutes.
                How about a 5-minute stretch?&quot;
              </p>
            </div>
          </section>

          {/* Progress */}
          <section className="mb-4 rounded-xl bg-surface-container-low p-6 shadow-sm">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <span className="font-headline mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary/60">
                  Current Progress
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  Session Focus
                </h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-headline text-sm font-bold text-primary">
                2/3 Goals Met
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: "66.6%" }} />
            </div>
            <p className="mt-3 text-[11px] font-medium text-outline">
              Keep going! You&apos;re almost at your session milestone.
            </p>
          </section>

          {/* Goals */}
          <section className="space-y-6 rounded-xl bg-surface-container-low p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Session Goals
              </h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                3 Pending
              </span>
            </div>
            <div className="space-y-3">
              {["Summarize Chapter 4: Neural Nets", "Complete calculus practice problems"].map(goal => (
                <div key={goal}
                  className="group flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-lowest p-4 transition-all hover:shadow-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary group-hover:bg-primary/5" />
                  <span className="flex-1 font-medium text-on-surface">{goal}</span>
                </div>
              ))}
              <div className="flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-lowest p-4 opacity-60">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <span className="material-symbols-outlined text-sm text-white"
                    style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                </div>
                <span className="flex-1 font-medium text-on-surface line-through">
                  Set up session environment
                </span>
              </div>
            </div>
            <button type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant py-4 font-semibold text-outline transition-all hover:border-primary hover:text-primary">
              <span className="material-symbols-outlined">add</span>
              Add new goal
            </button>
          </section>
        </div>

        {/* ── RIGHT PANEL — CHATBOT ─────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-container-high/50 bg-surface-container-low shadow-lg">

          {/* Header */}
          <header className="flex items-center justify-between border-b border-surface-container-highest/30 bg-surface-container-high/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                <span className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-on-surface">
                  StudyBee Explainer
                </h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  AuraFlow AI Active
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Upload PDF */}
              <input ref={fileInputRef} type="file" accept=".pdf"
                className="hidden" onChange={handleFileChange} />
              <button type="button" title="Upload PDF"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">attach_file</span>
              </button>

              {/* Voice settings */}
              <button type="button" title="Paramètres voix"
                onClick={() => setShowVoice(v => !v)}
                className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">record_voice_over</span>
              </button>

              {/* Clear */}
              <button type="button" title="Effacer"
                onClick={clearHistory}
                className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
          </header>

          {/* PDF status bar */}
          {pdfStatus && (
            <div className="border-b border-surface-container-highest/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">
              {pdfStatus}
            </div>
          )}

          {/* Voice settings panel */}
          {showVoice && (
            <div className="border-b border-surface-container-highest/20 bg-surface-container-high/30 p-4 space-y-3">
              <select
                value={voiceSettings.voice}
                onChange={e =>
                  setVoiceSettings(s => ({ ...s, voice: e.target.value }))
                }
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {VOICES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                {(["stability", "similarity_boost", "style", "speed"] as const).map(key => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">
                      {key.replace("_", " ")} : {voiceSettings[key].toFixed(1)}
                    </label>
                    <input type="range"
                      min={key === "speed" ? 0.5 : 0}
                      max={key === "speed" ? 2 : 1}
                      step={0.1}
                      value={voiceSettings[key]}
                      onChange={e =>
                        setVoiceSettings(s => ({ ...s, [key]: +e.target.value }))
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="hide-scrollbar flex-1 space-y-6 overflow-y-auto p-6"
            style={{ maxHeight: "60vh" }}>
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-2">
                  <span className="material-symbols-outlined text-4xl text-outline/30">
                    chat
                  </span>
                  <p className="text-sm text-outline">
                    Upload un PDF et commence à poser des questions
                  </p>
                </div>
              </div>
            )}
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                voiceSettings={voiceSettings}
              />
            ))}
            {isLoading && (
              <div className="flex max-w-[85%] gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                  <span className="material-symbols-outlined text-sm text-on-secondary-container">
                    smart_toy
                  </span>
                </div>
                <div className="rounded-tr-xl rounded-b-xl bg-white p-4 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i}
                        className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input footer */}
          <footer className="border-t border-surface-container-high/50 bg-surface-container-lowest p-4">
            <div className="relative">
              <textarea rows={2} value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask StudyBee anything..."
                disabled={isLoading}
                className="w-full resize-none rounded-xl border-none bg-surface-container-high p-4 pr-24 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button type="button" onClick={toggleMic} disabled={isLoading}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                    isRecording
                      ? "animate-pulse bg-red-500 text-white"
                      : "bg-surface-container-highest text-outline hover:text-primary"
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {isRecording ? "stop" : "mic"}
                  </span>
                </button>
                <button type="button" onClick={handleSend}
                  disabled={isLoading || !question.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-white shadow transition-all hover:scale-110 active:scale-95 disabled:opacity-40">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Résumé",    icon: "summarize",    type: "summary"  as const },
                { label: "Diagramme", icon: "account_tree", type: "diagram"  as const },
                { label: "Workflow",  icon: "mediation",    type: "workflow" as const },
              ].map(({ label, icon, type }) => (
                <button key={type} type="button"
                  onClick={() => runAction(type)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-full bg-secondary-container/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-secondary-container transition-all hover:bg-secondary-container disabled:opacity-40">
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </footer>
        </div>
      </main>

      <MobileBottomNav />
    </StudyBeeShell>
  );
}
