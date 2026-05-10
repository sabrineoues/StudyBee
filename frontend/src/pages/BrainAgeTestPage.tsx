/* ── Brain Age Test Page ────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { NumberMemoryPhase } from "../components/cognitive/brain-age/NumberMemoryPhase";
import { ReflexTestPhase } from "../components/cognitive/brain-age/ReflexTestPhase";
import { VisualMemoryPhase } from "../components/cognitive/brain-age/VisualMemoryPhase";
import { MentalArithmeticPhase } from "../components/cognitive/brain-age/MentalArithmeticPhase";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface NumberMemoryResult {
  correctCount: number;
  maxDigitsReached: number;
  rounds: { digits: number; correct: boolean }[];
}

export interface ReflexResult {
  reactionTimes: number[];
  fouls: number;
}

export interface VisualMemoryResult {
  scores: { gridSize: number; correctCells: number; totalHighlighted: number }[];
  totalCorrect: number;
  totalCells: number;
}

export interface MentalArithmeticResult {
  correctCount: number;
  avgTime: number;
  rounds: { correct: boolean; timeMs: number }[];
}

interface AllResults {
  numberMemory: NumberMemoryResult | null;
  reflex: ReflexResult | null;
  visualMemory: VisualMemoryResult | null;
  mentalArithmetic: MentalArithmeticResult | null;
}

type Phase = "intro" | "number-memory" | "reflex" | "visual-memory" | "mental-arithmetic" | "results";

const PHASE_ORDER: Phase[] = ["number-memory", "reflex", "visual-memory", "mental-arithmetic"];

const PHASE_META: Record<string, { label: string; icon: string; index: number }> = {
  "number-memory": { label: "Number Memory", icon: "pin", index: 0 },
  reflex: { label: "Reflex Test", icon: "bolt", index: 1 },
  "visual-memory": { label: "Visual Memory", icon: "grid_view", index: 2 },
  "mental-arithmetic": { label: "Mental Arithmetic", icon: "calculate", index: 3 },
};

/* ── Brain Age Calculator ───────────────────────────────────────────────── */

