/* ── Kakuro Puzzle Game Engine ──────────────────────────────────────────── */

import { useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { KakuroParams, TrialInput } from "../../services/cognitiveTypes";

/* ── Puzzle Generation ─────────────────────────────────────────────────── */

interface KakuroCell {
  type: "empty" | "clue" | "fill";
  value?: number;       // user-entered or solution value
  solution?: number;    // correct answer
  clueDown?: number;
  clueRight?: number;
  row: number;
  col: number;
}

/**
 * Simple Kakuro puzzle generator.
 * Creates a grid with clue cells and fill cells, ensuring valid sums.
 */
function generatePuzzle(params: KakuroParams): {
  grid: KakuroCell[][];
  fillCells: [number, number][];
} {
  const size = params.grid_size;

  // ---------- STEP 1: CREATE STRUCTURE ----------
  const isFill: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  for (let r = 1; r < size; r++) {
    for (let c = 1; c < size; c++) {
      isFill[r][c] = Math.random() < 0.7;
    }
  }

  // ensure runs >= 2
  for (let r = 1; r < size; r++) {
    let count = 0;
    for (let c = 1; c < size; c++) {
      if (isFill[r][c]) count++;
      else {
        if (count === 1) isFill[r][c - 1] = false;
        count = 0;
      }
    }
  }

  for (let c = 1; c < size; c++) {
    let count = 0;
    for (let r = 1; r < size; r++) {
      if (isFill[r][c]) count++;
      else {
        if (count === 1) isFill[r - 1][c] = false;
        count = 0;
      }
    }
  }

  // ---------- STEP 2: PREP GRID ----------
  const solution: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  const runsH: number[][][] = [];
  const runsV: number[][][] = [];

  // collect runs
  for (let r = 0; r < size; r++) {
    let run: number[][] = [];
    for (let c = 0; c < size; c++) {
      if (isFill[r][c]) run.push([r, c]);
      else {
        if (run.length >= 2) runsH.push(run);
        run = [];
      }
    }
    if (run.length >= 2) runsH.push(run);
  }

  for (let c = 0; c < size; c++) {
    let run: number[][] = [];
    for (let r = 0; r < size; r++) {
      if (isFill[r][c]) run.push([r, c]);
      else {
        if (run.length >= 2) runsV.push(run);
        run = [];
      }
    }
    if (run.length >= 2) runsV.push(run);
  }

  // ---------- STEP 3: SOLVER ----------
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFill[r][c]) cells.push([r, c]);
    }
  }

  const getRun = (r: number, c: number, runs: number[][][]) =>
    runs.find(run => run.some(([rr, cc]) => rr === r && cc === c)) || [];

  const isValid = (r: number, c: number, val: number) => {
    const hRun = getRun(r, c, runsH);
    const vRun = getRun(r, c, runsV);

    for (const [rr, cc] of hRun) {
      if (solution[rr][cc] === val) return false;
    }
    for (const [rr, cc] of vRun) {
      if (solution[rr][cc] === val) return false;
    }

    return true;
  };

  const solve = (idx: number): boolean => {
    if (idx >= cells.length) return true;

    const [r, c] = cells[idx];

    const digits = shuffle([1,2,3,4,5,6,7,8,9]);

    for (const d of digits) {
      if (!isValid(r, c, d)) continue;

      solution[r][c] = d;

      if (solve(idx + 1)) return true;

      solution[r][c] = 0;
    }

    return false;
  };

  const shuffle = (arr: number[]) =>
    [...arr].sort(() => Math.random() - 0.5);

  const solved = solve(0);

  if (!solved) {
    // Fallback: create a small guaranteed-solvable 2x2 block
    const digits = [1, 2, 3, 4];

    // clear any fills and solutions
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        isFill[rr][cc] = false;
        solution[rr][cc] = 0;
      }
    }

    for (let i = 0; i < 4; i++) {
      const rr = 1 + Math.floor(i / 2);
      const cc = 1 + (i % 2);
      if (rr < size && cc < size) {
        isFill[rr][cc] = true;
        solution[rr][cc] = digits[i];
      }
    }
  }

  // ---------- STEP 4: BUILD GRID ----------
  const grid: KakuroCell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      type: "empty",
      row: r,
      col: c,
    }))
  );

  const fillCells: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFill[r][c]) {
        grid[r][c] = {
          type: "fill",
          solution: solution[r][c],
          row: r,
          col: c,
        };
        fillCells.push([r, c]);
      }
    }
  }

  // ---------- STEP 5: CLUES ----------
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].type !== "empty") continue;

      let clueRight = 0;
      let clueDown = 0;

      if (c + 1 < size && grid[r][c + 1].type === "fill") {
        let cc = c + 1;
        while (cc < size && grid[r][cc].type === "fill") {
          clueRight += grid[r][cc].solution!;
          cc++;
        }
      }

      if (r + 1 < size && grid[r + 1][c].type === "fill") {
        let rr = r + 1;
        while (rr < size && grid[rr][c].type === "fill") {
          clueDown += grid[rr][c].solution!;
          rr++;
        }
      }

      if (clueRight || clueDown) {
        grid[r][c] = {
          type: "clue",
          clueRight: clueRight || undefined,
          clueDown: clueDown || undefined,
          row: r,
          col: c,
        };
      }
    }
  }

  return { grid, fillCells };
}

