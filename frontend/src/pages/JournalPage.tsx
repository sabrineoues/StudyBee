import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { emotionThemes } from "../emotionThemes";

// ✅ NEW: normalize AI labels → UI system
const mapEmotion = (label: string) => {
  switch (label.toLowerCase()) {
    case "joy":
      return "motivated";
    case "sadness":
      return "sad";
    case "anger":
    case "fear":
      return "stressed";
    case "calm":
      return "calm";
    default:
      return "calm";
  }
};

// ✅ UPDATED: keys now match mapped emotions
const emotionMap: any = {
  sad: {
    icon: "sentiment_dissatisfied",
    color: "text-blue-500",
    label: "SAD"
  },
  motivated: {
    icon: "sentiment_satisfied",
    color: "text-green-500",
    label: "MOTIVATED"
  },
  stressed: {
    icon: "sentiment_very_dissatisfied",
    color: "text-red-500",
    label: "STRESSED"
  },
  calm: {
    icon: "sentiment_satisfied",
    color: "text-teal-500",
    label: "CALM"
  }
};

export function JournalPage() {

  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  // ✅ APPLY THEME BASED ON AI RESULT
  useEffect(() => {
    if (!result) return;

    const emotion = mapEmotion(result.emotion.label);
    const theme = emotionThemes[emotion];

    if (!theme) return;

    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });

  }, [result]);

  // ✅ SAFE UI DATA
  const emotion = result ? mapEmotion(result.emotion.label) : null;
  const emotionData = emotion ? emotionMap[emotion] : null;

  // energy bar
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
    console.log("BUTTON CLICKED");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/journal/analyze/",
        { text }
      );
      console.log("RESPONSE:", response.data);
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-32 text-on-surface">
      <main className="mx-auto max-w-5xl px-6 pt-24">

        <motion.header
          className="mb-12 space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <span className="label-sm text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Daily Journal • Oct 24
          </span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary md:text-6xl">
            Be gentle with yourself today.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            It&apos;s okay to feel quiet. This space is here for whatever
            thoughts need to rest on the page.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

          {/* EMOTION SECTION */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-8">
            <div className="relative z-10">

              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">
                  How&apos;s your heart?
                </h2>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">

                {result && emotionData ? (
                  <div className="flex h-20 w-20 scale-110 flex-col items-center justify-center rounded-full bg-secondary-container/30 ring-2 ring-primary">
                    <span
                      className={`material-symbols-outlined text-3xl ${emotionData.color}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {emotionData.icon}
                    </span>

                    <span className="mt-1 text-[10px] font-bold">
                      {emotionData.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 scale-110 flex-col items-center justify-center rounded-full bg-secondary-container/30 ring-2 ring-primary">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      sentiment_neutral
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-primary">
                      WAITING
                    </span>
                  </div>
                )}

              </div>
            </div>
          </section>

          {/* ENERGY */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-4">
            <div className="relative z-10 flex h-full flex-col">

              <h2 className="text-xl font-bold text-primary">Energy Level</h2>

              <div className="relative py-4">
                <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-variant" />

                <div
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${energyValue * 10}%` }}
                />

                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                  style={{ left: `${energyValue * 10}%` }}
                />
              </div>

              <div className="text-center">
                <span className="text-2xl font-black text-primary">
                  {energyValue}/10
                </span>
              </div>
            </div>
          </section>

          {/* TEXT AREA */}
          <section className="rounded-xl bg-surface-container-highest p-1 md:col-span-12 md:p-2">
            <div className="rounded-lg bg-surface-container-lowest p-8 shadow-sm md:p-12">

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] w-full"
              />

              <button
                onClick={analyzeJournal}
                className="mt-4 rounded-lg bg-primary px-6 py-2 text-white"
              >
                Analyze Journal
              </button>

              {result && (
                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Emotion:</strong> {result.emotion.label} ({result.emotion.score})
                  </p>
                  <p>
                    <strong>Physical:</strong> {result.physical.label} ({result.physical.score})
                  </p>
                </div>
              )}

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}