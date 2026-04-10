import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  studysessionsService,
  type AdminStudySession,
  type AdminStudySessionUpdate,
} from "../../services/studysessionsService";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminStudySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [editingSession, setEditingSession] = useState<AdminStudySession | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editStatus, setEditStatus] = useState<"in_progress" | "completed">("in_progress");
  const [editFocusScore, setEditFocusScore] = useState(0);
  const [editStreakScore, setEditStreakScore] = useState(0);

  const statusStats = useMemo(() => {
    const source = sessions ?? [];
    const inProgress = source.filter((s) => s.status === "in_progress").length;
    const completed = source.filter((s) => s.status === "completed").length;
    const total = source.length;
    return { inProgress, completed, total };
  }, [sessions]);

  const pieGradient = useMemo(() => {
    if (!statusStats.total) return "conic-gradient(#d8c6bc 0deg 360deg)";
    const completedDeg = (statusStats.completed / statusStats.total) * 360;
    return `conic-gradient(#4c69b8 0deg ${completedDeg}deg, #d38b73 ${completedDeg}deg 360deg)`;
  }, [statusStats]);

  const monthlyStats = useMemo(() => {
    const source = sessions ?? [];
    const months: Array<{ key: string; label: string; count: number }> = [];

    const currentYear = new Date().getFullYear();
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const d = new Date(currentYear, monthIndex, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      months.push({ key, label, count: 0 });
    }

    source.forEach((session) => {
      const d = new Date(session.created_at);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const item = months.find((m) => m.key === key && key.startsWith(`${currentYear}-`));
      if (item) item.count += 1;
    });

    const max = Math.max(1, ...months.map((m) => m.count));
    return { months, max };
  }, [sessions]);

  const weekdayStats = useMemo(() => {
    const source = sessions ?? [];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    source.forEach((session) => {
      const d = new Date(session.created_at);
      if (Number.isNaN(d.getTime())) return;
      const day = d.getDay();
      const mondayFirst = (day + 6) % 7;
      counts[mondayFirst] += 1;
    });

    const max = Math.max(1, ...counts);
    const points = counts
      .map((count, index) => {
        const x = (index / (counts.length - 1)) * 100;
        const y = 100 - (count / max) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return { labels, counts, max, points };
  }, [sessions]);

  async function reload() {
    setError(null);
    try {
      const res = await studysessionsService.listAllAdmin();
      setSessions(res);
    } catch (err) {
      const maybeAny = err as { response?: { status?: number } };
      const status = maybeAny?.response?.status;
      if (status === 401) setError("Session expired. Please sign in again.");
      else if (status === 403) setError("Access denied. Your account is not staff.");
      else setError("Failed to load sessions.");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (!sessions) return null;

    const q = query.trim().toLowerCase();

    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;

      if (!q) return true;
      return (
        String(s.id).includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      );
    });
  }, [sessions, query, statusFilter]);

  function openEdit(session: AdminStudySession) {
    setEditingSession(session);
    setEditTitle(session.title);
    setEditSubject(session.subject);
    setEditStatus(session.status);
    setEditFocusScore(session.focusScore);
    setEditStreakScore(session.streakscore);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSession) return;

    setBusyId(editingSession.id);
    setError(null);

    const payload: AdminStudySessionUpdate = {
      title: editTitle,
      subject: editSubject,
      status: editStatus,
      focusScore: editFocusScore,
      streakscore: editStreakScore,
    };

    try {
      const updated = await studysessionsService.updateAdminSession(editingSession.id, payload);
      setSessions((previous) =>
        previous ? previous.map((s) => (s.id === updated.id ? updated : s)) : previous,
      );
      setEditingSession(null);
    } catch {
      setError("Failed to update session.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(sessionId: number) {
    const ok = window.confirm(`Delete session #${sessionId}?`);
    if (!ok) return;

    setBusyId(sessionId);
    setError(null);
    try {
      await studysessionsService.deleteAdminSession(sessionId);
      setSessions((previous) => (previous ? previous.filter((s) => s.id !== sessionId) : previous));
    } catch {
      setError("Failed to delete session.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-w-0">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            Study Sessions
          </h1>
          <p className="mt-2 text-on-surface-variant">Manage all user sessions.</p>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95"
        >
          Refresh
        </button>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl bg-surface-container-low p-5 ring-1 ring-outline-variant/15">
          <div className="mb-3">
            <h2 className="font-headline text-xl font-bold text-on-surface">Status Distribution</h2>
            <p className="text-xs text-on-surface-variant">Pie chart for in-progress vs completed sessions.</p>
          </div>

          <div className="flex items-center gap-5">
            <div
              className="relative h-28 w-28 rounded-full"
              style={{ background: pieGradient }}
              aria-label="Session status pie chart"
            >
              <div className="absolute inset-[16px] rounded-full bg-surface-container-low" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4c69b8]" />
                <span className="text-on-surface">Completed: {statusStats.completed}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d38b73]" />
                <span className="text-on-surface">In progress: {statusStats.inProgress}</span>
              </div>
              <p className="pt-1 text-xs font-semibold uppercase tracking-widest text-outline">
                Total: {statusStats.total}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl bg-surface-container-low p-5 ring-1 ring-outline-variant/15">
          <div className="mb-3">
            <h2 className="font-headline text-xl font-bold text-on-surface">Weekday Trend</h2>
            <p className="text-xs text-on-surface-variant">Graph: x = day of week, y = sessions created.</p>
          </div>

          <div className="rounded-lg bg-surface-container-high/40 p-3">
            <svg viewBox="0 0 100 100" className="h-36 w-full" preserveAspectRatio="none" aria-label="Sessions per weekday line graph">
              <line x1="0" y1="100" x2="100" y2="100" stroke="rgb(186 170 159)" strokeWidth="0.8" />
              <line x1="0" y1="66" x2="100" y2="66" stroke="rgb(186 170 159)" strokeWidth="0.4" />
              <line x1="0" y1="33" x2="100" y2="33" stroke="rgb(186 170 159)" strokeWidth="0.4" />
              <polyline
                fill="none"
                stroke="#4c69b8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={weekdayStats.points}
              />
            </svg>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center">
              {weekdayStats.labels.map((label, index) => (
                <div key={label} className="text-[10px] font-semibold text-outline">
                  <div>{label}</div>
                  <div className="text-on-surface-variant">{weekdayStats.counts[index]}</div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-xl bg-surface-container-low p-5 ring-1 ring-outline-variant/15 lg:col-span-2">
          <div className="mb-3">
            <h2 className="font-headline text-xl font-bold text-on-surface">Sessions per Month</h2>
            <p className="text-xs text-on-surface-variant">Number of created sessions by month (Jan to Dec).</p>
          </div>

          <div className="mt-4 rounded-lg bg-surface-container-high/50 p-3">
            <div className="flex h-[180px] items-end justify-between gap-2 border-b border-outline-variant/20 pb-2">
              {monthlyStats.months.map((month) => {
                const stickHeightPx = Math.max(8, Math.round((month.count / monthlyStats.max) * 140));
                return (
                  <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-semibold text-on-surface-variant">{month.count}</div>
                    <div className="w-full max-w-[20px] rounded-t-md bg-[#4c69b8]" style={{ height: `${stickHeightPx}px` }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-12 gap-2 text-center">
              {monthlyStats.months.map((month) => (
                <div key={`${month.key}-label`} className="text-[10px] font-semibold uppercase tracking-wide text-outline">
                  {month.label}
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className="font-label mb-2 block text-xs uppercase tracking-widest text-outline">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by id, title, subject, or username"
            className="w-full rounded-full border-none bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface placeholder:text-outline/60 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="font-label mb-2 block text-xs uppercase tracking-widest text-outline">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "in_progress" | "completed")}
            className="rounded-full border-none bg-surface-container-highest/70 px-4 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10"
          >
            <option value="all">All</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="text-sm font-semibold text-on-surface-variant">
          {filtered ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}` : "..."}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-outline-variant/15">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container-highest/40 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Focus</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {sessions ? (
                filtered && filtered.length ? (
                  filtered.map((s) => (
                    <tr key={s.id} className="text-on-surface">
                      <td className="px-4 py-3">{s.id}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{s.username}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{s.title}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{s.subject}</td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3">{s.focusScore}</td>
                      <td className="px-4 py-3">{s.streakscore}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-xs font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(s.id)}
                            disabled={busyId === s.id}
                            className="rounded-full bg-error-container/20 px-4 py-2 text-xs font-semibold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/30 disabled:opacity-60"
                          >
                            {busyId === s.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-on-surface-variant" colSpan={9}>
                      No sessions match your filters.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td className="px-4 py-6 text-on-surface-variant" colSpan={9}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="font-headline text-xl font-bold text-on-surface">Edit Session #{editingSession.id}</h2>
            <form className="mt-4 space-y-3" onSubmit={handleSaveEdit}>
              <input
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-surface-container-high p-2"
                placeholder="Title"
              />
              <input
                required
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full rounded-lg border border-surface-container-high p-2"
                placeholder="Subject"
              />
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "in_progress" | "completed")}
                className="w-full rounded-lg border border-surface-container-high p-2"
              >
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editFocusScore}
                  onChange={(e) => setEditFocusScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-container-high p-2"
                  placeholder="Focus score"
                />
                <input
                  type="number"
                  value={editStreakScore}
                  onChange={(e) => setEditStreakScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-container-high p-2"
                  placeholder="Streak score"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="rounded-lg border border-surface-container-high px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === editingSession.id}
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {busyId === editingSession.id ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
