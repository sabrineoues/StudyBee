/* ── Phase 2: Reflex Test ───────────────────────────────────────────────── */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReflexResult } from "../../../pages/BrainAgeTestPage";

interface Props {
  onComplete: (result: ReflexResult) => void;
}

type RoundState = "waiting" | "ready" | "go" | "too-early" | "result";

const TOTAL_ROUNDS = 4;

export function ReflexTestPhase({ onComplete }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundState, setRoundState] = useState<RoundState>("waiting");
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [fouls, setFouls] = useState(0);
  const [currentRT, setCurrentRT] = useState(0);
  const goTimestampRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Start round: after a brief ready period, schedule the "go" signal
  const startRound = useCallback(() => {
    setRoundState("ready");
    setCurrentRT(0);
    // Random delay between 2–5 seconds
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      goTimestampRef.current = performance.now();
      setRoundState("go");
    }, delay);
  }, []);

  // Auto-start the first round
  useEffect(() => {
    if (roundIndex === 0 && roundState === "waiting") {
      const t = setTimeout(() => startRound(), 800);
      return () => clearTimeout(t);
    }
  }, [roundIndex, roundState, startRound]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (roundState === "ready") {
      // Too early!
      clearTimeout(timerRef.current);
      setFouls((f) => f + 1);
      setRoundState("too-early");
      return;
    }

    if (roundState === "go") {
      const rt = Math.round(performance.now() - goTimestampRef.current);
      setCurrentRT(rt);
      setReactionTimes((prev) => [...prev, rt]);
      setRoundState("result");
      return;
    }
  }, [roundState]);

  const nextRound = useCallback(() => {
    if (roundIndex >= TOTAL_ROUNDS - 1) {
      // All done — fouls don't get reaction times
      const finalTimes = [...reactionTimes];
      // If we're on the result screen, times already include current
      onComplete({ reactionTimes: finalTimes, fouls });
    } else {
      setRoundIndex((i) => i + 1);
      startRound();
    }
  }, [roundIndex, reactionTimes, fouls, onComplete, startRound]);

  const retryAfterFoul = useCallback(() => {
    // Don't advance round index, just restart the same round
    startRound();
  }, [startRound]);

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Reflex Test</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Click as fast as you can when the color changes to green
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${
                i < roundIndex
                  ? "bg-primary"
                  : i === roundIndex
                    ? "bg-primary/50"
                    : "bg-surface-container-highest"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Waiting */}
        {roundState === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-surface-container-low shadow-lg">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">hourglass_empty</span>
            </div>
            <p className="text-sm text-on-surface-variant">Get ready…</p>
          </motion.div>
        )}

        {/* Ready — red box, don't click! */}
        {roundState === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.button
              onClick={handleClick}
              className="flex h-52 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-red-500 shadow-xl shadow-red-500/25 transition-transform active:scale-95"
              whileHover={{ scale: 1.02 }}
            >
              <span className="material-symbols-outlined text-5xl text-white">block</span>
              <span className="text-lg font-bold text-white">Wait for green…</span>
            </motion.button>
            <p className="text-xs text-on-surface-variant">Do NOT click yet!</p>
          </motion.div>
        )}

        {/* Go — green box, click now! */}
        {roundState === "go" && (
          <motion.div
            key="go"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.button
              onClick={handleClick}
              className="flex h-52 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-green-500 shadow-xl shadow-green-500/25"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
            >
              <span className="material-symbols-outlined text-5xl text-white">touch_app</span>
              <span className="text-lg font-bold text-white">CLICK NOW!</span>
            </motion.button>
          </motion.div>
        )}

        {/* Too early */}
        {roundState === "too-early" && (
          <motion.div
            key="too-early"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-error/15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span className="material-symbols-outlined text-4xl text-error">warning</span>
            </motion.div>
            <p className="font-headline text-xl font-bold text-error">Too early!</p>
            <p className="text-sm text-on-surface-variant">You clicked before the color changed</p>
            <button
              onClick={retryAfterFoul}
              className="mt-2 flex items-center gap-2 rounded-full bg-surface-container-highest px-6 py-3 font-bold text-on-surface transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">replay</span>
              Try Again
            </button>
          </motion.div>
        )}

        {/* Result */}
        {roundState === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span className="material-symbols-outlined text-4xl text-green-500">bolt</span>
            </motion.div>
            <div className="text-center">
              <p className="font-headline text-4xl font-extrabold text-primary">{currentRT}ms</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {currentRT < 200 ? "Lightning fast! ⚡" : currentRT < 300 ? "Great reflexes!" : currentRT < 400 ? "Good reaction" : "Keep practicing!"}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="mt-2 flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">
                {roundIndex >= TOTAL_ROUNDS - 1 ? "check" : "arrow_forward"}
              </span>
              {roundIndex >= TOTAL_ROUNDS - 1 ? "Finish" : "Next Round"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
