/* ── Cognitive Dashboard — Performance Charts & Profile ─────────────────── */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts";
import { cognitiveService } from "../../services/cognitiveService";
import type {
  CognitiveProfile,
  CognitiveSessionSummary,
  HistoryDataPoint,
  LeaderboardEntry,
} from "../../services/cognitiveTypes";

const TASK_META: Record<string, { label: string; icon: string; color: string }> = {
  stroop: { label: "Stroop", icon: "palette", color: "#8b5cf6" },
  nback: { label: "N-Back", icon: "grid_view", color: "#3b82f6" },
  schulte: { label: "Schulte", icon: "apps", color: "#22c55e" },
  kakuro: { label: "Kakuro", icon: "calculate", color: "#f59e0b" },
};

interface Props {
  onStartTask: (slug: string) => void;
}

export function CognitiveDashboard({ onStartTask }: Props) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [sessions, setSessions] = useState<CognitiveSessionSummary[]>([]);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState("stroop");
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, s] = await Promise.all([
          cognitiveService.getProfile(),
          cognitiveService.listSessions(undefined, 20),
        ]);
        if (!alive) return;
        setProfile(p);
        setSessions(s);
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load chart data when task changes
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [h, lb] = await Promise.all([
          cognitiveService.getHistory(selectedTask, 30),
          cognitiveService.getLeaderboard(selectedTask, 10),
        ]);
        if (!alive) return;
        setHistory(h.data_points);
        setLeaderboard(lb);
      } catch {
        if (alive) {
          setHistory([]);
          setLeaderboard([]);
        }
      }
    })();
    return () => { alive = false; };
  }, [selectedTask]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!profile) return [];
    return [
      { domain: "Attention", value: profile.attention_score },
      { domain: "Working Memory", value: profile.working_memory_score },
      { domain: "Processing Speed", value: profile.processing_speed_score },
      { domain: "Problem Solving", value: profile.problem_solving_score },
    ];
  }, [profile]);

  // Recent sessions bar data
  const sessionBarData = useMemo(() => {
    return sessions
      .filter(s => s.ended_at)
      .slice(0, 10)
      .reverse()
      .map((s, i) => ({
        name: `#${i + 1}`,
        accuracy: Math.round(s.accuracy * 100),
        difficulty: s.difficulty,
        task: s.task_slug,
      }));
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Task Selector Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(TASK_META).map(([slug, meta]) => {
          const stats = profile?.task_stats?.[slug];
          return (
            <motion.div
              key={slug}
              whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
              className={`group relative cursor-pointer overflow-hidden rounded-xl p-5 shadow-sm transition-all ${selectedTask === slug
                ? "bg-primary text-on-primary ring-2 ring-primary"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              onClick={() => setSelectedTask(slug)}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`material-symbols-outlined text-2xl ${selectedTask === slug ? "text-on-primary" : "text-primary"
                    }`}
                >
                  {meta.icon}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTask(slug);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all hover:scale-105 ${selectedTask === slug
                    ? "bg-white/20 text-on-primary"
                    : "bg-primary/10 text-primary"
                    }`}
                >
                  Play
                </button>
              </div>
              <h3 className="font-headline text-sm font-bold">{meta.label}</h3>
              {stats ? (
                <div className={`mt-1 text-xs ${selectedTask === slug ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                  {stats.sessions_completed} sessions • d{stats.current_difficulty}
                </div>
              ) : (
                <div className={`mt-1 text-xs ${selectedTask === slug ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                  Not started yet
                </div>
              )}
              {/* Decorative blob */}
              <div
                className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full opacity-10 blur-xl"
                style={{ backgroundColor: meta.color }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── Two-column: Radar + Stats ──────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Cognitive Radar */}
        <motion.div
          className="rounded-xl bg-surface-container-low p-6 shadow-sm md:col-span-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-headline mb-4 text-lg font-bold text-on-surface">
            Cognitive Profile
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgb(var(--outline-variant) / 0.3)" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: "rgb(var(--on-surface-variant))", fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke="rgb(var(--primary))"
                  fill="rgb(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-on-surface-variant">
              Complete sessions to build your profile
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="rounded-xl bg-surface-container-low p-6 shadow-sm md:col-span-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-headline mb-4 text-lg font-bold text-on-surface">
            Training Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                icon: "timer",
                value: profile ? `${Math.round(profile.total_training_minutes)}m` : "0m",
                label: "Total Time",
              },
              {
                icon: "trending_up",
                value: sessions.length > 0
                  ? `${Math.round(sessions.filter(s => s.ended_at).reduce((s, x) => s + x.accuracy, 0) / Math.max(1, sessions.filter(s => s.ended_at).length) * 100)}%`
                  : "—",
                label: "Avg Accuracy",
              },
              {
                icon: "psychology",
                value: sessions.filter(s => s.ended_at).length.toString(),
                label: "Sessions",
              },
              {
                icon: "speed",
                value: sessions.length > 0
                  ? `${Math.round(sessions.filter(s => s.ended_at).reduce((s, x) => s + x.avg_reaction_time_ms, 0) / Math.max(1, sessions.filter(s => s.ended_at).length))}ms`
                  : "—",
                label: "Avg RT",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-surface p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">{stat.icon}</span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {stat.label}
                  </span>
                </div>
                <div className="font-headline text-2xl font-bold text-on-surface">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Domain scores */}
          {profile && (
            <div className="mt-4 space-y-3">
              {radarData.map((d) => (
                <div key={d.domain} className="flex items-center gap-3">
                  <span className="w-32 text-xs font-medium text-on-surface-variant">{d.domain}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-on-surface">{Math.round(d.value)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Progress Chart ──────────────────────────────────────────────── */}
      <motion.div
        className="rounded-xl bg-surface-container-low p-6 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Progress — {TASK_META[selectedTask]?.label}
          </h3>
          <div className="flex gap-1 rounded-full bg-surface-container-highest p-1">
            {Object.entries(TASK_META).map(([slug, meta]) => (
              <button
                key={slug}
                onClick={() => setSelectedTask(slug)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${selectedTask === slug
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(var(--outline-variant) / 0.2)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgb(var(--on-surface-variant))", fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgb(var(--on-surface-variant))", fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--outline-variant) / 0.3)",
                  borderRadius: "12px",
                  color: "rgb(var(--on-surface))",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === "accuracy") return [`${Math.round(value * 100)}%`, "Accuracy"];
                  if (name === "difficulty") return [value, "Difficulty"];
                  return [value, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="rgb(var(--primary))"
                strokeWidth={2}
                fill="url(#accGrad)"
                dot={{ r: 3, fill: "rgb(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-on-surface-variant">
            <div className="text-center">
              <span className="material-symbols-outlined mb-2 block text-4xl text-primary/30">show_chart</span>
              Complete some {TASK_META[selectedTask]?.label} sessions to see your progress
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Recent Sessions Bar + Leaderboard ──────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Recent sessions */}
        <motion.div
          className="rounded-xl bg-surface-container-low p-6 shadow-sm md:col-span-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="font-headline mb-4 text-lg font-bold text-on-surface">Recent Sessions</h3>
          {sessionBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--outline-variant) / 0.2)" />
                <XAxis dataKey="name" tick={{ fill: "rgb(var(--on-surface-variant))", fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgb(var(--on-surface-variant))", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(var(--surface))",
                    border: "1px solid rgb(var(--outline-variant) / 0.3)",
                    borderRadius: "12px",
                    color: "rgb(var(--on-surface))",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="accuracy" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-on-surface-variant">
              No sessions yet
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          className="rounded-xl bg-surface-container-low p-6 shadow-sm md:col-span-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-headline mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary">leaderboard</span>
            Leaderboard — {TASK_META[selectedTask]?.label}
          </h3>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-3 rounded-lg bg-surface p-3 transition-colors hover:bg-surface-container"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${entry.rank === 1
                      ? "bg-yellow-400/20 text-yellow-600"
                      : entry.rank === 2
                        ? "bg-gray-300/20 text-gray-500"
                        : entry.rank === 3
                          ? "bg-orange-400/20 text-orange-500"
                          : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                  >
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-on-surface">{entry.username}</div>
                    <div className="text-xs text-on-surface-variant">
                      {entry.sessions_completed} sessions • d{entry.current_difficulty}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {Math.round(entry.best_accuracy * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-on-surface-variant">
              Not enough data yet
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