function calculateBrainAge(results: AllResults): number {
  let age = 7;

  // Number Memory: +3 per digit below 7
  if (results.numberMemory) {
    age += Math.max(0, 7 - results.numberMemory.maxDigitsReached) * 3;
  } else {
    age += 12;
  }

  // Reflex: +1 per 30ms above 250ms baseline
  if (results.reflex) {
    const validTimes = results.reflex.reactionTimes.filter((t) => t > 0);
    const avgReaction = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 600;
    age += Math.max(0, Math.floor((avgReaction - 250) / 30));
    age += results.reflex.fouls * 2;
  } else {
    age += 15;
  }

  // Visual Memory: +1 per 5% below 90%
  if (results.visualMemory) {
    const pct = results.visualMemory.totalCells > 0 ? (results.visualMemory.totalCorrect / results.visualMemory.totalCells) * 100 : 0;
    age += Math.max(0, Math.floor((90 - pct) / 5));
  } else {
    age += 10;
  }

  // Mental Arithmetic: +2 per wrong, +1 per 3s above 5s avg
  if (results.mentalArithmetic) {
    const wrong = 6 - results.mentalArithmetic.correctCount;
    age += wrong * 2;
    const avgSec = results.mentalArithmetic.avgTime / 1000;
    age += Math.max(0, Math.floor((avgSec - 5) / 3));
  } else {
    age += 12;
  }

  return Math.max(15, Math.min(30, age));
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function BrainAgeTestPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<AllResults>({
    numberMemory: null,
    reflex: null,
    visualMemory: null,
    mentalArithmetic: null,
  });

  const currentPhaseIndex = PHASE_ORDER.indexOf(phase as never);

  const advancePhase = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase as never);
    if (idx < PHASE_ORDER.length - 1) {
      setPhase(PHASE_ORDER[idx + 1]);
    } else {
      setPhase("results");
    }
  }, [phase]);

  const handleNumberMemoryComplete = useCallback(
    (r: NumberMemoryResult) => {
      setResults((prev) => ({ ...prev, numberMemory: r }));
      advancePhase();
    },
    [advancePhase]
  );

  const handleReflexComplete = useCallback(
    (r: ReflexResult) => {
      setResults((prev) => ({ ...prev, reflex: r }));
      advancePhase();
    },
    [advancePhase]
  );

  const handleVisualMemoryComplete = useCallback(
    (r: VisualMemoryResult) => {
      setResults((prev) => ({ ...prev, visualMemory: r }));
      advancePhase();
    },
    [advancePhase]
  );

  const handleMentalArithmeticComplete = useCallback(
    (r: MentalArithmeticResult) => {
      setResults((prev) => ({ ...prev, mentalArithmetic: r }));
      advancePhase();
    },
    [advancePhase]
  );

  const brainAge = phase === "results" ? calculateBrainAge(results) : null;

  return (
    <StudyBeeShell>
      {/* Background gradients */}
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-primary-container/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-tertiary-container/10 blur-[120px]" />
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-28 md:px-12 md:pb-12">
        {/* Progress bar — visible during phases */}
        {phase !== "intro" && phase !== "results" && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
              <span className="font-bold">{PHASE_META[phase]?.label}</span>
              <span>
                Phase {currentPhaseIndex + 1} of {PHASE_ORDER.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="mt-3 flex justify-between">
              {PHASE_ORDER.map((p, i) => (
                <div key={p} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${i < currentPhaseIndex
                      ? "bg-primary text-on-primary"
                      : i === currentPhaseIndex
                        ? "bg-primary/20 text-primary ring-2 ring-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                  >
                    {i < currentPhaseIndex ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">{PHASE_META[p].icon}</span>
                    )}
                  </div>
                  <span className="hidden text-[10px] text-on-surface-variant md:block">{PHASE_META[p].label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Intro ───────────────────────────────────────────────────────── */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <span className="material-symbols-outlined text-6xl text-primary">neurology</span>
              </motion.div>

              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                Brain <span className="text-primary">Age</span> Test
              </h1>
              <p className="mt-3 max-w-md font-body text-lg text-on-surface-variant">
                Assess your cognitive abilities across 4 dimensions: memory, reflexes, visual processing, and mental
                arithmetic.
              </p>

              {/* Phase preview cards */}
              <div className="mt-8 grid w-full grid-cols-2 gap-3 md:grid-cols-4">
                {PHASE_ORDER.map((p, i) => (
                  <motion.div
                    key={p}
                    className="rounded-xl bg-surface-container-low p-4 text-center shadow-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    <span className="material-symbols-outlined mb-2 text-2xl text-primary">{PHASE_META[p].icon}</span>
                    <div className="text-xs font-bold text-on-surface">{PHASE_META[p].label}</div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => setPhase("number-memory")}
                className="mt-10 flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-headline text-lg font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Start Test
              </motion.button>

              <button
                onClick={() => navigate("/cognitive")}
                className="mt-4 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
              >
                ← Back to Training
              </button>
            </motion.div>
          )}

          {/* ── Phase 1: Number Memory ──────────────────────────────────────── */}
          {phase === "number-memory" && (
            <motion.div
              key="number-memory"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <NumberMemoryPhase onComplete={handleNumberMemoryComplete} />
            </motion.div>
          )}

          {/* ── Phase 2: Reflex Test ────────────────────────────────────────── */}
          {phase === "reflex" && (
            <motion.div
              key="reflex"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <ReflexTestPhase onComplete={handleReflexComplete} />
            </motion.div>
          )}

          {/* ── Phase 3: Visual Memory ──────────────────────────────────────── */}
          {phase === "visual-memory" && (
            <motion.div
              key="visual-memory"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <VisualMemoryPhase onComplete={handleVisualMemoryComplete} />
            </motion.div>
          )}

          {/* ── Phase 4: Mental Arithmetic ──────────────────────────────────── */}
          {phase === "mental-arithmetic" && (
            <motion.div
              key="mental-arithmetic"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <MentalArithmeticPhase onComplete={handleMentalArithmeticComplete} />
            </motion.div>
          )}

          {/* ── Results ─────────────────────────────────────────────────────── */}
          {phase === "results" && brainAge !== null && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Brain Age Reveal */}
              <div className="rounded-2xl bg-surface-container-low p-8 text-center shadow-lg">
                <motion.div
                  className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <span className="material-symbols-outlined text-5xl text-primary">neurology</span>
                </motion.div>
                <p className="mb-1 font-body text-sm uppercase tracking-widest text-on-surface-variant">
                  Your Estimated Brain Age
                </p>
                <motion.div
                  className="font-headline text-7xl font-extrabold text-primary"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
                >
                  {brainAge}
                </motion.div>
                <p className="mt-1 text-sm text-on-surface-variant">years old</p>
              </div>

              {/* Phase Breakdown */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Number Memory */}
                {results.numberMemory && (
                  <motion.div
                    className="rounded-xl bg-surface-container-low p-5 shadow-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">pin</span>
                      <h3 className="font-headline text-sm font-bold text-on-surface">Number Memory</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Max Digits</span>
                        <span className="font-bold text-on-surface">{results.numberMemory.maxDigitsReached}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Rounds Correct</span>
                        <span className="font-bold text-on-surface">
                          {results.numberMemory.correctCount}/{results.numberMemory.rounds.length}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Reflex */}
                {results.reflex && (
                  <motion.div
                    className="rounded-xl bg-surface-container-low p-5 shadow-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">bolt</span>
                      <h3 className="font-headline text-sm font-bold text-on-surface">Reflex Test</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Avg Reaction</span>
                        <span className="font-bold text-on-surface">
                          {results.reflex.reactionTimes.filter((t) => t > 0).length > 0
                            ? `${Math.round(
                              results.reflex.reactionTimes.filter((t) => t > 0).reduce((a, b) => a + b, 0) /
                              results.reflex.reactionTimes.filter((t) => t > 0).length
                            )}ms`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Early Clicks</span>
                        <span className="font-bold text-on-surface">{results.reflex.fouls}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Visual Memory */}
                {results.visualMemory && (
                  <motion.div
                    className="rounded-xl bg-surface-container-low p-5 shadow-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">grid_view</span>
                      <h3 className="font-headline text-sm font-bold text-on-surface">Visual Memory</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Accuracy</span>
                        <span className="font-bold text-on-surface">
                          {results.visualMemory.totalCells > 0
                            ? `${Math.round((results.visualMemory.totalCorrect / results.visualMemory.totalCells) * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Cells Correct</span>
                        <span className="font-bold text-on-surface">
                          {results.visualMemory.totalCorrect}/{results.visualMemory.totalCells}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mental Arithmetic */}
                {results.mentalArithmetic && (
                  <motion.div
                    className="rounded-xl bg-surface-container-low p-5 shadow-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">calculate</span>
                      <h3 className="font-headline text-sm font-bold text-on-surface">Mental Arithmetic</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Correct</span>
                        <span className="font-bold text-on-surface">
                          {results.mentalArithmetic.correctCount}/6
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Avg Time</span>
                        <span className="font-bold text-on-surface">
                          {(results.mentalArithmetic.avgTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setResults({ numberMemory: null, reflex: null, visualMemory: null, mentalArithmetic: null });
                    setPhase("intro");
                  }}
                  className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">replay</span>
                  Retake Test
                </button>
                <button
                  onClick={() => navigate("/cognitive")}
                  className="flex items-center gap-2 rounded-full bg-surface-container-highest px-8 py-3 font-bold text-on-surface transition-all hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Back to Training
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </StudyBeeShell>
  );
}
