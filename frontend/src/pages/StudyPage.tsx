import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { StudyBeeShell } from "../components/StudyBeeShell";
import { studysessionsService } from "../services/studysessionsService";
import type {
  AdminStudySession,
  StudySession,
  StudySessionCreate,
} from "../services/studysessionsService";
import { userService } from "../services/userService";

type SessionFormState = {
  title: string;
  subject: string;
};

const EMPTY_FORM: SessionFormState = {
  title: "",
  subject: "",
};

const TIMER_STORAGE_PREFIX = "studybee_timer_session_";

type StoredTimerState = {
  totalSeconds: number;
  timeLeftSeconds: number;
  isRunning: boolean;
  endAtMs: number | null;
};

function fromAdminSession(session: AdminStudySession): StudySession {
  return {
    id: session.id,
    title: `${session.title} (${session.username})`,
    study_duration: session.study_duration,
    break_duration: session.break_duration,
    subject: session.subject,
    status: session.status,
    pinned: session.pinned,
    focusScore: session.focusScore,
    streakscore: session.streakscore,
    date: session.date,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDrfError(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data !== "object" || Array.isArray(data)) return fallback;

  const obj = data as Record<string, unknown>;
  const detail = obj.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      lines.push(`${key}: ${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      const merged = value.filter((item) => typeof item === "string").join(" ");
      if (merged) lines.push(`${key}: ${merged}`);
    }
  }

  return lines.length ? lines.join("\n") : fallback;
}

export function StudyPage() {
  const isAdmin = userService.isAdmin();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTargetSession, setDeleteTargetSession] = useState<StudySession | null>(null);
  const [formState, setFormState] = useState<SessionFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [openActionsForSessionId, setOpenActionsForSessionId] = useState<number | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const autoStartOnNextSessionRef = useRef(false);
  const statusSyncInFlightRef = useRef<number | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const displayedSessions = useMemo(() => {
    if (!sessions.length) return sessions;

    const pinned = sessions.filter((session) => session.pinned);
    const normal = sessions.filter((session) => !session.pinned);
    const ordered = [...pinned, ...normal];

    if (isAdmin) return ordered;

    const query = sessionSearch.trim().toLowerCase();
    if (!query) return ordered;

    return ordered.filter((session) => {
      const title = session.title.toLowerCase();
      const subject = session.subject.toLowerCase();
      return title.includes(query) || subject.includes(query);
    });
  }, [sessions, sessionSearch, isAdmin]);

  const progress = Math.min(100, Math.max(0, selectedSession?.focusScore ?? 0));
  const timerProgress = timerTotalSeconds > 0 ? (timeLeftSeconds / timerTotalSeconds) * 100 : 0;
  const ringRadius = 104;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - timerProgress / 100);

  function keepSelectedOrNone(previousSelectedId: number | null, source: StudySession[]) {
    if (previousSelectedId && source.some((session) => session.id === previousSelectedId)) {
      return previousSelectedId;
    }
    return null;
  }

  function replaceSessionInList(updatedSession: StudySession) {
    setSessions((previous) =>
      previous.map((session) => (session.id === updatedSession.id ? updatedSession : session)),
    );
  }

  function startTimer() {
    if (!selectedSession || selectedSession.status === "completed") return;
    setIsTimerRunning(true);
  }

  function pauseTimer() {
    setIsTimerRunning(false);
  }

  function resetTimer() {
    if (!selectedSession) return;

    const total = Math.max(0, selectedSession.study_duration * 60);
    setTimerTotalSeconds(total);
    setTimeLeftSeconds(total);
    setIsTimerRunning(false);
    saveTimerState(selectedSession.id, {
      totalSeconds: total,
      timeLeftSeconds: total,
      isRunning: false,
      endAtMs: null,
    });
  }

  function getStorageKey(sessionId: number) {
    return `${TIMER_STORAGE_PREFIX}${sessionId}`;
  }

  function saveTimerState(sessionId: number, state: StoredTimerState) {
    window.localStorage.setItem(getStorageKey(sessionId), JSON.stringify(state));
  }

  function readTimerState(sessionId: number): StoredTimerState | null {
    const raw = window.localStorage.getItem(getStorageKey(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredTimerState;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin) {
          const response = await studysessionsService.listAllAdmin();
          if (!alive) return;
          const normalized: StudySession[] = response.map(fromAdminSession);
          setSessions(normalized);
          setSelectedSessionId((previous) => keepSelectedOrNone(previous, normalized));
        } else {
          const response = await studysessionsService.listMine();
          if (!alive) return;
          setSessions(response);
          setSelectedSessionId((previous) => keepSelectedOrNone(previous, response));
        }
      } catch (err) {
        if (!alive) return;
        const maybeAny = err as { response?: { data?: unknown } };
        setError(formatDrfError(maybeAny?.response?.data, "Could not load sessions."));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedSession) {
      setTimerTotalSeconds(0);
      setTimeLeftSeconds(0);
      setIsTimerRunning(false);
      return;
    }

    const total = Math.max(0, selectedSession.study_duration * 60);
    const stored = readTimerState(selectedSession.id);
    const shouldAutoStart = autoStartOnNextSessionRef.current;

    if (stored) {
      let restoredLeft = Math.max(0, stored.timeLeftSeconds);
      let restoredRunning = stored.isRunning;

      if (stored.isRunning && stored.endAtMs) {
        restoredLeft = Math.max(0, Math.ceil((stored.endAtMs - Date.now()) / 1000));
        restoredRunning = restoredLeft > 0;
      }

      if (selectedSession.status === "completed") {
        restoredLeft = 0;
        restoredRunning = false;
      }

      setTimerTotalSeconds(stored.totalSeconds || total);
      setTimeLeftSeconds(restoredLeft);
      setIsTimerRunning(restoredRunning);
    } else {
      const initialLeft = selectedSession.status === "completed" ? 0 : total;
      const running = shouldAutoStart && initialLeft > 0;
      setTimerTotalSeconds(total);
      setTimeLeftSeconds(initialLeft);
      setIsTimerRunning(running);
      saveTimerState(selectedSession.id, {
        totalSeconds: total,
        timeLeftSeconds: initialLeft,
        isRunning: running,
        endAtMs: running ? Date.now() + initialLeft * 1000 : null,
      });
    }

    if (shouldAutoStart) autoStartOnNextSessionRef.current = false;
  }, [selectedSessionId, selectedSession?.study_duration]);

  useEffect(() => {
    if (!selectedSession || !isTimerRunning || timeLeftSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimeLeftSeconds((previous) => {
        const next = Math.max(0, previous - 1);
        if (next === 0) setIsTimerRunning(false);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [selectedSession, isTimerRunning, timeLeftSeconds]);

  useEffect(() => {
    if (!selectedSession) return;
    saveTimerState(selectedSession.id, {
      totalSeconds: timerTotalSeconds,
      timeLeftSeconds,
      isRunning: isTimerRunning,
      endAtMs: isTimerRunning ? Date.now() + timeLeftSeconds * 1000 : null,
    });
  }, [selectedSession, timerTotalSeconds, timeLeftSeconds, isTimerRunning]);

  useEffect(() => {
    if (!selectedSession || isAdmin) return;

    const targetStatus = timeLeftSeconds === 0 ? "completed" : "in_progress";
    if (selectedSession.status === targetStatus) return;
    if (statusSyncInFlightRef.current === selectedSession.id) return;

    statusSyncInFlightRef.current = selectedSession.id;
    void (async () => {
      try {
        const updated = await studysessionsService.update(selectedSession.id, { status: targetStatus });
        setSessions((previous) =>
          previous.map((session) => (session.id === updated.id ? updated : session)),
        );
      } catch {
        setError("Could not sync session status with timer.");
      } finally {
        statusSyncInFlightRef.current = null;
      }
    })();
  }, [selectedSession, timeLeftSeconds, isAdmin]);

  function openCreateModal() {
    setFormState(EMPTY_FORM);
    setShowCreateModal(true);
  }

  async function togglePinSession(session: StudySession) {
    try {
      const updated = await studysessionsService.update(session.id, { pinned: !session.pinned });
      replaceSessionInList(updated);
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      setError(formatDrfError(maybeAny?.response?.data, "Could not update pin status."));
    }
  }

  function openEditModal(session: StudySession | null = selectedSession) {
    if (!session) return;
    setSelectedSessionId(session.id);
    setFormState({
      title: session.title,
      subject: session.subject,
    });
    setShowEditModal(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: StudySessionCreate = {
      ...formState,
      status: "in_progress",
      study_duration: 25,
      break_duration: 5,
      focusScore: 0,
      streakscore: 0,
    };

    try {
      const created = await studysessionsService.create(payload);
      setSessions((previous) => [created, ...previous]);
      autoStartOnNextSessionRef.current = true;
      setSelectedSessionId(created.id);
      setShowCreateModal(false);
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      setError(formatDrfError(maybeAny?.response?.data, "Could not create session."));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await studysessionsService.update(selectedSession.id, {
        title: formState.title,
        subject: formState.subject,
      });

      replaceSessionInList(updated);
      setShowEditModal(false);
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      setError(
        formatDrfError(
          maybeAny?.response?.data,
          "Could not update session.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sessionId: number) {
    setError(null);
    try {
      await studysessionsService.delete(sessionId);
      setSessions((previous) => {
        const next = previous.filter((session) => session.id !== sessionId);
        setSelectedSessionId((current) => (current === sessionId ? next[0]?.id ?? null : current));
        return next;
      });
      setDeleteTargetSession(null);
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      setError(formatDrfError(maybeAny?.response?.data, "Could not delete session."));
    }
  }

  return (
    <StudyBeeShell>
      <main className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 pb-10 pt-24 md:px-8">
        <aside
          className={`rounded-xl border border-surface-container-high bg-surface-container-low shadow-sm transition-all ${
            sidebarOpen ? "w-full p-4 md:w-[320px]" : "w-[64px] p-2"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="mb-3 flex w-full items-center justify-center rounded-lg bg-surface-container-high p-2 text-on-surface"
          >
            <span className="material-symbols-outlined">
              {sidebarOpen ? "left_panel_close" : "left_panel_open"}
            </span>
          </button>

          {sidebarOpen && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold">Sessions</h2>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
                  >
                    New Session
                  </button>
                )}
              </div>

              {!isAdmin && (
                <div className="mb-3">
                  <label htmlFor="student-session-search" className="sr-only">
                    Search sessions by title or subject
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface px-3 py-2">
                    <span className="material-symbols-outlined text-base text-outline">search</span>
                    <input
                      id="student-session-search"
                      type="text"
                      value={sessionSearch}
                      onChange={(event) => setSessionSearch(event.target.value)}
                      placeholder="Search by name or subject"
                      className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                    />
                    {sessionSearch ? (
                      <button
                        type="button"
                        onClick={() => setSessionSearch("")}
                        className="rounded-full p-1 text-outline transition hover:bg-surface-container-high"
                        aria-label="Clear search"
                        title="Clear"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {loading && <p className="text-sm text-outline">Loading sessions...</p>}
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-outline">
                  {isAdmin ? "No sessions found." : "No sessions yet. Create your first session."}
                </p>
              )}
              {!loading && sessions.length > 0 && displayedSessions.length === 0 && !isAdmin && (
                <p className="text-sm text-outline">No sessions match your search.</p>
              )}

              <div className="space-y-2">
                {displayedSessions.map((session, index) => {
                  const previous = displayedSessions[index - 1];
                  const previousPinned = previous ? previous.pinned : false;
                  const showSeparator = index > 0 && previousPinned && !session.pinned;

                  return (
                    <div key={session.id}>
                      {showSeparator ? (
                        <div className="my-2 flex items-center gap-2 px-1">
                          <span className="h-px flex-1 bg-outline-variant/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
                            Other Sessions
                          </span>
                          <span className="h-px flex-1 bg-outline-variant/40" />
                        </div>
                      ) : null}

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setOpenActionsForSessionId(null);
                          setSelectedSessionId(session.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setOpenActionsForSessionId(null);
                            setSelectedSessionId(session.id);
                          }
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          selectedSessionId === session.id
                            ? "border-primary bg-primary/10"
                            : "border-surface-container-high bg-surface"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-semibold text-on-surface"
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                if (!isAdmin) openEditModal(session);
                              }}
                              title={!isAdmin ? "Double-click to edit" : undefined}
                            >
                              {session.title}
                            </p>
                            <p className="text-xs text-outline">{session.subject}</p>
                          </div>
                          <div className="relative flex items-center gap-2">
                            {session.pinned ? (
                              <span className="material-symbols-outlined text-sm text-primary" title="Pinned">
                                keep
                              </span>
                            ) : null}
                            <span className="text-xs text-outline">{session.status}</span>
                            {!isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenActionsForSessionId((previousId) =>
                                      previousId === session.id ? null : session.id,
                                    );
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition hover:bg-surface-container-highest"
                                  aria-label={`Session actions for ${session.title}`}
                                  title="More"
                                >
                                  <span className="material-symbols-outlined text-base">more_horiz</span>
                                </button>

                                {openActionsForSessionId === session.id ? (
                                  <div
                                    className="absolute right-0 top-9 z-20 min-w-[140px] overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-low shadow-lg"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void togglePinSession(session);
                                        setOpenActionsForSessionId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-on-surface transition hover:bg-surface-container-high"
                                    >
                                      <span className="material-symbols-outlined text-base">keep</span>
                                      {session.pinned ? "Unpin" : "Pin"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionsForSessionId(null);
                                        setDeleteTargetSession(session);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!selectedSession && !loading && (
            <section className="rounded-xl bg-surface-container-low p-8 text-center">
              <h3 className="font-headline text-xl font-bold text-on-surface">One focused step is enough to start</h3>
              <div className="mt-2 space-y-1 text-sm text-outline">
                <p>You are building momentum.</p>
                <p>Pick an unfinished session on the left, create a new one.</p>
                <p>Don&apos;t forget to take one minute to reflect before you begin.</p>
              </div>
              <Link
                to="/journal"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Write in Journal
              </Link>
            </section>
          )}

          {selectedSession && (
            <>
              <section className="grid gap-6 lg:grid-cols-[minmax(260px,0.72fr)_minmax(620px,1.95fr)]">
                <div className="space-y-6 lg:max-w-[360px]">
                  <article className="rounded-[28px] bg-[#f4dfd1] p-6 text-center shadow-sm ring-1 ring-black/5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8f796d]">
                      Deep Focus Mode
                    </p>
                    <div className="relative mx-auto mb-4 h-56 w-56">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240">
                        <circle
                          cx="120"
                          cy="120"
                          r={ringRadius}
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-[#e1cbbd]"
                        />
                        <circle
                          cx="120"
                          cy="120"
                          r={ringRadius}
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringDashOffset}
                          className="text-[#4c69b8] transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="font-headline text-5xl font-extrabold tracking-tight text-[#2f241e]">
                          {formatTimer(timeLeftSeconds)}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-[#8f796d]">
                          minutes remaining
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[#8f796d]">Break: {selectedSession.break_duration} minutes</p>
                    {!isAdmin && selectedSession.status !== "completed" && (
                      <div className="mt-5 flex items-center justify-center gap-3">
                        {!isTimerRunning ? (
                          <button
                            type="button"
                            onClick={startTimer}
                            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#4c69b8] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(76,105,184,0.28)] transition hover:bg-[#405ca8]"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            Start Session
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={pauseTimer}
                            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#4c69b8] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(76,105,184,0.28)] transition hover:bg-[#405ca8]"
                          >
                            <span className="material-symbols-outlined text-[18px]">pause</span>
                            Pause Session
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e8d3c6] text-[#6f5b50] shadow-[0_8px_18px_rgba(111,91,80,0.12)] transition hover:bg-[#dec5b4]"
                          aria-label="Reset session timer"
                        >
                          <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                      </div>
                    )}
                  </article>

                  <article className="rounded-xl bg-surface-container-low p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-headline text-lg font-bold text-on-surface">Progress</h3>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-primary/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-outline">Focus score based progress for this session.</p>
                  </article>

                  <article className="rounded-xl bg-surface-container-low p-6 shadow-sm">
                    <h3 className="font-headline text-lg font-bold text-on-surface">To Do List</h3>
                    <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-on-surface-variant">
                      No tasks yet for this session.
                    </p>
                  </article>
                </div>

                <article className="flex min-h-[400px] w-full flex-col overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-low shadow-sm">
                  <header className="border-b border-surface-container-high p-4">
                    <h3 className="font-headline text-lg font-bold text-on-surface">StudyBee Chatbot</h3>
                    <p className="text-xs text-outline">
                      Context: {selectedSession.title} ({selectedSession.subject})
                    </p>
                  </header>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <div className="rounded-xl bg-white p-3 text-sm text-on-surface shadow-sm">
                      I can help explain {selectedSession.subject}. Ask me about this session topic.
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-xl bg-primary p-3 text-sm text-white">
                      Give me a quick summary strategy for this study block.
                    </div>
                  </div>
                  <footer className="border-t border-surface-container-high p-4">
                    <textarea
                      rows={2}
                      placeholder="Ask StudyBee anything about this session..."
                      className="w-full resize-none rounded-lg bg-surface-container-high p-3"
                    />
                  </footer>
                </article>
              </section>
            </>
          )}
        </div>
      </main>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {showCreateModal ? "New Session" : "Edit Session"}
            </h2>

            <form className="mt-4 space-y-3" onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <input
                required
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border border-surface-container-high p-2"
              />
              <input
                required
                value={formState.subject}
                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Subject"
                className="w-full rounded-lg border border-surface-container-high p-2"
              />
              <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                Timer is fixed for students: 25 min focus / 5 min break.
              </p>

              {showEditModal && (
                <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                  Status is automatic and changes to completed when timer reaches 00:00.
                </p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="rounded-lg border border-surface-container-high px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : showCreateModal ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetSession ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">Delete Session</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{deleteTargetSession.title}</span>?
            </p>
            <p className="mt-1 text-xs text-outline">This action cannot be undone.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSession(null)}
                className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(deleteTargetSession.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StudyBeeShell>
  );
}
