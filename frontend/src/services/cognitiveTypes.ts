/* ── Cognitive Training — Shared TypeScript Types ───────────────────────── */

export interface CognitiveTask {
  id: number;
  slug: "stroop" | "nback" | "schulte" | "kakuro";
  display_name: string;
  description: string;
  brain_regions: string[];
  cognitive_domains: string[];
  research_refs: ResearchRef[];
  icon_name: string;
  min_difficulty: number;
  max_difficulty: number;
}

export interface ResearchRef {
  title: string;
  authors: string;
  year: number;
  doi: string;
  summary: string;
}

/* ── Session ─────────────────────────────────────────────────────────────── */

export interface SessionStartResponse {
  session_id: number;
  task: string;
  difficulty: number;
  task_params: Record<string, unknown>;
  started_at: string;
}

export interface SessionCompleteRequest {
  ended_at: string;
  trials: TrialInput[];
}

export interface TrialInput {
  trial_index: number;
  stimulus: Record<string, unknown>;
  response: Record<string, unknown>;
  is_correct: boolean;
  reaction_time_ms: number;
  error_type: string;
}

export interface SessionCompleteResponse {
  session_id: number;
  metrics: {
    total_trials: number;
    correct: number;
    accuracy: number;
    avg_reaction_time_ms: number;
    error_breakdown: Record<string, number>;
    duration_seconds: number;
  };
  rl_decision: {
    reward: number;
    previous_difficulty: number;
    next_difficulty: number;
    action_taken: string;
  };
  updated_profile: Record<string, number>;
}

export interface CognitiveSessionSummary {
  id: number;
  task_slug: string;
  task_display_name: string;
  started_at: string;
  ended_at: string | null;
  difficulty: number;
  total_trials: number;
  correct_trials: number;
  accuracy: number;
  avg_reaction_time_ms: number;
  error_breakdown: Record<string, number>;
  reward: number | null;
  rl_action: number | null;
  duration_seconds: number | null;
}

/* ── Profile ─────────────────────────────────────────────────────────────── */

export interface CognitiveProfile {
  attention_score: number;
  working_memory_score: number;
  processing_speed_score: number;
  problem_solving_score: number;
  task_stats: Record<string, TaskStats>;
  total_training_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  sessions_completed: number;
  current_difficulty: number;
  best_accuracy: number;
  avg_reaction_time_ms: number;
  last_played: string | null;
}

/* ── History ─────────────────────────────────────────────────────────────── */

export interface HistoryDataPoint {
  date: string;
  accuracy: number;
  avg_rt_ms: number;
  difficulty: number;
  session_count: number;
}

export interface HistoryResponse {
  task: string;
  data_points: HistoryDataPoint[];
}

/* ── Leaderboard ─────────────────────────────────────────────────────────── */

export interface LeaderboardEntry {
  rank: number;
  username: string;
  sessions_completed: number;
  best_accuracy: number;
  current_difficulty: number;
}

/* ── Stroop Task Params ──────────────────────────────────────────────────── */

export interface StroopParams {
  congruent_ratio: number;
  trial_count: number;
  time_limit_ms: number;
  variations: string[];
  distractors: string;
}

/* ── N-Back Task Params ──────────────────────────────────────────────────── */

export interface NBackParams {
  n_level: number;
  sequence_length: number;
  stimulus_type: string;
  target_ratio: number;
  isi_ms: number;
}

/* ── Schulte Task Params ─────────────────────────────────────────────────── */

export interface SchulteParams {
  grid_size: number;
  mode: "sequential" | "alternating";
  time_limit_s: number;
  highlight_previous: boolean;
}

/* ── Kakuro Task Params ──────────────────────────────────────────────────── */

export interface KakuroParams {
  grid_size: number;
  max_clue_sum: number;
  empty_cells_range: [number, number];
  hints_available: number;
  max_cells_per_clue: number;
}
