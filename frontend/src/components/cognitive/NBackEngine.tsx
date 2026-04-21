/* ── N-Back Task Game Engine ────────────────────────────────────────────── */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NBackParams, TrialInput } from "../../services/cognitiveTypes";

const LETTERS = "BCDFGHJKLMNPQRSTVWXYZ".split("");

interface NBackStimulus {
  letter: string;
  position?: number; // 0-8 for 3x3 grid
  isTarget: boolean;
}

function generateSequence(params: NBackParams): NBackStimulus[] {
  const seq: NBackStimulus[] = [];
  const n = params.n_level;
  const len = params.sequence_length;

  for (let i = 0; i < len; i++) {
    const canBeTarget = i >= n;
    const isTarget = canBeTarget && Math.random() < params.target_ratio;

    if (isTarget) {
      seq.push({
        letter: seq[i - n].letter,
        position: seq[i - n].position,
        isTarget: true,
      });
    } else {
      // Generate non-matching stimulus
      let letter: string;
      do {
        letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } while (i >= n && letter === seq[i - n].letter);

      let position: number | undefined;
      if (params.stimulus_type !== "letter") {
        do {
          position = Math.floor(Math.random() * 9);
        } while (i >= n && position === seq[i - n].position);
      }

      seq.push({ letter, position, isTarget: false });
    }
  }
  return seq;
}

type Phase = "ready" | "showing" | "waiting" | "feedback" | "done";

interface Props {
  params: NBackParams;
  onComplete: (trials: TrialInput[]) => void;
  onQuit: () => void;
}

