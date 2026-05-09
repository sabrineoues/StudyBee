/* ── Phase 1: Number Memory ─────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NumberMemoryResult } from "../../../pages/BrainAgeTestPage";

interface Props {
  onComplete: (result: NumberMemoryResult) => void;
}

type RoundState = "showing" | "input" | "feedback";

function generateNumber(digits: number): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

const DIGIT_COUNTS = [4, 5, 6, 7];
const SHOW_DURATION_MS = [2500, 3000, 3500, 4000]; // longer for more digits

export function NumberMemoryPhase({ onComplete }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundState, setRoundState] = useState<RoundState>("showing");
  const [currentNumber, setCurrentNumber] = useState(() => generateNumber(DIGIT_COUNTS[0]));
  const [userInput, setUserInput] = useState("");
  const [roundResults, setRoundResults] = useState<{ digits: number; correct: boolean }[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Show number then hide after delay
  useEffect(() => {
    if (roundState !== "showing") return;
    const num = generateNumber(DIGIT_COUNTS[roundIndex]);
    setCurrentNumber(num);
    setUserInput("");
    setLastCorrect(null);

    timerRef.current = setTimeout(() => {
      setRoundState("input");
    }, SHOW_DURATION_MS[roundIndex]);

    return () => clearTimeout(timerRef.current);
  }, [roundIndex, roundState]);

  // Focus input when switching to input state
  useEffect(() => {
    if (roundState === "input") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [roundState]);

  const handleSubmit = useCallback(() => {
    const correct = userInput.trim() === currentNumber;
    setLastCorrect(correct);
    setRoundState("feedback");

    const newResults = [...roundResults, { digits: DIGIT_COUNTS[roundIndex], correct }];
    setRoundResults(newResults);

    // Move to next round after feedback delay
    setTimeout(() => {
      if (roundIndex >= DIGIT_COUNTS.length - 1) {
        // All rounds done
        const correctCount = newResults.filter((r) => r.correct).length;
        const maxDigits = newResults.filter((r) => r.correct).reduce((max, r) => Math.max(max, r.digits), 0);
        onComplete({
          correctCount,
          maxDigitsReached: maxDigits || DIGIT_COUNTS[0],
          rounds: newResults,
        });
      } else {
        setRoundIndex((i) => i + 1);
        setRoundState("showing");
      }
    }, 1500);
  }, [userInput, currentNumber, roundIndex, roundResults, onComplete]);

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Number Memory</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Memorize the number, then type it back
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {DIGIT_COUNTS.map((_, i) => (
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
        {/* Showing the number */}
        {roundState === "showing" && (
          <motion.div
            key={`show-${roundIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="rounded-2xl bg-surface-container-low px-12 py-10 shadow-lg">
              <motion.div
                className="font-headline text-5xl font-extrabold tracking-[0.25em] text-primary md:text-6xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {currentNumber}
              </motion.div>
            </div>
            <p className="text-sm text-on-surface-variant">
              Memorize this number — {DIGIT_COUNTS[roundIndex]} digits
            </p>
            {/* Countdown bar */}
            <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-container-highest">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: SHOW_DURATION_MS[roundIndex] / 1000, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {/* Input */}
        {roundState === "input" && (
          <motion.div
            key={`input-${roundIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="rounded-2xl bg-surface-container-low p-8 shadow-lg">
              <p className="mb-4 text-center text-sm font-bold text-on-surface-variant">
                What was the number?
              </p>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userInput.length > 0) handleSubmit();
                }}
                className="w-full rounded-xl bg-surface px-6 py-4 text-center font-headline text-4xl font-bold tracking-[0.2em] text-on-surface outline-none ring-2 ring-primary/30 transition-all focus:ring-primary"
                placeholder="···"
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={userInput.length === 0}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Submit
            </button>
          </motion.div>
        )}

        {/* Feedback */}
        {roundState === "feedback" && lastCorrect !== null && (
          <motion.div
            key={`feedback-${roundIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${
                lastCorrect ? "bg-green-500/15" : "bg-error/15"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span
                className={`material-symbols-outlined text-4xl ${
                  lastCorrect ? "text-green-500" : "text-error"
                }`}
              >
                {lastCorrect ? "check_circle" : "cancel"}
              </span>
            </motion.div>
            <p className="font-headline text-lg font-bold text-on-surface">
              {lastCorrect ? "Correct!" : "Incorrect"}
            </p>
            {!lastCorrect && (
              <p className="text-sm text-on-surface-variant">
                The number was <span className="font-bold text-primary">{currentNumber}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
