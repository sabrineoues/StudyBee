/* ── Cognitive Training Page ────────────────────────────────────────────── */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { CognitiveDashboard } from "../components/cognitive/CognitiveDashboard";
import { StroopEngine } from "../components/cognitive/StroopEngine";
import { NBackEngine } from "../components/cognitive/NBackEngine";
import { SchulteEngine } from "../components/cognitive/SchulteEngine";
import { KakuroEngine } from "../components/cognitive/KakuroEngine";
import { cognitiveService } from "../services/cognitiveService";
import { useCamera } from "../components/cognitive/useCamera";
import type {
  SessionStartResponse,
  SessionCompleteResponse,
  TrialInput,
  StroopParams,
  NBackParams,
  SchulteParams,
  KakuroParams,
} from "../services/cognitiveTypes";

type View = "dashboard" | "playing" | "results";

interface SessionState {
  sessionData: SessionStartResponse;
  taskSlug: string;
}

export function CognitiveTrainingPage() {
  const [view, setView] = useState<View>("dashboard");
  const [session, setSession] = useState<SessionState | null>(null);
  const [results, setResults] = useState<SessionCompleteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const dashboardKeyRef = useRef(0);
  const { start: startCamera, stop: stopCamera } = useCamera();

  const handleStartTask = useCallback(async (slug: string) => {
    setStarting(true);
    setError(null);
    try {
      const data = await cognitiveService.startSession(slug);
      setSession({ sessionData: data, taskSlug: slug });
      setView("playing");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start session";
      setError(msg);
    } finally {
      setStarting(false);
    }
  }, []);

  const handleComplete = useCallback(
    async (trials: TrialInput[]) => {
      if (!session) return;
      try {
        const resp = await cognitiveService.completeSession(session.sessionData.session_id, {
          ended_at: new Date().toISOString(),
          trials,
        });
        setResults(resp);
        setView("results");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to submit results";
        setError(msg);
        setView("dashboard");
      }
    },
    [session]
  );

  const handleQuit = useCallback(() => {
    setSession(null);
    setView("dashboard");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSession(null);
    setResults(null);
    setView("dashboard");
    dashboardKeyRef.current++;
  }, []);

  // Turn camera on when entering a playing session and turn it off when leaving.
  useEffect(() => {
    (async () => {
      if (view === "playing" && session) {
        try {
          await startCamera();
        } catch (e) {
          // ignore camera errors; the browser permission prompt handles consent
        }
      } else {
        stopCamera();
      }
    })();

    return () => {
      // no-op cleanup here; stopCamera is idempotent
    };
  }, [view, session, startCamera, stopCamera]);

  return (
    <StudyBeeShell>
      {/* Background gradients */}
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-primary-container/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-tertiary-container/10 blur-[120px]" />
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-12 md:pb-12">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 flex items-center gap-3 rounded-xl bg-error/10 p-4 text-sm text-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="material-symbols-outlined">error</span>
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {starting && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="h-12 w-12 rounded-full border-3 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="font-body text-sm text-on-surface-variant">Preparing session...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── Dashboard ───────────────────────────────────────────────── */}
          {view === "dashboard" && (
            <motion.div
              key={`dash-${dashboardKeyRef.current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="mb-8">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                  Cognitive <span className="text-primary">Training</span>
                </h1>
                <p className="mt-2 font-body text-lg text-on-surface-variant">
                  Sharpen your mind with scientifically-backed exercises
                </p>
              </header>
              <CognitiveDashboard onStartTask={handleStartTask} />
            </motion.div>
          )}

          {/* ── Playing ─────────────────────────────────────────────────── */}
          {view === "playing" && session && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-3xl"
            >
              {/* Task header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-xl text-primary">
                      {session.taskSlug === "stroop" ? "palette" : session.taskSlug === "nback" ? "grid_view" : session.taskSlug === "schulte" ? "apps" : "calculate"}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold text-on-surface">
                      {session.sessionData.task}
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Difficulty {session.sessionData.difficulty}/10
                    </p>
                  </div>
                </div>
              </div>

              {/* Game engine */}
              {session.taskSlug === "stroop" && (
                <StroopEngine
                  params={session.sessionData.task_params as unknown as StroopParams}
                  onComplete={handleComplete}
                  onQuit={handleQuit}
                />
              )}
              {session.taskSlug === "nback" && (
                <NBackEngine
                  params={session.sessionData.task_params as unknown as NBackParams}
                  onComplete={handleComplete}
                  onQuit={handleQuit}
                />
              )}
              {session.taskSlug === "schulte" && (
                <SchulteEngine
                  params={session.sessionData.task_params as unknown as SchulteParams}
                  onComplete={handleComplete}
                  onQuit={handleQuit}
                />
              )}
              {session.taskSlug === "kakuro" && (
                <KakuroEngine
                  params={session.sessionData.task_params as unknown as KakuroParams}
                  onComplete={handleComplete}
                  onQuit={handleQuit}
                />
              )}
            </motion.div>
          )}

          {/* ── Results ─────────────────────────────────────────────────── */}
          {view === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-2xl"
            >
              <div className="rounded-2xl bg-surface-container-low p-8 shadow-lg">
                {/* Header */}
                <div className="mb-8 text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                  >
                    <span className="material-symbols-outlined text-4xl text-primary">
                      {results.metrics.accuracy >= 0.8 ? "emoji_events" : results.metrics.accuracy >= 0.6 ? "thumb_up" : "trending_up"}
                    </span>
                  </motion.div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">Session Results</h2>
                </div>

                {/* Metrics grid */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    {
                      icon: "check_circle",
                      value: `${Math.round(results.metrics.accuracy * 100)}%`,
                      label: "Accuracy",
                      highlight: results.metrics.accuracy >= 0.775,
                    },
                    {
                      icon: "speed",
                      value: `${Math.round(results.metrics.avg_reaction_time_ms)}ms`,
                      label: "Avg RT",
                      highlight: false,
                    },
                    {
                      icon: "quiz",
                      value: `${results.metrics.correct}/${results.metrics.total_trials}`,
                      label: "Correct",
                      highlight: false,
                    },
                    {
                      icon: "timer",
                      value: `${Math.round(results.metrics.duration_seconds)}s`,
                      label: "Duration",
                      highlight: false,
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className={`rounded-xl p-4 text-center ${s.highlight ? "bg-primary/10 ring-1 ring-primary/20" : "bg-surface"
                        }`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <span className={`material-symbols-outlined mb-1 text-lg ${s.highlight ? "text-primary" : "text-on-surface-variant"}`}>
                        {s.icon}
                      </span>
                      <div className="font-headline text-xl font-bold text-on-surface">{s.value}</div>
                      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {s.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* RL Decision */}
                <motion.div
                  className="mb-8 rounded-xl bg-surface p-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="mb-3 flex items-center gap-2 font-headline text-sm font-bold text-on-surface">
                    <span className="material-symbols-outlined text-base text-primary">psychology</span>
                    AI Difficulty Adjustment
                  </h3>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-on-surface-variant">Previous: </span>
                      <span className="font-bold text-on-surface">d{results.rl_decision.previous_difficulty}</span>
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <div>
                      <span className="text-on-surface-variant">Next: </span>
                      <span className="font-bold text-primary">d{results.rl_decision.next_difficulty}</span>
                    </div>
                    <div className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {results.rl_decision.action_taken === "0" ? "Maintained" : `${results.rl_decision.action_taken} levels`}
                    </div>
                  </div>
                </motion.div>

                {/* Updated profile scores */}
                {results.updated_profile && (
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h3 className="mb-3 font-headline text-sm font-bold text-on-surface">Updated Cognitive Scores</h3>
                    <div className="space-y-2">
                      {Object.entries(results.updated_profile).map(([key, val]) => {
                        const label = key.replace("_score", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-36 text-xs text-on-surface-variant">{label}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                              <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-bold">{Math.round(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => session && handleStartTask(session.taskSlug)}
                    className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Play Again
                  </button>
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 rounded-full bg-surface-container-highest px-8 py-3 font-bold text-on-surface transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">dashboard</span>
                    Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </StudyBeeShell>
  );
}
