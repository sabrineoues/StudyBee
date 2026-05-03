import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MarketingFooter } from "../components/MarketingFooter";

import { useState, useEffect } from "react";
import axios from "axios";
import { emotionThemes } from "../emotionThemes";

// =======================
// AI LOGIC (yours)
// =======================


const mapEmotion = (label: string) => {
  switch (label.toLowerCase()) {
    case "joy": return "motivated";
    case "sadness": return "sad";
    case "anger":
    case "fear": return "stressed";
    case "calm": return "calm";
    default: return "calm";
  }
};

const emotionMap: any = {
  sad: { icon: "sentiment_dissatisfied", color: "text-blue-500", label: "SAD" },
  motivated: { icon: "sentiment_satisfied", color: "text-green-500", label: "MOTIVATED" },
  stressed: { icon: "sentiment_very_dissatisfied", color: "text-red-500", label: "STRESSED" },
  calm: { icon: "sentiment_satisfied", color: "text-teal-500", label: "CALM" }
};

export function JournalPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  // apply theme dynamically
  useEffect(() => {
    fetchHistory();
    if (!result) return;

    const emotion = mapEmotion(result.emotion.label);
    const theme = emotionThemes[emotion];
    if (!theme) return;

    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  }, [result]);

  const emotion = result ? mapEmotion(result.emotion.label) : null;
  const emotionData = emotion ? emotionMap[emotion] : null;

  const physicalToEnergy: any = {
    tired: 3,
    weak: 2,
    relaxed: 6,
    energetic: 8,
    tense: 4
  };

  const energyValue = result
    ? physicalToEnergy[result.physical.label] || 5
    : 5;

  const analyzeJournal = async () => {
    try {
      const token = localStorage.getItem("access"); // 👈 your JWT

      const response = await axios.post(
        "http://127.0.0.1:8000/api/journal/analyze/",
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 VERY IMPORTANT
          },
        }
      );

      setResult(response.data);
      fetchHistory(); // 👈 ADD THIS LINE
    } catch (error) {
      console.error(error);
    }
  };
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("access");

      const res = await axios.get(
        "http://127.0.0.1:8000/api/journal/history/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setHistory(res.data);
    } catch (err) {
      console.error("History error:", err);
    }
  };
  const deleteEntry = async (id: number) => {
  try {
    const token = localStorage.getItem("access");

    await axios.delete(
      `http://127.0.0.1:8000/api/journal/delete/${id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // refresh history
    fetchHistory();
  } catch (err) {
    console.error("Delete error:", err);
  }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-32 text-on-surface md:pb-0">
      <main className="mx-auto max-w-5xl px-6 pt-24">

        {/* HEADER */}
        <motion.header
          className="mb-12 space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <span className="label-sm text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            {t("journal.headerKicker")}
          </span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary md:text-6xl">
            {t("journal.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            {t("journal.subtitle")}
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

          {/* ===================== */}
          {/* EMOTION SECTION (MERGED) */}
          {/* ===================== */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-8">
            <div className="relative z-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">
                  {t("journal.howDoYouFeel")}
                </h2>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("journal.emotionalCheckIn")}
                </span>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">

                {/* ✅ YOUR AI RESULT */}
                {result && emotionData && (
                  <div className="flex h-20 w-20 scale-110 flex-col items-center justify-center rounded-full bg-secondary-container/30 ring-2 ring-primary">
                    <span
                      className={`material-symbols-outlined text-3xl ${emotionData.color}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {emotionData.icon}
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-primary">
                      {emotionData.label}
                    </span>
                  </div>
                )}

                {/* ✅ THEIR STATIC BUTTONS (UNCHANGED) */}
                <button className="group flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest">
                  <span className="material-symbols-outlined">sentiment_very_dissatisfied</span>
                </button>

                <button className="flex h-20 w-20 scale-110 items-center justify-center rounded-full bg-secondary-container/30 ring-2 ring-primary">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    sentiment_dissatisfied
                  </span>
                </button>

                <button className="group flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest">
                  <span className="material-symbols-outlined">sentiment_neutral</span>
                </button>

                <button className="group flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest">
                  <span className="material-symbols-outlined">sentiment_satisfied</span>
                </button>

              </div>
            </div>
          </section>

          {/* ===================== */}
          {/* ENERGY (MERGED) */}
          {/* ===================== */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-4">
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">{t("journal.energyLevel")}</h2>
                <span className="text-xs text-on-surface-variant">
                  {t("journal.vitality")}
                </span>
              </div>

              <div className="relative py-4">
                <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 bg-surface-variant" />

                {/* ✅ dynamic */}
                <div
                  className="absolute top-1/2 h-1 bg-primary transition-all"
                  style={{ width: `${energyValue * 10}%` }}
                />

                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-primary"
                  style={{ left: `${energyValue * 10}%` }}
                />
              </div>

              <div className="text-center text-2xl font-black text-primary">
                {energyValue}/10
              </div>
            </div>
          </section>

          {/* ===================== */}
          {/* TEXT AREA (MERGED) */}
          {/* ===================== */}
          <section className="rounded-xl bg-surface-container-highest p-1 md:col-span-12 md:p-2">
            <div className="rounded-lg bg-surface-container-lowest p-8 shadow-sm md:p-12">

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] w-full"
                placeholder={t("journal.entryPlaceholder")}
              />

              <button
                onClick={analyzeJournal}
                className="mt-4 rounded-lg bg-primary px-6 py-2 text-white"
              >
                Analyze Journal
              </button>

              {result && (
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>Emotion:</strong> {result.emotion.label}</p>
                  <p><strong>Physical:</strong> {result.physical.label}</p>
                </div>
              )}

            </div>
          </section>
              <section className="mt-10 md:col-span-12">
  <h2 className="text-xl font-bold text-primary mb-4">
    Journal History
  </h2>

  <div className="space-y-4">
    {history.length === 0 ? (
      <p className="text-sm text-on-surface-variant">
        No entries yet...
      </p>
    ) : (
      history.map((entry, index) => (
        <div
          key={index}
          className="p-4 rounded-lg bg-surface-container-low shadow-sm"
        >
          <p className="text-sm text-on-surface mb-2">
            {entry.text}
          </p>

          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>Emotion: {entry.emotion.label}</span>
            <span>Energy: {entry.physical.label}</span>
          </div>

          <p className="text-[10px] text-outline mt-2">
            {new Date(entry.created_at).toLocaleString()}
          </p>

          {/* ✅ DELETE BUTTON */}
          <button
            onClick={() => deleteEntry(entry.id)}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      ))
    )}
  </div>
</section>

                        <section className="md:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">{t("journal.gentleHabits")}</h2>
              <span className="material-symbols-outlined text-on-surface-variant">
                more_horiz
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* habit cards abbreviated — same structure as HTML */}
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      water_drop
                    </span>
                  </div>
                  <button type="button" className="material-symbols-outlined text-outline transition-colors hover:text-primary">
                    add_circle
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.hydration")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      3
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">
                      {t("journal.ofGlasses", { total: 8 })}
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2">
                  <div className="h-1.5 flex-grow overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-[37.5%] bg-primary" />
                  </div>
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl border-2 border-primary/20 bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container">
                      self_improvement
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.meditation")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t("journal.completed")}
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-full bg-primary" />
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      blind
                    </span>
                  </div>
                  <button type="button" className="text-[10px] font-bold uppercase text-primary hover:underline">{t("journal.log")}</button>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.dailyWalk")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t("journal.notStarted")}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-0 bg-primary" />
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      bedtime
                    </span>
                  </div>
                  <input type="checkbox" className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.restEarly")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t("journal.restEarlyGoal")}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-1/2 bg-primary" />
                </div>
              </div>
            </div>
          </section>





        </div>
      </main>
      <MarketingFooter />

      {/* NAVBAR (unchanged) */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around bg-background/60 p-4 backdrop-blur-2xl md:hidden">
        <Link to="/">Home</Link>
        <Link to="/journal">Journal</Link>
        <Link to="/dashboard">Dash</Link>
        <Link to="/sign-in">Profile</Link>
      </nav>
    </div>
  );
}

