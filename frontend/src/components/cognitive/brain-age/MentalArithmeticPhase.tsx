/* ── Phase 4: Mental Arithmetic ─────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MentalArithmeticResult } from "../../../pages/BrainAgeTestPage";

interface Props {
  onComplete: (result: MentalArithmeticResult) => void;
}

interface Problem {
  expression: string;
  answer: number;
}

const TOTAL_ROUNDS = 6;
const TIME_LIMIT_MS = 15000;

function generateProblem(round: number): Problem {
  // Rounds 0-1: easy (single digit)
  // Rounds 2-3: medium (two digit)
  // Rounds 4-5: hard (mixed ops, larger numbers)
  if (round < 2) {
    const ops = ["+", "-"] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    if (op === "-") {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return { expression: `${big} − ${small}`, answer: big - small };
    }
    return { expression: `${a} + ${b}`, answer: a + b };
  } else if (round < 4) {
    const ops = ["+", "-", "×"] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "×") {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      return { expression: `${a} × ${b}`, answer: a * b };
    }
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 90) + 10;
    if (op === "-") {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return { expression: `${big} − ${small}`, answer: big - small };
    }
    return { expression: `${a} + ${b}`, answer: a + b };
  } else {
    // Hard: two operations or larger multiplication
    const variant = Math.floor(Math.random() * 3);
    if (variant === 0) {
      // a × b + c
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      const c = Math.floor(Math.random() * 20) + 1;
      return { expression: `${a} × ${b} + ${c}`, answer: a * b + c };
    } else if (variant === 1) {
      // a + b − c
      const a = Math.floor(Math.random() * 50) + 50;
      const b = Math.floor(Math.random() * 40) + 10;
      const c = Math.floor(Math.random() * 30) + 5;
      return { expression: `${a} + ${b} − ${c}`, answer: a + b - c };
    } else {
      // larger multiplication
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 90) + 11;
      return { expression: `${a} × ${b}`, answer: a * b };
    }
  }
}

export function MentalArithmeticPhase({ onComplete }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0));
  const [userInput, setUserInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [roundResults, setRoundResults] = useState<{ correct: boolean; timeMs: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_MS);
  const startTimeRef = useRef(performance.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Start timer for current round
  useEffect(() => {
    if (showFeedback) return;
    startTimeRef.current = performance.now();
    setTimeLeft(TIME_LIMIT_MS);

    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        // Time's up — auto-submit as wrong
        handleSubmitInternal(true);
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, showFeedback]);

  // Focus input
  useEffect(() => {
    if (!showFeedback) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [roundIndex, showFeedback]);

  const handleSubmitInternal = useCallback(
    (timedOut = false) => {
      clearInterval(intervalRef.current);
      const elapsed = performance.now() - startTimeRef.current;
      const answer = parseInt(userInput, 10);
      const correct = !timedOut && !isNaN(answer) && answer === problem.answer;

      setLastCorrect(correct);
      setShowFeedback(true);

      const newResults = [...roundResults, { correct, timeMs: Math.round(elapsed) }];
      setRoundResults(newResults);

      setTimeout(() => {
        if (roundIndex >= TOTAL_ROUNDS - 1) {
          const correctCount = newResults.filter((r) => r.correct).length;
          const avgTime =
            newResults.length > 0
              ? newResults.reduce((s, r) => s + r.timeMs, 0) / newResults.length
              : 0;
          onComplete({ correctCount, avgTime, rounds: newResults });
        } else {
          setRoundIndex((i) => i + 1);
          setProblem(generateProblem(roundIndex + 1));
          setUserInput("");
          setShowFeedback(false);
          setLastCorrect(null);
        }
      }, 1500);
    },
    [userInput, problem, roundIndex, roundResults, onComplete]
  );

  const handleSubmit = useCallback(() => {
    if (userInput.trim().length === 0) return;
    handleSubmitInternal(false);
  }, [handleSubmitInternal, userInput]);

  const timePercent = (timeLeft / TIME_LIMIT_MS) * 100;
  const timeColor = timePercent > 40 ? "bg-primary" : timePercent > 15 ? "bg-yellow-500" : "bg-error";

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Mental Arithmetic</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Solve the expression as quickly as you can
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-colors ${
                i < roundIndex
                  ? "bg-primary"
                  : i === roundIndex
                    ? "bg-primary/50"
                    : "bg-surface-container-highest"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Round {roundIndex + 1} of {TOTAL_ROUNDS} •{" "}
          {roundIndex < 2 ? "Easy" : roundIndex < 4 ? "Medium" : "Hard"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key={`q-${roundIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex w-full max-w-md flex-col items-center gap-6"
          >
            {/* Timer bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <motion.div
                className={`h-full ${timeColor} rounded-full`}
                style={{ width: `${timePercent}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Expression */}
            <div className="w-full rounded-2xl bg-surface-container-low p-8 text-center shadow-lg">
              <p className="font-headline text-4xl font-extrabold tracking-wide text-on-surface md:text-5xl">
                {problem.expression}
              </p>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/[^0-9\-]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userInput.length > 0) handleSubmit();
              }}
              className="w-full rounded-xl bg-surface px-6 py-4 text-center font-headline text-3xl font-bold text-on-surface outline-none ring-2 ring-primary/30 transition-all focus:ring-primary"
              placeholder="= ?"
              autoComplete="off"
            />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={userInput.trim().length === 0}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Submit
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`fb-${roundIndex}`}
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
                Answer: <span className="font-bold text-primary">{problem.answer}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
