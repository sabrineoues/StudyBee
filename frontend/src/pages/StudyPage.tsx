import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { StudyBeeShell } from "../components/StudyBeeShell";
import { studysessionsService } from "../services/studysessionsService";
import type {
  AdminStudySession,
  StudySession,
  StudySessionCreate,
} from "../services/studysessionsService";
import { userService } from "../services/userService";
import { visionService } from "../services/visionService";

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
  if (typeof data === "string") {
    const trimmed = data.trim();
    // If the backend returned an HTML error page (e.g. Django debug 500), don't dump it into the UI.
    if (/^<!doctype\s+html/i.test(trimmed) || /^<html\b/i.test(trimmed)) return fallback;
    return data;
  }
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
  const { t } = useTranslation();

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
  const [timerInitializedForSessionId, setTimerInitializedForSessionId] = useState<number | null>(null);
  const autoStartOnNextSessionRef = useRef(false);
  const statusSyncInFlightRef = useRef<number | null>(null);
  const fatigueRequestedForSessionIdRef = useRef<number | null>(null);
  const tiredDismissedForSessionIdRef = useRef<number | null>(null);

  const [showTiredPopup, setShowTiredPopup] = useState(false);

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

    // Best-effort: stop eye-blink fatigue monitoring when pausing.
    fatigueRequestedForSessionIdRef.current = null;
    void visionService.stopFatigueMonitor().catch(() => {
      // ignore
    });
  }

  function resetTimer() {
    if (!selectedSession) return;

    const total = Math.max(0, selectedSession.study_duration * 60);
    setTimerTotalSeconds(total);
    setTimeLeftSeconds(total);
    setIsTimerRunning(false);

    // Best-effort: stop eye-blink fatigue monitoring when resetting.
    fatigueRequestedForSessionIdRef.current = null;
    void visionService.stopFatigueMonitor().catch(() => {
      // ignore
    });
    saveTimerState(selectedSession.id, {
      totalSeconds: total,
      timeLeftSeconds: total,
      isRunning: false,
      endAtMs: null,
    });
  }

  const getStorageKey = useCallback((sessionId: number) => {
    return `${TIMER_STORAGE_PREFIX}${sessionId}`;
  }, []);

  const saveTimerState = useCallback(
    (sessionId: number, state: StoredTimerState) => {
      window.localStorage.setItem(getStorageKey(sessionId), JSON.stringify(state));
    },
    [getStorageKey],
  );

  const readTimerState = useCallback(
    (sessionId: number): StoredTimerState | null => {
      const raw = window.localStorage.getItem(getStorageKey(sessionId));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StoredTimerState;
      } catch {
        return null;
      }
    },
    [getStorageKey],
  );

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
      setTimerInitializedForSessionId(null);
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

    // Mark timer as initialized for this session. This prevents the status-sync effect
    // from using stale timeLeftSeconds=0 during the first render after selection.
    setTimerInitializedForSessionId(selectedSession.id);

    if (shouldAutoStart) autoStartOnNextSessionRef.current = false;
  }, [selectedSessionId, selectedSession, readTimerState, saveTimerState]);

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
  }, [selectedSession, timerTotalSeconds, timeLeftSeconds, isTimerRunning, saveTimerState]);

  useEffect(() => {
    if (!selectedSession || isAdmin) return;
    if (timerInitializedForSessionId !== selectedSession.id) return;

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

        if (targetStatus === "completed") {
          try {
            await visionService.stopFatigueMonitor();
          } catch {
            // ignore
          }
        }
      } catch {
        setError("Could not sync session status with timer.");
      } finally {
        statusSyncInFlightRef.current = null;
      }
    })();
  }, [selectedSession, timeLeftSeconds, isAdmin, timerInitializedForSessionId]);

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

  useEffect(() => {
    if (!selectedSession || isAdmin) return;
    if (timerInitializedForSessionId !== selectedSession.id) return;
    if (!isTimerRunning) return;
    if (selectedSession.status === "completed") return;

    if (fatigueRequestedForSessionIdRef.current === selectedSession.id) return;
    fatigueRequestedForSessionIdRef.current = selectedSession.id;

    // Best-effort: start eye-blink fatigue monitoring when the session actually starts (timer running).
    // Keep it non-blocking and ignore failures (e.g. camera permissions, endpoint disabled).
    void (async () => {
      try {
        const status = await visionService.getFatigueStatus();
        if (status?.running) return;
      } catch {
        // If status fails, still try to start.
      }

      try {
        await visionService.startFatigueMonitor();
      } catch {
        // ignore
      }
    })();
  }, [selectedSession, isAdmin, isTimerRunning, timerInitializedForSessionId]);

  useEffect(() => {
    if (!selectedSession || isAdmin) {
      setShowTiredPopup(false);
      tiredDismissedForSessionIdRef.current = null;
      return;
    }
    if (timerInitializedForSessionId !== selectedSession.id) {
      setShowTiredPopup(false);
      tiredDismissedForSessionIdRef.current = null;
      return;
    }
    if (!isTimerRunning) {
      setShowTiredPopup(false);
      tiredDismissedForSessionIdRef.current = null;
      return;
    }

    let alive = true;

    const tick = async () => {
      try {
        const status = await visionService.getFatigueStatus();
        if (!alive) return;

        if (!status?.running || !status.tired) {
          setShowTiredPopup(false);
          if (tiredDismissedForSessionIdRef.current === selectedSession.id) {
            tiredDismissedForSessionIdRef.current = null;
          }
          return;
        }

        if (tiredDismissedForSessionIdRef.current === selectedSession.id) return;
        setShowTiredPopup(true);
      } catch {
        // ignore
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 8000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [selectedSession, isAdmin, isTimerRunning, timerInitializedForSessionId]);

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
      {showTiredPopup && selectedSession ? (
        <div className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4">
          <div
            role="alert"
            className="flex w-full max-w-xl items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-red-800">{t("study.tiredPopup.text")}</p>
            <button
              type="button"
              onClick={() => {
                tiredDismissedForSessionIdRef.current = selectedSession.id;
                setShowTiredPopup(false);
              }}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              aria-label={t("study.tiredPopup.close")}
              title={t("study.tiredPopup.close")}
            >
              {t("study.tiredPopup.close")}
            </button>
          </div>
        </div>
      ) : null}
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
                <h2 className="font-headline text-lg font-bold">{t("study.sessions.title")}</h2>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
                  >
                    {t("study.sessions.newSession")}
                  </button>
                )}
              </div>

              {!isAdmin && (
                <div className="mb-3">
                  <label htmlFor="student-session-search" className="sr-only">
                    {t("study.sessions.searchLabel")}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface px-3 py-2">
                    <span className="material-symbols-outlined text-base text-outline">search</span>
                    <input
                      id="student-session-search"
                      type="text"
                      value={sessionSearch}
                      onChange={(event) => setSessionSearch(event.target.value)}
                      placeholder={t("study.sessions.searchPlaceholder")}
                      className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                    />
                    {sessionSearch ? (
                      <button
                        type="button"
                        onClick={() => setSessionSearch("")}
                        className="rounded-full p-1 text-outline transition hover:bg-surface-container-high"
                        aria-label={t("study.sessions.clearSearch")}
                        title={t("study.sessions.clearSearch")}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {loading && <p className="text-sm text-outline">{t("study.sessions.loading")}</p>}
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-outline">
                  {isAdmin ? t("study.sessions.emptyAdmin") : t("study.sessions.empty")}
                </p>
              )}
              {!loading && sessions.length > 0 && displayedSessions.length === 0 && !isAdmin && (
                <p className="text-sm text-outline">{t("study.sessions.noMatch")}</p>
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
                            {t("study.sessions.otherSessions")}
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
                              title={!isAdmin ? t("study.sessions.doubleClickToEdit") : undefined}
                            >
                              {session.title}
                            </p>
                            <p className="text-xs text-outline">{session.subject}</p>
                          </div>
                          <div className="relative flex items-center gap-2">
                            {session.pinned ? (
                              <span
                                className="material-symbols-outlined text-sm text-primary"
                                title={t("study.sessions.pinned")}
                              >
                                keep
                              </span>
                            ) : null}
                            <span className="text-xs text-outline">
                              {t(`study.sessions.status.${session.status}`, {
                                defaultValue: session.status,
                              })}
                            </span>
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
                                  aria-label={t("study.sessions.actionsFor", { title: session.title })}
                                  title={t("study.sessions.more")}
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
                                      {session.pinned ? t("study.sessions.unpin") : t("study.sessions.pin")}
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
                                      {t("study.sessions.delete")}
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
              <h3 className="font-headline text-xl font-bold text-on-surface">
                {t("study.emptyState.title")}
              </h3>
              <p className="mt-2 text-sm text-outline">{t("study.emptyState.subtitle")}</p>
            </section>
          )}

          {selectedSession && (
            <>
              <section className="grid gap-6 lg:grid-cols-[minmax(260px,0.72fr)_minmax(620px,1.95fr)]">
                <div className="space-y-6 lg:max-w-[360px]">
                  <article className="rounded-2xl bg-surface-container-low p-6 text-center shadow-sm ring-1 ring-outline-variant/10">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant/80">
                      {t("study.deepFocusMode")}
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
                          className="text-outline-variant/40"
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
                          className="text-primary transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">
                          {formatTimer(timeLeftSeconds)}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-on-surface-variant/80">
                          {t("study.minutesRemaining")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {t("study.breakLabel", { minutes: selectedSession.break_duration })}
                    </p>

                    {!isAdmin && selectedSession.status !== "completed" && (
                      <div className="mt-5 flex items-center justify-center gap-3">
                        {!isTimerRunning ? (
                          <button
                            type="button"
                            onClick={startTimer}
                            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20 transition hover:shadow-md hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99]"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            {t("study.startSession")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={pauseTimer}
                            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20 transition hover:shadow-md hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99]"
                          >
                            <span className="material-symbols-outlined text-[18px]">pause</span>
                            {t("study.pauseSession")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant shadow-sm ring-1 ring-outline-variant/10 transition hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                          aria-label={t("study.resetTimer")}
                          title={t("study.resetTimer")}
                        >
                          <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                      </div>
                    )}
                  </article>

                  <article className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-headline text-lg font-bold text-on-surface">{t("study.progress.title")}</h3>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-outline">{t("study.progress.subtitle")}</p>
                  </article>

                  <article className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
                    <h3 className="font-headline text-lg font-bold text-on-surface">{t("study.todo.title")}</h3>
                    <p className="mt-3 rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface-variant">
                      {t("study.todo.empty")}
                    </p>
                  </article>
                </div>

                <article className="flex min-h-[400px] w-full flex-col overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-low shadow-sm">
                  <header className="border-b border-surface-container-high p-4">
                    <h3 className="font-headline text-lg font-bold text-on-surface">{t("study.chat.title")}</h3>
                    <p className="text-xs text-outline">
                      {t("study.chat.context", {
                        title: selectedSession.title,
                        subject: selectedSession.subject,
                      })}
                    </p>
                  </header>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <div className="rounded-xl border border-surface-container-high bg-surface p-3 text-sm text-on-surface shadow-sm">
                      {t("study.chat.assistantIntro", { subject: selectedSession.subject })}
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-xl bg-primary p-3 text-sm text-on-primary">
                      {t("study.chat.userExample")}
                    </div>
                  </div>
                  <footer className="border-t border-surface-container-high p-4">
                    <textarea
                      rows={2}
                      placeholder={t("study.chat.placeholder")}
                      className="w-full resize-none rounded-lg border border-surface-container-high bg-surface-container-high p-3 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15"
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
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {showCreateModal ? t("study.modals.newSessionTitle") : t("study.modals.editSessionTitle")}
            </h2>

            <form className="mt-4 space-y-3" onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <input
                required
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={t("study.modals.titlePlaceholder")}
                className="w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15"
              />
              <input
                required
                value={formState.subject}
                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder={t("study.modals.subjectPlaceholder")}
                className="w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15"
              />
              <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                {t("study.modals.timerFixed")}
              </p>

              {showEditModal && (
                <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                  {t("study.modals.statusAutomatic")}
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
                  className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low disabled:opacity-60"
                >
                  {t("admin.common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20 transition hover:shadow-md hover:shadow-primary/25 disabled:opacity-50"
                >
                  {saving
                    ? t("admin.common.saving")
                    : showCreateModal
                      ? t("study.modals.create")
                      : t("study.modals.update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetSession ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">{t("study.delete.title")}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              {t("study.delete.confirm", { title: deleteTargetSession.title })}
            </p>
            <p className="mt-1 text-xs text-outline">{t("study.delete.warning")}</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSession(null)}
                className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
              >
                {t("admin.common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(deleteTargetSession.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {t("study.delete.delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StudyBeeShell>
  );
}
