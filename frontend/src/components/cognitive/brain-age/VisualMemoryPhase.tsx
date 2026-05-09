/* ── Phase 3: Visual Memory ─────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualMemoryResult } from "../../../pages/BrainAgeTestPage";

interface Props {
  onComplete: (result: VisualMemoryResult) => void;
}

type RoundState = "showing" | "input" | "feedback";

const GRID_SIZES = [3, 4, 5, 6];
const SHOW_DURATION_MS = 4000;
const HIGHLIGHT_RATIO = 0.4;

function generatePattern(gridSize: number): Set<number> {
  const totalCells = gridSize * gridSize;
  const highlightCount = Math.min(10, Math.round(totalCells * HIGHLIGHT_RATIO));
  const indices = new Set<number>();
  while (indices.size < highlightCount) {
    indices.add(Math.floor(Math.random() * totalCells));
  }
  return indices;
}

export function VisualMemoryPhase({ onComplete }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundState, setRoundState] = useState<RoundState>("showing");
  const [pattern, setPattern] = useState<Set<number>>(() => generatePattern(GRID_SIZES[0]));
  const [userSelection, setUserSelection] = useState<Set<number>>(new Set());
  const [roundScores, setRoundScores] = useState<
    { gridSize: number; correctCells: number; totalHighlighted: number }[]
  >([]);
  const [lastScore, setLastScore] = useState<{ correct: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const gridSize = GRID_SIZES[roundIndex];

  // Generate new pattern and show it
  useEffect(() => {
    if (roundState !== "showing") return;
    const newPattern = generatePattern(GRID_SIZES[roundIndex]);
    setPattern(newPattern);
    setUserSelection(new Set());
    setLastScore(null);

    timerRef.current = setTimeout(() => {
      setRoundState("input");
    }, SHOW_DURATION_MS);

    return () => clearTimeout(timerRef.current);
  }, [roundIndex, roundState]);

  const toggleCell = useCallback(
    (index: number) => {
      if (roundState !== "input") return;
      setUserSelection((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    [roundState]
  );

  const handleSubmit = useCallback(() => {
    // Calculate score
    let correct = 0;
    pattern.forEach((idx) => {
      if (userSelection.has(idx)) correct++;
    });
    const totalHighlighted = pattern.size;

    setLastScore({ correct, total: totalHighlighted });
    setRoundState("feedback");

    const newScores = [
      ...roundScores,
      { gridSize: GRID_SIZES[roundIndex], correctCells: correct, totalHighlighted },
    ];
    setRoundScores(newScores);

    setTimeout(() => {
      if (roundIndex >= GRID_SIZES.length - 1) {
        const totalCorrect = newScores.reduce((s, r) => s + r.correctCells, 0);
        const totalCells = newScores.reduce((s, r) => s + r.totalHighlighted, 0);
        onComplete({ scores: newScores, totalCorrect, totalCells });
      } else {
        setRoundIndex((i) => i + 1);
        setRoundState("showing");
      }
    }, 2000);
  }, [pattern, userSelection, roundIndex, roundScores, onComplete]);

  const cellSize = gridSize <= 4 ? "w-16 h-16 md:w-20 md:h-20" : gridSize === 5 ? "w-12 h-12 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12";

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Visual Memory</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {roundState === "showing"
            ? "Memorize the highlighted pattern"
            : roundState === "input"
              ? "Recreate the pattern by clicking cells"
              : "Round complete!"}
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {GRID_SIZES.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${i < roundIndex
                ? "bg-primary"
                : i === roundIndex
                  ? "bg-primary/50"
                  : "bg-surface-container-highest"
                }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Grid: {gridSize}×{gridSize}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Showing / Input / Feedback — all render the grid */}
        <motion.div
          key={`grid-${roundIndex}-${roundState}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Countdown bar during showing */}
          {roundState === "showing" && (
            <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-container-highest">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: SHOW_DURATION_MS / 1000, ease: "linear" }}
              />
            </div>
          )}

          {/* Grid */}
          <div
            className="inline-grid gap-2 rounded-2xl bg-surface-container-low p-4 shadow-lg md:p-6"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const isHighlighted = pattern.has(i);
              const isSelected = userSelection.has(i);
              const showingPhase = roundState === "showing";
              const feedbackPhase = roundState === "feedback";

              let bg = "bg-surface-container-highest";
              let ring = "";

              if (showingPhase && isHighlighted) {
                bg = "bg-primary";
              } else if (roundState === "input" && isSelected) {
                bg = "bg-primary/70";
                ring = "ring-2 ring-primary";
              } else if (feedbackPhase) {
                if (isHighlighted && isSelected) {
                  bg = "bg-green-500";
                } else if (isHighlighted && !isSelected) {
                  bg = "bg-error/50";
                } else if (!isHighlighted && isSelected) {
                  bg = "bg-error/30";
                }
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => toggleCell(i)}
                  disabled={roundState !== "input"}
                  className={`${cellSize} ${bg} ${ring} rounded-lg transition-all ${roundState === "input" ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"
                    }`}
                  whileTap={roundState === "input" ? { scale: 0.9 } : undefined}
                />
              );
            })}
          </div>

          {/* Submit button during input */}
          {roundState === "input" && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Submit Pattern
            </button>
          )}

          {/* Feedback text */}
          {roundState === "feedback" && lastScore && (
            <div className="text-center">
              <p className="font-headline text-lg font-bold text-on-surface">
                {lastScore.correct}/{lastScore.total} cells correct
              </p>
              <p className="text-sm text-on-surface-variant">
                {lastScore.correct === lastScore.total
                  ? "Perfect! 🎯"
                  : lastScore.correct >= lastScore.total * 0.7
                    ? "Good memory!"
                    : "Keep trying!"}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
