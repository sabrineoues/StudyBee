import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { BeeAvatar } from "../components/BeeAvatar/BeeAvatar";
import { useAvatarChat, type Message } from "../services/useAvatarChat";
import { emotionThemes } from "../emotionThemes";
import { useTranslation } from "react-i18next";

// Phrases d'accueil aléatoires de Buzzy
const GREETINGS = [
  "Bzzz ! Comment tu vas aujourd'hui ? 🐝",
  "Salut ! Je suis là pour toi ✨",
  "Hey ! Raconte-moi ta journée 🍯",
  "Bzzz ! Prêt à parler ? 🌸",
];

const WRITING_PROMPTS = [
  "What made you smile today?",
  "What challenged you the most today?",
  "Did you feel stressed or relaxed today?",
  "What are you grateful for right now?",
  "Did something unexpected happen today?",
  "How was your energy level today?",
  "What would you like to improve tomorrow?",
];

const mapEmotion = (label: string) => {
  switch (label.toLowerCase()) {
    case "joy":    return "motivated";
    case "sadness": return "sad";
    case "anger":
    case "fear":   return "stressed";
    case "calm":   return "calm";
    default:       return "calm";
  }
};

export function JournalPage() {
  const { t } = useTranslation();

  // ── State existant ────────────────────────────────────────────
  const [history, setHistory]           = useState<any[]>([]);
  const [text, setText]                 = useState("");
  const [result, setResult]             = useState<any>(null);
  // sidebar removed; keep state removed
  const [showModal, setShowModal]       = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [habits, setHabits] = useState({
    hydration: 3,
    walk: false,
    sleepEarly: false,
    sleepQuality: 6,
  });

  // ── State Buzzy ───────────────────────────────────────────────
  const [inputText, setInputText]       = useState("");
  const [buzzyOpen, setBuzzyOpen]       = useState(false);
  const [greeting]                      = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const chatEndRef                      = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);
  const btnControls                     = useAnimationControls();
  const habitsReadyRef                  = useRef(false);
  const habitsSaveTimerRef              = useRef<number | null>(null);

  const { avatarState, history: chatHistory, toggleListening, sendText, clearHistory } = useAvatarChat();

  // ── Effects existants ─────────────────────────────────────────
  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) return;

        const response = await fetch("http://127.0.0.1:8000/api/journal/habits/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        setHabits({
          hydration: Number(data.hydration ?? 3),
          walk: Boolean(data.walk ?? false),
          sleepEarly: Boolean(data.sleep_early ?? false),
          sleepQuality: Number(data.sleep_quality ?? 6),
        });
      } catch (err) {
        console.error(err);
      } finally {
        window.setTimeout(() => {
          habitsReadyRef.current = true;
        }, 0);
      }
    };

    void loadHabits();
  }, []);

  useEffect(() => {
    if (!habitsReadyRef.current) return;

    if (habitsSaveTimerRef.current) {
      window.clearTimeout(habitsSaveTimerRef.current);
    }

    habitsSaveTimerRef.current = window.setTimeout(() => {
      const saveHabits = async () => {
        try {
          const token = localStorage.getItem("access");
          if (!token) return;

          await fetch("http://127.0.0.1:8000/api/journal/habits/save/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              hydration: habits.hydration,
              walk: habits.walk,
              sleepEarly: habits.sleepEarly,
              sleepQuality: habits.sleepQuality,
            }),
          });
        } catch (err) {
          console.error(err);
        }
      };

      void saveHabits();
    }, 300);

    return () => {
      if (habitsSaveTimerRef.current) {
        window.clearTimeout(habitsSaveTimerRef.current);
      }
    };
  }, [habits]);

  useEffect(() => {
    if (!result) return;
    const emotion = mapEmotion(result.emotion.label);
    const theme   = emotionThemes[emotion];
    if (!theme) return;
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  }, [result]);

  // ── Effects Buzzy ─────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (buzzyOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [buzzyOpen]);

  useEffect(() => {
    if (!buzzyOpen) {
      btnControls.start({
        y: [0, -10, 0],
        rotate: [-3, 3, -3],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      });
    } else {
      btnControls.stop();
    }
  }, [buzzyOpen, btnControls]);

  // ── Handlers existants ────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("access");
      const res   = await axios.get("http://127.0.0.1:8000/api/journal/history/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const analyzeJournal = async () => {
    try {
      const token = localStorage.getItem("access");
      const res   = await axios.post("http://127.0.0.1:8000/api/journal/analyze/", { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) { console.error(err); }
  };

  const appendPrompt = (prompt: string) => {
    setText((currentText) => {
      if (!currentText.trim()) return prompt;
      return `${currentText}\n${prompt}`;
    });
  };

  const incrementHydration = () => {
    setHabits((current) => ({
      ...current,
      hydration: Math.min(8, current.hydration + 1),
    }));
  };

  const toggleWalk = () => {
    setHabits((current) => ({
      ...current,
      walk: !current.walk,
    }));
  };

  const toggleSleepEarly = () => {
    setHabits((current) => ({
      ...current,
      sleepEarly: !current.sleepEarly,
    }));
  };

  const deleteEntry = async (id: number) => {
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`http://127.0.0.1:8000/api/journal/delete/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHistory();
    } catch (err) { console.error(err); }
  };

  // ── Handler Buzzy ─────────────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim()) return;
    sendText(inputText.trim());
    setInputText("");
  };

  

  const statusText =
    avatarState.isListening ? "Je t'écoute... 🎤"
    : avatarState.isThinking  ? "Je réfléchis... 🤔"
    : avatarState.isTalking   ? "Je parle... 💬"
    : "En ligne ✨";

  // `result` is kept for optional display elsewhere; no inline summary here.

  return (
    <StudyBeeShell>
      <main className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 pb-10 pt-24 md:px-8">

        {/* compact history button (replaces full sidebar) */}
        <div className="fixed left-6 top-28 z-40">
          <motion.button
            onClick={() => setShowHistory(true)}
            aria-label="Open journal history"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 shadow-lg ring-1 ring-surface-200/20 transition-transform hover:shadow-2xl"
          >
            <span className="material-symbols-outlined text-[19px] text-primary">manage_history</span>
            <span className="text-xs font-semibold text-primary">Historique</span>
          </motion.button>
        </div>

        {/* ── Main Content ─────────────────────────────────────── */}
        <div className="mx-auto w-full max-w-6xl space-y-6">

          {/* Header */}
          <section className="mx-auto w-full max-w-5xl text-center">
            <h1 className="text-5xl font-extrabold text-primary">
              Be gentle with yourself today.
            </h1>
            <p className="text-on-surface-variant mt-2">Write freely. No judgment.</p>
          </section>

          {/* Journal + Writing Prompts */}
          <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-6">
              {/* Text Area */}
              <section className="rounded-2xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/20">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="w-full min-h-[230px] rounded-xl bg-surface p-4 text-on-surface outline-none transition focus:ring-2 focus:ring-primary/25"
                  placeholder="Write your thoughts..."
                />
                <div className="mt-4">
                  <button
                    onClick={analyzeJournal}
                    className="mt-4 rounded-lg bg-primary px-6 py-2 text-white"
                  >
                    Save my daily reflection
                  </button>
                </div>
                {/* Removed inline emotion/physical summary */}
              </section>

              {/* Removed emotion & energy cards per user request */}
            </div>

            <aside className="lg:sticky lg:top-24 h-fit rounded-2xl bg-surface-container-low/80 p-4 shadow-sm ring-1 ring-outline-variant/20 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Writing Prompts</h2>
              </div>
              <div className="space-y-2.5">
                {WRITING_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => appendPrompt(prompt)}
                    className="w-full rounded-2xl border border-outline-variant/25 bg-surface px-3 py-2.5 text-left text-[13px] leading-snug text-on-surface transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </aside>
          </section>

          {/* Gentle Habits */}
          <section className="md:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">{t("journal.gentleHabits")}</h2>
              <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="group flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/20 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">water_drop</span>
                  </div>
                  <button
                    type="button"
                    onClick={incrementHydration}
                    disabled={habits.hydration >= 8}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-outline transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t("journal.hydration")}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{habits.hydration}</span>
                    <span className="text-[11px] text-outline">/ 8 glasses</span>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant/70">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(habits.hydration / 8) * 100}%` }}
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/20 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high md:col-span-2 xl:col-span-1">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container">hotel</span>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {habits.sleepQuality}/10
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-on-surface">Sleep Quality</p>
                  <p className="text-[10px] text-outline">Rate your rest today</p>
                </div>

                <div className="relative">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(habits.sleepQuality / 10) * 100}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={habits.sleepQuality}
                    onChange={(event) => {
                      const nextValue = Number((event.target as HTMLInputElement).value);
                      setHabits((current) => ({
                        ...current,
                        sleepQuality: nextValue,
                      }));
                    }}
                    className="sleep-slider absolute inset-0 h-full w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/20 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-highest">
                    <span className="material-symbols-outlined text-on-surface-variant">directions_walk</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleWalk}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      habits.walk ? "bg-primary text-white" : "bg-surface text-primary hover:bg-primary/10"
                    }`}
                  >
                    {habits.walk ? "Undo" : "Log"}
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t("journal.dailyWalk")}</p>
                  <p className="text-[11px] text-outline">{habits.walk ? "Completed" : "Not started"}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant/70">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: habits.walk ? "100%" : "0%" }}
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/20 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">bedtime</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={habits.sleepEarly}
                    onChange={toggleSleepEarly}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t("journal.restEarly")}</p>
                  <p className="text-[11px] text-outline">{habits.sleepEarly ? "Completed" : "Not started"}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant/70">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: habits.sleepEarly ? "100%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Modal ────────────────────────────────────────────────── */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Journal Entry</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <p className="mb-4">{selectedEntry.text}</p>
            <div className="flex justify-between text-sm mb-2">
              <span>Emotion: {selectedEntry.emotion.label}</span>
              <span>Energy: {selectedEntry.physical.label}</span>
            </div>
            <p className="text-xs text-outline mb-4">
              {new Date(selectedEntry.created_at).toLocaleString()}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Close</button>
              <button
                onClick={() => { deleteEntry(selectedEntry.id); setShowModal(false); }}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History modal (compact button opens this) ───────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                </div>
                <h2 className="font-bold text-lg">Journal History</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-on-surface-variant">{history.length} entrées</span>
                <button onClick={() => setShowHistory(false)} className="rounded-md px-3 py-1 hover:bg-surface/50">✕</button>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 bg-surface-container-low">
              {history.length === 0 && <p className="text-sm text-on-surface-variant">No entries yet.</p>}
              {history.map((entry) => (
                <div key={entry.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-on-surface line-clamp-2">{entry.text}</p>
                      <p className="text-xs text-outline mt-2">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs rounded-full bg-primary/5 px-2 py-1 text-primary">{entry.emotion.label}</span>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { setSelectedEntry(entry); setShowModal(true); }}
                          className="text-primary text-sm"
                        >View</button>
                        <button
                          onClick={() => { deleteEntry(entry.id); }}
                          className="text-red-500 text-sm"
                        >Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bouton flottant Buzzy 🐝 ─────────────────────────────── */}
      <AnimatePresence>
        {!buzzyOpen && (
          <motion.div
            key="fab"
            className="fixed bottom-24 right-6 z-50 flex flex-col items-center gap-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
            >
              Parler à Buzzy 🐝
            </motion.div>

            {/* Bouton */}
            <motion.button
              animate={btnControls}
              onClick={() => setBuzzyOpen(true)}
              whileTap={{ scale: 0.9 }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-2xl"
            >
              <span className="text-3xl">🐝</span>
              {/* Pulse */}
              <motion.span
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay Buzzy ────────────────────────────────────────── */}
      <AnimatePresence>
        {buzzyOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
  key="backdrop"
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  onClick={() => setBuzzyOpen(false)}
  className="fixed inset-0 z-40 overflow-hidden"
  style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
/>

            {/* Particules */}
            {["🌸","⭐","🍯","✨","🌟","💛"].map((emoji, i) => (
              <motion.span key={i} className="fixed z-40 pointer-events-none text-xl"
                style={{ left: `${20 + i * 12}%`, top: "50%" }}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: -(60 + i * 20), x: (i % 2 === 0 ? 1 : -1) * (20 + i * 10) }}
                transition={{ delay: 0.05 * i, duration: 1, ease: "easeOut" }}
              >{emoji}</motion.span>
            ))}

            {/* Panel centré */}
            <motion.div
              key="buzzy-panel"
              initial={{ opacity: 0, scale: 0.8, y: 60 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{   opacity: 0, scale: 0.85, y: 40 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl"
                style={{
                  background: "var(--color-surface-container-low, #f8f7ff)",
                  border: "1px solid var(--color-outline-variant, #e0deff)",
                  maxHeight: "90vh",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-primary">
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl"
                  >
                    🐝
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base">Buzzy</p>
                    <motion.p
                      key={statusText}
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-white/80"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${avatarState.isListening ? "bg-red-300 animate-ping" : "bg-green-300 animate-pulse"}`} />
                      {statusText}
                    </motion.p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={clearHistory} title="Effacer l'historique"
                      className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25">
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    </button>
                    <button onClick={() => setBuzzyOpen(false)}
                      className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Avatar + speech bubble */}
                <div className="flex flex-col items-center bg-primary/5 py-4">
                  <BeeAvatar
                    emotion={avatarState.emotion}
                    isTalking={avatarState.isTalking}
                    isListening={avatarState.isListening}
                    speechBubble={undefined}
                  />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={avatarState.speechBubble}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="mx-6 mt-3 rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-on-surface shadow-sm border border-outline-variant/20"
                    >
                      {avatarState.speechBubble || greeting}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Historique messages */}
                <div
                  className="flex-1 overflow-y-auto space-y-2 px-4 py-3"
                  style={{ maxHeight: "200px", scrollbarWidth: "thin", scrollbarColor: "var(--color-primary) transparent" }}
                >
                  {chatHistory.length === 0 ? (
                    <p className="text-center text-sm italic text-on-surface-variant py-4">{greeting}</p>
                  ) : (
                    chatHistory.slice(-20).map((msg: Message) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-surface-container text-on-surface rounded-bl-sm border border-outline-variant/20"
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Actions */}
                <div className="border-t border-outline-variant/20 px-4 pb-5 pt-3 space-y-3">
                  {/* Bouton micro */}
                  <motion.button
                    onClick={toggleListening}
                    disabled={avatarState.isThinking || avatarState.isTalking}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-md ${
                      avatarState.isListening
                        ? "bg-red-500 animate-pulse"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    <motion.span
                      animate={avatarState.isListening ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="material-symbols-outlined text-[18px]"
                    >
                      {avatarState.isListening ? "stop" : "mic"}
                    </motion.span>
                    {avatarState.isListening  ? "Arrêter l'écoute"
                     : avatarState.isThinking ? "Je réfléchis..."
                     : avatarState.isTalking  ? "Buzzy parle..."
                     :                          "Parler à Buzzy 🐝"}
                  </motion.button>

                  {/* Input texte */}
                  {/* Input texte */}
<div className="flex gap-2">
  <input
    ref={inputRef}
    type="text"
    value={inputText}
    onChange={(event) => setInputText(event.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
    placeholder="Écris à Buzzy..."
    className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
  />
  <motion.button
    onClick={handleSend}
    disabled={!inputText.trim()}
    whileTap={{ scale: 0.9 }}
    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
  >
    <span className="material-symbols-outlined text-[16px]">send</span>
  </motion.button>
</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </StudyBeeShell>
  );
}