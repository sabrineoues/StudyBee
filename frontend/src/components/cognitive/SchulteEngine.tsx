/* ── Schulte Table Game Engine ──────────────────────────────────────────── */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { SchulteParams, TrialInput } from "../../services/cognitiveTypes";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "ready" | "playing" | "done";

interface Props {
  params: SchulteParams;
  onComplete: (trials: TrialInput[]) => void;
  onQuit: () => void;
}

export function SchulteEngine({ params, onComplete, onQuit }: Props) {
  const totalCells = params.grid_size * params.grid_size;
  const grid = useMemo(() => {
    const numbers = Array.from({ length: totalCells }, (_, i) => i + 1);
    return shuffleArray(numbers);
  }, [totalCells]);

  const [phase, setPhase] = useState<Phase>("ready");
  const [nextTarget, setNextTarget] = useState(1);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(params.time_limit_s);
  const trialsRef = useRef<TrialInput[]>([]);
  const cellStartRef = useRef(0);
  const gameStartRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setPhase("playing");
    setNextTarget(1);
    setFound(new Set());
    setTimeLeft(params.time_limit_s);
    trialsRef.current = [];
    cellStartRef.current = performance.now();
    gameStartRef.current = performance.now();

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [params.time_limit_s]);

  // Time expired
  useEffect(() => {
    if (timeLeft <= 0 && phase === "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase("done");
      onComplete(trialsRef.current);
    }
  }, [timeLeft, phase, onComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleCellClick = useCallback(
    (value: number, cellIndex: number) => {
      if (phase !== "playing") return;

      const rt = Math.round(performance.now() - cellStartRef.current);
      const isCorrect = value === nextTarget;

      trialsRef.current.push({
        trial_index: trialsRef.current.length,
        stimulus: { target: nextTarget, grid_size: params.grid_size },
        response: { clicked_value: value, cell_index: cellIndex },
        is_correct: isCorrect,
        reaction_time_ms: rt,
        error_type: isCorrect ? "" : "commission",
      });

      if (isCorrect) {
        const newFound = new Set(found);
        newFound.add(value);
        setFound(newFound);
        setWrongCell(null);

        if (value >= totalCells) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase("done");
          onComplete(trialsRef.current);
        } else {
          setNextTarget(value + 1);
          cellStartRef.current = performance.now();
        }
      } else {
        setWrongCell(cellIndex);
        setTimeout(() => setWrongCell(null), 400);
      }
    },
    [phase, nextTarget, found, totalCells, params.grid_size, onComplete]
  );

  const completedPct = Math.round(((nextTarget - 1) / totalCells) * 100);
  const timePct = params.time_limit_s > 0 ? (timeLeft / params.time_limit_s) * 100 : 100;

  // Dynamic cell sizing
  const cellSize = params.grid_size <= 4 ? "h-16 w-16 text-xl md:h-20 md:w-20 md:text-2xl"
    : params.grid_size <= 5 ? "h-14 w-14 text-lg md:h-16 md:w-16 md:text-xl"
      : params.grid_size <= 6 ? "h-12 w-12 text-base md:h-14 md:w-14 md:text-lg"
        : "h-10 w-10 text-sm md:h-12 md:w-12 md:text-base";

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-6 flex w-full max-w-lg items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
            <span>Progress: {completedPct}%</span>
            <span className={`font-bold ${timeLeft <= 10 ? "text-error" : ""}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <motion.div
              className={`h-full transition-colors ${timeLeft <= 10 ? "bg-error" : "bg-primary"}`}
              animate={{ width: `${timePct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <button
          onClick={onQuit}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Ready */}
      {phase === "ready" && (
        <motion.div
          className="flex flex-col items-center gap-6 py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-4xl text-primary">apps</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">Schulte Table</h2>
          <p className="max-w-sm text-center font-body text-sm text-on-surface-variant">
            Find and click the numbers in order from <strong>1 to {totalCells}</strong> as fast as possible.
            {params.mode === "alternating" && " Numbers alternate between two sequences."}
          </p>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-base">grid_on</span>
            {params.grid_size}×{params.grid_size} grid
            <span className="mx-1">•</span>
            <span className="material-symbols-outlined text-base">timer</span>
            {params.time_limit_s}s
          </div>
          <button
            onClick={startGame}
            className="rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            Start
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {phase === "playing" && (
        <div className="flex flex-col items-center gap-4">
          {/* Next target indicator */}
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <span className="text-sm text-on-surface-variant">Find:</span>
            <span className="font-headline text-xl font-black text-primary">{nextTarget}</span>
          </div>

          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${params.grid_size}, 1fr)` }}
          >
            {grid.map((num, idx) => {
              const isFound = found.has(num);
              const isWrong = wrongCell === idx;

              return (
                <motion.button
                  key={`${idx}-${num}`}
                  onClick={() => handleCellClick(num, idx)}
                  disabled={isFound}
                  whileTap={!isFound ? { scale: 0.9 } : undefined}
                  animate={isWrong ? { x: [0, -4, 4, -4, 0] } : {}}
                  transition={isWrong ? { duration: 0.3 } : undefined}
                  className={`${cellSize} flex items-center justify-center rounded-xl font-headline font-bold transition-all ${isFound
                    ? "bg-primary/20 text-primary/40 shadow-none"
                    : isWrong
                      ? "bg-error/20 text-error ring-2 ring-error"
                      : "bg-surface-container-highest text-on-surface shadow-sm hover:bg-surface-container-high hover:shadow-md active:shadow-none"
                    }`}
                >
                  {isFound && params.highlight_previous ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    num
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <motion.div
          className="flex flex-col items-center gap-4 py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="material-symbols-outlined text-5xl text-primary">emoji_events</span>
          <h2 className="font-headline text-2xl font-bold">
            {nextTarget > totalCells ? "Table Complete!" : "Time's Up!"}
          </h2>
          <p className="text-on-surface-variant">
            Found {nextTarget - 1} of {totalCells} numbers
          </p>
          <p className="text-sm text-on-surface-variant">Submitting results...</p>
        </motion.div>
      )}
    </div>
  );
}
