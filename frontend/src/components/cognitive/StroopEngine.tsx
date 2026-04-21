/* ── Stroop Task Game Engine ────────────────────────────────────────────── */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StroopParams, TrialInput } from "../../services/cognitiveTypes";

const COLORS = [
  { name: "RED", hex: "#ef4444" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "GREEN", hex: "#22c55e" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#a855f7" },
  { name: "ORANGE", hex: "#f97316" },
];

interface StroopStimulus {
  word: string;
  fontColor: string;
  fontColorName: string;
  congruent: boolean;
}

function generateStimulus(congruent: boolean): StroopStimulus {
  const wordIdx = Math.floor(Math.random() * COLORS.length);
  const word = COLORS[wordIdx].name;
  if (congruent) {
    return { word, fontColor: COLORS[wordIdx].hex, fontColorName: COLORS[wordIdx].name, congruent: true };
  }
  let colorIdx = Math.floor(Math.random() * (COLORS.length - 1));
  if (colorIdx >= wordIdx) colorIdx++;
  return { word, fontColor: COLORS[colorIdx].hex, fontColorName: COLORS[colorIdx].name, congruent: false };
}

type Phase = "ready" | "playing" | "feedback" | "done";

interface Props {
  params: StroopParams;
  onComplete: (trials: TrialInput[]) => void;
  onQuit: () => void;
}

export function StroopEngine({ params, onComplete, onQuit }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [trialIdx, setTrialIdx] = useState(0);
  const [stimulus, setStimulus] = useState<StroopStimulus | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const trialsRef = useRef<TrialInput[]>([]);
  const stimStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalTrials = params.trial_count;

  const showNextStimulus = useCallback(() => {
    const congruent = Math.random() < params.congruent_ratio;
    const s = generateStimulus(congruent);
    setStimulus(s);
    stimStartRef.current = performance.now();
    setPhase("playing");

    // Auto-timeout
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Omission — no response
      trialsRef.current.push({
        trial_index: trialsRef.current.length,
        stimulus: { word: s.word, color: s.fontColorName, congruent: s.congruent },
        response: { chosen_color: "timeout" },
        is_correct: false,
        reaction_time_ms: params.time_limit_ms,
        error_type: "omission",
      });
      setLastCorrect(false);
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      setPhase("feedback");
    }, params.time_limit_ms);
  }, [params]);

  const handleAnswer = useCallback(
    (chosenColor: { name: string; hex: string }) => {
      if (phase !== "playing" || !stimulus) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      const rt = Math.round(performance.now() - stimStartRef.current);
      const isCorrect = chosenColor.name === stimulus.fontColorName;
      let errorType = "";
      if (!isCorrect) {
        errorType = stimulus.congruent ? "commission" : "interference";
      }

      trialsRef.current.push({
        trial_index: trialsRef.current.length,
        stimulus: { word: stimulus.word, color: stimulus.fontColorName, congruent: stimulus.congruent },
        response: { chosen_color: chosenColor.name },
        is_correct: isCorrect,
        reaction_time_ms: rt,
        error_type: errorType,
      });

      setLastCorrect(isCorrect);
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      setPhase("feedback");
    },
    [phase, stimulus]
  );

  // Advance after feedback
  useEffect(() => {
    if (phase !== "feedback") return;
    const t = setTimeout(() => {
      const nextIdx = trialIdx + 1;
      if (nextIdx >= totalTrials) {
        setPhase("done");
        onComplete(trialsRef.current);
      } else {
        setTrialIdx(nextIdx);
        showNextStimulus();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [phase, trialIdx, totalTrials, showNextStimulus, onComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const accuracyPct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      {/* Progress bar */}
      <div className="mb-6 flex w-full max-w-md items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((trialIdx) / totalTrials) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-label text-xs text-on-surface-variant">
          {trialIdx}/{totalTrials}
        </span>
        <button
          onClick={onQuit}
          className="ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Ready screen */}
      {phase === "ready" && (
        <motion.div
          className="flex flex-col items-center gap-6 py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-4xl text-primary">palette</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">Stroop Task</h2>
          <p className="max-w-sm text-center font-body text-sm text-on-surface-variant">
            Identify the <strong>font colour</strong> of each word, not the word itself. Respond as quickly and accurately as possible.
          </p>
          <button
            onClick={showNextStimulus}
            className="rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            Start
          </button>
        </motion.div>
      )}

      {/* Active stimulus */}
      <AnimatePresence mode="wait">
        {(phase === "playing" || phase === "feedback") && stimulus && (
          <motion.div
            key={trialIdx}
            className="flex flex-col items-center gap-8 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stimulus word */}
            <div className="relative">
              <motion.span
                className="select-none font-headline text-6xl font-black md:text-8xl"
                style={{ color: stimulus.fontColor }}
                animate={phase === "feedback"
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
                }
                transition={{ duration: 0.3 }}
              >
                {stimulus.word}
              </motion.span>
              {/* Feedback indicator */}
              {phase === "feedback" && (
                <motion.div
                  className={`absolute -right-8 -top-4 flex h-8 w-8 items-center justify-center rounded-full ${lastCorrect ? "bg-green-500" : "bg-red-500"
                    }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <span className="material-symbols-outlined text-sm text-white">
                    {lastCorrect ? "check" : "close"}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Answer buttons */}
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {COLORS.map((c) => (
                <motion.button
                  key={c.name}
                  onClick={() => handleAnswer(c)}
                  disabled={phase !== "playing"}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-14 w-14 items-center justify-center rounded-xl shadow-md transition-opacity disabled:opacity-40 md:h-16 md:w-16"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="text-xs font-bold text-white/90 drop-shadow-sm">
                    {c.name}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Live score */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done screen */}
      {phase === "done" && (
        <motion.div
          className="flex flex-col items-center gap-4 py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="material-symbols-outlined text-5xl text-primary">emoji_events</span>
          <h2 className="font-headline text-2xl font-bold">Session Complete!</h2>
          <p className="text-on-surface-variant">
            {score.correct}/{score.total} correct ({accuracyPct}%)
          </p>
          <p className="text-sm text-on-surface-variant">Submitting results...</p>
        </motion.div>
      )}
    </div>
  );
}
