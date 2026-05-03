import { useState, useEffect } from "react";
import axios from "axios";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { emotionThemes } from "../emotionThemes";

import { useTranslation } from "react-i18next";

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

export function JournalPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!result) return;

    const emotion = mapEmotion(result.emotion.label);
    const theme = emotionThemes[emotion];

    if (!theme) return;

    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  }, [result]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("access");

      const res = await axios.get(
        "http://127.0.0.1:8000/api/journal/history/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const analyzeJournal = async () => {
    try {
      const token = localStorage.getItem("access");

      const res = await axios.post(
        "http://127.0.0.1:8000/api/journal/analyze/",
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(res.data);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      const token = localStorage.getItem("access");

      await axios.delete(
        `http://127.0.0.1:8000/api/journal/delete/${id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const emotion = result ? mapEmotion(result.emotion.label) : null;
  const energy = result ? result.physical.label : null;

  return (
    <StudyBeeShell>
      <main className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 pb-10 pt-24 md:px-8">

        {/* ===================== */}
        {/* SIDEBAR */}
        {/* ===================== */}
        <aside
          className={`rounded-xl border border-surface-container-high bg-surface-container-low shadow-sm transition-all ${
            sidebarOpen ? "w-full p-4 md:w-[320px]" : "w-[64px] p-2"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="mb-3 flex w-full items-center justify-center rounded-lg bg-surface-container-high p-2"
          >
            <span className="material-symbols-outlined">
              {sidebarOpen ? "left_panel_close" : "left_panel_open"}
            </span>
          </button>

          {sidebarOpen && (
            <>
              <h2 className="font-bold mb-4">Journal History</h2>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowModal(true);
                    }}
                    className="relative cursor-pointer rounded-lg border bg-surface p-3 hover:bg-surface-container-high group"
                  >
                    <p className="truncate font-semibold">
                      {entry.text}
                    </p>

                    <div className="flex justify-between text-xs mt-1 text-outline">
                      <span>{entry.emotion.label}</span>
                      <span>{entry.physical.label}</span>
                    </div>

                    <p className="text-[10px] mt-1 text-outline">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>

                    {/* DELETE ICON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* ===================== */}
        {/* MAIN CONTENT */}
        {/* ===================== */}
        <div className="flex-1 space-y-6">

          {/* HEADER */}
          <section>
            <h1 className="text-5xl font-extrabold text-primary">
              Be gentle with yourself today.
            </h1>
            <p className="text-on-surface-variant mt-2">
              Write freely. No judgment.
            </p>
          </section>

          {/* EMOTION + ENERGY */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-surface-container-low p-6">
              <h2 className="font-bold mb-2">How do you feel?</h2>
              <p className="text-lg font-semibold text-primary">
                {emotion || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-6">
              <h2 className="font-bold mb-2">Energy Level</h2>
              <p className="text-lg font-semibold text-primary">
                {energy || "-"}
              </p>
            </div>
          </section>

          {/* TEXT AREA */}
          <section className="rounded-xl bg-surface-container-low p-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[200px] rounded-lg bg-surface p-4"
              placeholder="Write your thoughts..."
            />

            <button
              onClick={analyzeJournal}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-white"
            >
              Analyze Journal
            </button>

            {result && (
              <div className="mt-4 text-sm">
                <p><strong>Emotion:</strong> {result.emotion.label}</p>
                <p><strong>Physical:</strong> {result.physical.label}</p>
              </div>
            )}
          </section>

          {/* GENTLE HABITS */}
          {/* ===================== */}
          {/* GENTLE HABITS */}
          {/* ===================== */}

          <section className="md:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">
                {t("journal.gentleHabits")}
              </h2>
              <span className="material-symbols-outlined text-on-surface-variant">
                more_horiz
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

              {/* HYDRATION */}
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      water_drop
                    </span>
                  </div>
                  <button className="material-symbols-outlined text-outline hover:text-primary">
                    add_circle
                  </button>
                </div>

                <div>
                  <p className="text-sm font-bold text-primary">
                    {t("journal.hydration")}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      3
                    </span>
                    <span className="text-[10px] font-bold text-outline-variant">
                      {t("journal.ofGlasses", { total: 8 })}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-surface-variant rounded-full">
                  <div className="h-full w-[37.5%] bg-primary" />
                </div>
              </div>

              {/* MEDITATION */}
              <div className="group flex flex-col gap-4 rounded-xl border-2 border-primary/20 bg-surface-container-low p-6 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container">
                      self_improvement
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-primary">
                    {t("journal.meditation")}
                  </p>
                  <p className="text-[10px] font-bold text-primary">
                    {t("journal.completed")}
                  </p>
                </div>

                <div className="h-1.5 bg-surface-variant rounded-full">
                  <div className="h-full w-full bg-primary" />
                </div>
              </div>

              {/* WALK */}
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      blind
                    </span>
                  </div>

                  <button className="text-[10px] font-bold text-primary hover:underline">
                    {t("journal.log")}
                  </button>
                </div>

                <div>
                  <p className="text-sm font-bold text-primary">
                    {t("journal.dailyWalk")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {t("journal.notStarted")}
                  </p>
                </div>

                <div className="h-1.5 bg-surface-variant rounded-full" />
              </div>

              {/* SLEEP */}
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      bedtime
                    </span>
                  </div>

                  <input type="checkbox" className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-bold text-primary">
                    {t("journal.restEarly")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {t("journal.restEarlyGoal")}
                  </p>
                </div>

                <div className="h-1.5 bg-surface-variant rounded-full">
                  <div className="h-full w-1/2 bg-primary" />
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>

      {/* ===================== */}
      {/* MODAL */}
      {/* ===================== */}
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
              <button onClick={() => setShowModal(false)}>
                Close
              </button>

              <button
                onClick={() => {
                  deleteEntry(selectedEntry.id);
                  setShowModal(false);
                }}
                className="text-red-500"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}
    </StudyBeeShell>
  );
}

