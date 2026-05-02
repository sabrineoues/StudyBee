import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Link } from "react-router-dom";
import { BeeAvatar } from "../components/BeeAvatar/BeeAvatar";
import { useAvatarChat, type Message } from "../services/useAvatarChat";

// Phrases d'accueil aléatoires de Buzzy
const GREETINGS = [
  "Bzzz ! Comment tu vas aujourd'hui ? 🐝",
  "Salut ! Je suis là pour toi ✨",
  "Hey ! Raconte-moi ta journée 🍯",
  "Bzzz ! Prêt à parler ? 🌸",
];

export function JournalPage() {
  const [inputText, setInputText]   = useState("");
  const [buzzyOpen, setBuzzyOpen]   = useState(false);
  const [greeting]                  = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const chatEndRef                  = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const btnControls                 = useAnimationControls();

  const { avatarState, history, toggleListening, sendText, clearHistory } = useAvatarChat();

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Focus input quand Buzzy s'ouvre
  useEffect(() => {
    if (buzzyOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [buzzyOpen]);

  // Animation bouton flottant
  useEffect(() => {
    if (!buzzyOpen) {
      btnControls.start({
        y: [0, -10, 0],
        rotate: [-3, 3, -3],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      });
    } else {
      btnControls.stop();
    }
  }, [buzzyOpen, btnControls]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendText(inputText.trim());
    setInputText("");
  };

  const statusText = avatarState.isListening ? "Je t'écoute... 🎤"
    : avatarState.isThinking  ? "Je réfléchis... 🤔"
    : avatarState.isTalking   ? "Je parle... 💬"
    : "En ligne ✨";

  return (
    <div className="min-h-screen bg-surface pb-32 text-on-surface">
      <main className="mx-auto max-w-5xl px-6 pt-24">

        {/* Header */}
        <motion.header className="mb-12 space-y-4"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}>
          <span className="label-sm text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Daily Journal • Oct 24
          </span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary md:text-6xl">
            Be gentle with yourself today.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            It&apos;s okay to feel quiet. This space is here for whatever thoughts need to rest on the page.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

          {/* Emotional Check-in */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-8">
            <div className="relative z-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">How&apos;s your heart?</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Emotional Check-in</span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                {[
                  { icon: "sentiment_very_dissatisfied", active: false },
                  { icon: "sentiment_dissatisfied",      active: true  },
                  { icon: "sentiment_neutral",           active: false },
                  { icon: "sentiment_satisfied",         active: false },
                ].map(({ icon, active }, i) => (
                  <button key={icon} type="button"
                    className={`flex flex-col items-center justify-center rounded-full bg-surface-container-lowest transition-transform hover:scale-105 ${active ? "h-20 w-20 scale-110 ring-2 ring-primary" : "h-14 w-14"}`}>
                    <span className={`material-symbols-outlined ${active ? "text-3xl text-primary" : "text-on-surface-variant"}`}
                      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                    {active && <span className="mt-1 text-[10px] font-bold text-primary">SAD</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-tertiary-container/20 blur-3xl" />
          </section>

          {/* Energy */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-4">
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Energy Level</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Vitality</span>
              </div>
              <div className="flex flex-grow flex-col justify-center gap-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Low</span><span>High</span>
                </div>
                <div className="relative py-4">
                  <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-variant" />
                  <div className="absolute top-1/2 h-1 w-1/2 -translate-y-1/2 rounded-full bg-primary" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-primary ring-4 ring-primary/20 hover:scale-125 transition-transform" />
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-primary">5<span className="text-sm text-on-surface-variant/50">/10</span></span>
                </div>
              </div>
            </div>
          </section>

          {/* Journal */}
          <section className="rounded-xl bg-surface-container-highest p-1 md:col-span-12 md:p-2">
            <div className="rounded-lg bg-surface-container-lowest p-8 shadow-sm md:p-12">
              <div className="flex flex-col gap-12 md:flex-row">
                <div className="flex-1 space-y-6">
                  <h3 className="flex items-center gap-3 text-2xl font-bold text-primary">
                    <span className="material-symbols-outlined">edit_note</span>Dear Sanctuary...
                  </h3>
                  <textarea className="min-h-[300px] w-full border-none bg-transparent text-lg italic leading-relaxed text-on-surface placeholder:text-outline-variant focus:ring-0"
                    placeholder="Start typing here. There's no rush, no judgment." />
                </div>
                <div className="space-y-8 md:w-64">
                  <div>
                    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Prompt of the hour</h4>
                    <p className="text-sm italic leading-relaxed text-secondary">&quot;What does safety feel like in your body right now?&quot;</p>
                  </div>
                  <div className="border-t border-outline-variant/15 pt-6">
                    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Atmosphere</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold text-on-secondary-container">Rainy Day Lo-fi</span>
                      <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant">Rainfall</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tomorrow */}
          <section className="rounded-xl bg-surface-container-low p-8 md:col-span-12">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
              </div>
              <div className="w-full flex-grow">
                <h3 className="mb-2 text-lg font-bold text-primary">What would you like tomorrow to bring you?</h3>
                <input type="text" placeholder="A moment of peace, a productive start..."
                  className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 italic text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </section>

          {/* Habits */}
          <section className="md:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Gentle Habits</h2>
              <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: "water_drop",       label: "Hydration",  sub: "3 of 8 glasses", pct: "37.5%", bg: "bg-tertiary-container",       tc: "text-on-tertiary-container",  done: false },
                { icon: "self_improvement", label: "Meditation", sub: "Completed",       pct: "100%",  bg: "bg-secondary-container",      tc: "text-on-secondary-container", done: true  },
                { icon: "blind",            label: "Daily Walk", sub: "Not started",     pct: "0%",    bg: "bg-surface-container-highest", tc: "text-on-surface-variant",     done: false },
                { icon: "bedtime",          label: "Rest Early", sub: "10:00 PM Goal",   pct: "50%",   bg: "bg-tertiary-container",       tc: "text-on-tertiary-container",  done: false },
              ].map(h => (
                <div key={h.label} className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${h.bg}`}>
                      <span className={`material-symbols-outlined ${h.tc}`}>{h.icon}</span>
                    </div>
                    {h.done
                      ? <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      : <button type="button" className="material-symbols-outlined text-outline hover:text-primary">add_circle</button>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{h.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${h.done ? "text-primary" : "text-on-surface-variant"}`}>{h.sub}</p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full rounded-full bg-primary" style={{ width: h.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ── Bouton flottant 🐝 ─────────────────────────────────── */}
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

      {/* ── Overlay Buzzy ─────────────────────────────────────── */}
      <AnimatePresence>
        {buzzyOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setBuzzyOpen(false)}
              className="fixed inset-0 z-40"
              style={{ backdropFilter: "blur(16px)", background: "rgba(0,0,0,0.4)" }}
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
                {/* Header — couleurs de la page */}
                <div className="flex items-center gap-3 px-5 py-4 bg-primary">
                  {/* Avatar miniature animé */}
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
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

                {/* Avatar grand + speech bubble */}
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
                <div className="flex-1 overflow-y-auto space-y-2 px-4 py-3"
                  style={{ maxHeight: "200px", scrollbarWidth: "thin", scrollbarColor: "var(--color-primary) transparent" }}>
                  {history.length === 0 ? (
                    <p className="text-center text-sm italic text-on-surface-variant py-4">
                      {greeting}
                    </p>
                  ) : (
                    history.slice(-20).map((msg: Message) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                    {avatarState.isListening  ? "Arrêter l'écoute"   :
                     avatarState.isThinking   ? "Je réfléchis..."    :
                     avatarState.isTalking    ? "Buzzy parle..."      :
                                                "Parler à Buzzy 🐝"}
                  </motion.button>

                  {/* Input texte */}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                      placeholder="Écris à Buzzy..."
                      className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!inputText.trim() || avatarState.isThinking}
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full justify-around rounded-t-xl bg-background/60 px-4 pb-8 pt-4 backdrop-blur-2xl md:hidden">
        <Link to="/" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80 transition-opacity hover:opacity-100">
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">Home</span>
        </Link>
        <Link to="/journal" className="mb-2 flex scale-110 flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container p-3 text-white shadow-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">Journal</span>
        </Link>
        <Link to="/dashboard" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">Dash</span>
        </Link>
        <Link to="/sign-in" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </div>
  );
}