// helper
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
type Phase = "ready" | "playing" | "checking" | "done";

interface Props {
  params: KakuroParams;
  onComplete: (trials: TrialInput[]) => void;
  onQuit: () => void;
}

export function KakuroEngine({ params, onComplete, onQuit }: Props) {
  const puzzle = useMemo(() => generatePuzzle(params), [params]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [userValues, setUserValues] = useState<Record<string, number | null>>({});
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [hintsLeft, setHintsLeft] = useState(params.hints_available);
  const startTimeRef = useRef(0);

  const handleCellInput = useCallback(
    (row: number, col: number, value: number) => {
      if (phase !== "playing") return;
      const key = `${row},${col}`;
      setUserValues(prev => ({ ...prev, [key]: value }));
      setErrors(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [phase]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell || phase !== "playing") return;
      const [r, c] = selectedCell;
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= 9) {
        handleCellInput(r, c, digit);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        const key = `${r},${c}`;
        setUserValues(prev => ({ ...prev, [key]: null }));
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Navigate
        const dr = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        const dc = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < params.grid_size && nc >= 0 && nc < params.grid_size) {
          if (puzzle.grid[nr]?.[nc]?.type === "fill") {
            setSelectedCell([nr, nc]);
          }
        }
      }
    },
    [selectedCell, phase, handleCellInput, params.grid_size, puzzle.grid]
  );

  const useHint = useCallback(() => {
    if (hintsLeft <= 0 || !selectedCell || phase !== "playing") return;
    const [r, c] = selectedCell;
    const cell = puzzle.grid[r]?.[c];
    if (cell?.type === "fill" && cell.solution) {
      handleCellInput(r, c, cell.solution);
      setHintsLeft(prev => prev - 1);
    }
  }, [hintsLeft, selectedCell, phase, puzzle.grid, handleCellInput]);

  const checkSolution = useCallback(() => {
    const trials: TrialInput[] = [];
    const newErrors = new Set<string>();
    let correctCount = 0;

    // Total reaction time since start (same for all trials in this simple implementation)
    const rt = Math.round(performance.now() - startTimeRef.current);

    puzzle.fillCells.forEach(([r, c], idx) => {
      const key = `${r},${c}`;
      const cell = puzzle.grid[r][c];
      const userVal = userValues[key];
      const isCorrect = userVal === cell.solution;

      if (!isCorrect) newErrors.add(key);
      else correctCount++;

      trials.push({
        trial_index: idx,
        stimulus: { row: r, col: c, solution: cell.solution ?? 0, grid_size: params.grid_size },
        // Use null for missing responses so the backend can distinguish omissions
        response: { value: userVal ?? null },
        is_correct: isCorrect,
        // Report the full elapsed time (do not divide by number of cells)
        reaction_time_ms: rt,
        // Treat both undefined and null as omissions
        error_type: isCorrect ? "" : (userVal == null ? "omission" : "commission"),
      });
    });

    setErrors(newErrors);

    if (newErrors.size === 0) {
      setPhase("done");
      onComplete(trials);
    } else {
      setPhase("checking");
      // After showing errors, allow more attempts
      setTimeout(() => setPhase("playing"), 1500);
    }
  }, [puzzle, userValues, params.grid_size, onComplete]);

  const filledCount = puzzle.fillCells.filter(([r, c]) => userValues[`${r},${c}`] != null).length;
  const totalFills = puzzle.fillCells.length;

  const cellSizeClass = params.grid_size <= 5
    ? "h-12 w-12 text-lg md:h-14 md:w-14"
    : params.grid_size <= 7
      ? "h-10 w-10 text-base md:h-12 md:w-12"
      : "h-8 w-8 text-sm md:h-10 md:w-10";

  return (
    <div
      className="flex flex-col items-center outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="mb-6 flex w-full max-w-lg items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
            <span>{filledCount}/{totalFills} cells filled</span>
            {hintsLeft > 0 && (
              <button
                onClick={useHint}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                {hintsLeft} hint{hintsLeft > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${(filledCount / Math.max(1, totalFills)) * 100}%` }}
              transition={{ duration: 0.3 }}
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
            <span className="material-symbols-outlined text-4xl text-primary">calculate</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">Kakuro</h2>
          <p className="max-w-sm text-center font-body text-sm text-on-surface-variant">
            Fill each cell with digits 1–9 so that each group of cells sums to the clue number. No digit may repeat within a group.
          </p>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span>{params.grid_size}×{params.grid_size}</span>
            <span>•</span>
            <span>{totalFills} cells</span>
            {params.hints_available > 0 && (
              <>
                <span>•</span>
                <span>{params.hints_available} hints</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setPhase("playing");
              startTimeRef.current = performance.now();
            }}
            className="rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            Start
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {(phase === "playing" || phase === "checking") && (
        <div className="flex flex-col items-center gap-6">
          <div
            className="grid gap-0.5 rounded-xl bg-outline-variant/30 p-1"
            style={{ gridTemplateColumns: `repeat(${params.grid_size}, 1fr)` }}
          >
            {puzzle.grid.flat().map((cell) => {
              const key = `${cell.row},${cell.col}`;
              const isSelected = selectedCell?.[0] === cell.row && selectedCell?.[1] === cell.col;
              const hasError = errors.has(key);

              if (cell.type === "empty") {
                return (
                  <div
                    key={key}
                    className={`${cellSizeClass} bg-surface-container-lowest`}
                  />
                );
              }

              if (cell.type === "clue") {
                return (
                  <div
                    key={key}
                    className={`${cellSizeClass} relative flex items-center justify-center bg-surface-container-highest`}
                  >
                    {cell.clueRight != null && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-primary">
                        {cell.clueRight}→
                      </span>
                    )}
                    {cell.clueDown != null && (
                      <span className="absolute right-0.5 top-0.5 text-[10px] font-bold text-tertiary">
                        {cell.clueDown}↓
                      </span>
                    )}
                  </div>
                );
              }

              // Fill cell
              const userVal = userValues[key];
              return (
                <motion.button
                  key={key}
                  onClick={() => setSelectedCell([cell.row, cell.col])}
                  animate={hasError ? { x: [0, -3, 3, -3, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`${cellSizeClass} flex items-center justify-center font-headline font-bold transition-all ${isSelected
                    ? "bg-primary/20 text-primary ring-2 ring-primary"
                    : hasError
                      ? "bg-error/15 text-error ring-1 ring-error"
                      : userVal
                        ? "bg-surface text-on-surface"
                        : "bg-surface text-on-surface-variant/30 hover:bg-surface-container-low"
                    }`}
                >
                  {userVal ?? ""}
                </motion.button>
              );
            })}
          </div>

          {/* Number pad */}
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <motion.button
                key={n}
                onClick={() => {
                  if (selectedCell) handleCellInput(selectedCell[0], selectedCell[1], n);
                }}
                whileTap={{ scale: 0.9 }}
                disabled={!selectedCell}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-high font-bold text-on-surface shadow-sm transition-all hover:bg-surface-container-highest disabled:opacity-30"
              >
                {n}
              </motion.button>
            ))}
          </div>

          {/* Check button */}
          <button
            onClick={checkSolution}
            disabled={filledCount < totalFills}
            className="rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            Check Solution
          </button>
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
          <h2 className="font-headline text-2xl font-bold">Puzzle Solved!</h2>
          <p className="text-on-surface-variant">All cells correct</p>
          <p className="text-sm text-on-surface-variant">Submitting results...</p>
        </motion.div>
      )}
    </div>
  );
}