export function NBackEngine({ params, onComplete, onQuit }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [sequence, setSequence] = useState<NBackStimulus[]>([]);
  const [lastFeedback, setLastFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [responded, setResponded] = useState(false);
  const trialsRef = useRef<TrialInput[]>([]);
  const stimStartRef = useRef(0);

  const showDuration = Math.round(params.isi_ms * 0.6);
  const blankDuration = params.isi_ms - showDuration;

  const startGame = useCallback(() => {
    const seq = generateSequence(params);
    setSequence(seq);
    setCurrentIdx(0);
    setPhase("showing");
    stimStartRef.current = performance.now();
    setScore({ correct: 0, total: 0 });
    trialsRef.current = [];
  }, [params]);

  const handleResponse = useCallback(
    (userSaysMatch: boolean) => {
      if (currentIdx < 0 || currentIdx >= sequence.length || responded) return;
      setResponded(true);

      const rt = Math.round(performance.now() - stimStartRef.current);
      const stim = sequence[currentIdx];
      const isCorrect = userSaysMatch === stim.isTarget;

      let errorType = "";
      if (!isCorrect) {
        errorType = userSaysMatch ? "commission" : "omission";
      }

      trialsRef.current.push({
        trial_index: currentIdx,
        stimulus: { letter: stim.letter, position: stim.position ?? -1, isTarget: stim.isTarget, n_level: params.n_level },
        response: { user_says_match: userSaysMatch },
        is_correct: isCorrect,
        reaction_time_ms: rt,
        error_type: errorType,
      });

      setLastFeedback(isCorrect ? "correct" : "incorrect");
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [currentIdx, sequence, responded, params.n_level]
  );

  // Auto-advance through sequence
  useEffect(() => {
    if (phase === "ready" || phase === "done") return;

    if (phase === "showing") {
      const t = setTimeout(() => {
        setPhase("waiting");
      }, showDuration);
      return () => clearTimeout(t);
    }

    if (phase === "waiting" || phase === "feedback") {
      const t = setTimeout(() => {
        // Record omission if user didn't respond to a target
        if (!responded && currentIdx >= 0 && currentIdx < sequence.length) {
          const stim = sequence[currentIdx];
          if (stim.isTarget) {
            trialsRef.current.push({
              trial_index: currentIdx,
              stimulus: { letter: stim.letter, position: stim.position ?? -1, isTarget: true, n_level: params.n_level },
              response: { user_says_match: false },
              is_correct: false,
              reaction_time_ms: params.isi_ms,
              error_type: "omission",
            });
            setScore(prev => ({ ...prev, total: prev.total + 1 }));
          } else {
            // Correct rejection (not a target, didn't respond)
            trialsRef.current.push({
              trial_index: currentIdx,
              stimulus: { letter: stim.letter, position: stim.position ?? -1, isTarget: false, n_level: params.n_level },
              response: { user_says_match: false },
              is_correct: true,
              reaction_time_ms: params.isi_ms,
              error_type: "",
            });
            setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
          }
        }

        const nextIdx = currentIdx + 1;
        if (nextIdx >= sequence.length) {
          setPhase("done");
          onComplete(trialsRef.current);
        } else {
          setCurrentIdx(nextIdx);
          setResponded(false);
          setLastFeedback(null);
          setPhase("showing");
          stimStartRef.current = performance.now();
        }
      }, blankDuration);
      return () => clearTimeout(t);
    }
  }, [phase, currentIdx, sequence, responded, showDuration, blankDuration, params, onComplete]);

  const stim = currentIdx >= 0 && currentIdx < sequence.length ? sequence[currentIdx] : null;
  const accuracyPct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="mb-6 flex w-full max-w-md items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(Math.max(0, currentIdx) / sequence.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-label text-xs text-on-surface-variant">
          {Math.max(0, currentIdx + 1)}/{sequence.length || params.sequence_length}
        </span>
        <button
          onClick={onQuit}
          className="ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
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
            <span className="material-symbols-outlined text-4xl text-primary">grid_view</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            {params.n_level}-Back
          </h2>
          <p className="max-w-sm text-center font-body text-sm text-on-surface-variant">
            Press <strong>Match</strong> when the current letter is the same as the one shown <strong>{params.n_level} step{params.n_level > 1 ? "s" : ""} ago</strong>.
          </p>
          <button
            onClick={startGame}
            className="rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            Start
          </button>
        </motion.div>
      )}

      {/* Game area */}
      {phase !== "ready" && phase !== "done" && (
        <div className="flex flex-col items-center gap-8 py-8">
          {/* N-level indicator */}
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-1.5">
            <span className="font-label text-xs font-bold uppercase tracking-wider text-primary">
              {params.n_level}-Back
            </span>
          </div>

          {/* Stimulus display */}
          <div className="relative flex h-40 w-40 items-center justify-center rounded-2xl bg-surface-container-highest shadow-inner md:h-48 md:w-48">
            <AnimatePresence mode="wait">
              {phase === "showing" && stim && (
                <motion.span
                  key={`${currentIdx}-${stim.letter}`}
                  className="select-none font-headline text-7xl font-black text-primary md:text-8xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {stim.letter}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Feedback overlay */}
            {lastFeedback && (
              <motion.div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl ${lastFeedback === "correct"
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
                  }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </div>

          {/* Response buttons */}
          <div className="flex gap-4">
            <motion.button
              onClick={() => handleResponse(true)}
              disabled={responded || phase !== "showing"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-opacity disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Match
            </motion.button>
            <motion.button
              onClick={() => handleResponse(false)}
              disabled={responded || phase !== "showing"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-surface-container-highest px-8 py-3 font-bold text-on-surface shadow transition-opacity disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              No Match
            </motion.button>
          </div>

          {/* Score */}
          <div className="flex gap-6 text-sm text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary">check_circle</span>
              {score.correct}/{score.total}
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary">speed</span>
              {accuracyPct}%
            </div>
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
          <h2 className="font-headline text-2xl font-bold">Session Complete!</h2>
          <p className="text-on-surface-variant">{score.correct}/{score.total} correct ({accuracyPct}%)</p>
          <p className="text-sm text-on-surface-variant">Submitting results...</p>
        </motion.div>
      )}
    </div>
  );
}
