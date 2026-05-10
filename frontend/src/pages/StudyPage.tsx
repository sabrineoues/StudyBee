import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { StudyBeeShell } from "../components/StudyBeeShell";
import { ChatMessage } from "./ChatMessage";
import { studysessionsService } from "../services/studysessionsService";
import type {
  AdminStudySession,
  StudySession,
  StudySessionCreate,
  StudySessionTask,
} from "../services/studysessionsService";
import { userService } from "../services/userService";
import { visionService } from "../services/visionService";
import {
  chatbotService,
  type Message as ChatMsg,
  type VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
} from "../services/chatbotService";

// ─────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────
type SessionFormState = { title: string; subject: string };
const EMPTY_FORM: SessionFormState = { title: "", subject: "" };
const TIMER_STORAGE_PREFIX = "studybee_timer_session_";
type StoredTimerState = {
  totalSeconds: number;
  timeLeftSeconds: number;
  isRunning: boolean;
  endAtMs: number | null;
};

const VOICES = [
  { value: "female_soft",   label: "Jessica — Féminine douce" },
  { value: "female_calm",   label: "Bella — Féminine calme"   },
  { value: "male_deep",     label: "Josh — Masculine grave"   },
  { value: "male_friendly", label: "Sam — Masculine amical"   },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
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
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatDrfError(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") {
    const t = data.trim();
    if (/^<!doctype\s+html/i.test(t) || /^<html\b/i.test(t)) return fallback;
    return data;
  }
  if (typeof data !== "object" || Array.isArray(data)) return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail;
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") { lines.push(`${key}: ${value}`); continue; }
    if (Array.isArray(value)) {
      const merged = value.filter((i) => typeof i === "string").join(" ");
      if (merged) lines.push(`${key}: ${merged}`);
    }
  }
  return lines.length ? lines.join("\n") : fallback;
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export function StudyPage() {
  const { t } = useTranslation();
  const isAdmin = userService.isAdmin();

  // ── Session state ─────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [sessions, setSessions]           = useState<StudySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTargetSession, setDeleteTargetSession] = useState<StudySession | null>(null);
  const [formState, setFormState]         = useState<SessionFormState>(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [openActionsForSessionId, setOpenActionsForSessionId] = useState<number | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");

  // ── Timer state ───────────────────────────────────────────────
  const [timerTotalSeconds, setTimerTotalSeconds]   = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds]       = useState(0);
  const [isTimerRunning, setIsTimerRunning]         = useState(false);
  const [timerInitializedForSessionId, setTimerInitializedForSessionId] = useState<number | null>(null);
  const autoStartOnNextSessionRef   = useRef(false);
  const statusSyncInFlightRef       = useRef<number | null>(null);
  const fatigueRequestedForSessionIdRef  = useRef<number | null>(null);
  const tiredDismissedForSessionIdRef    = useRef<number | null>(null);
  const [showTiredPopup, setShowTiredPopup] = useState(false);

  // ── Task state ────────────────────────────────────────────────
  const [tasks, setTasks]                 = useState<StudySessionTask[]>([]);
  const [newTaskTitle, setNewTaskTitle]   = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [taskSaving, setTaskSaving]       = useState(false);
  const [openMenuForTaskId, setOpenMenuForTaskId] = useState<number | null>(null);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [showTaskAddModal, setShowTaskAddModal]   = useState(false);

  // ── Chatbot state ─────────────────────────────────────────────
  const [messages, setMessages]           = useState<ChatMsg[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [pdfStatus, setPdfStatus]         = useState("");
  const [question, setQuestion]           = useState("");
  const [showVoice, setShowVoice]         = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  const variations    = useRef({ diagram: 1, workflow: 1 });
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks   = useRef<Blob[]>([]);
  const chatEndRef    = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ── Derived ───────────────────────────────────────────────────
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  // Session ID for chatbot — unique per study session
  const chatSessionId = selectedSessionId ? `study_session_${selectedSessionId}` : "session_001";

  const displayedSessions = useMemo(() => {
    const pinned = sessions.filter((s) => s.pinned);
    const normal = sessions.filter((s) => !s.pinned);
    const ordered = [...pinned, ...normal];
    if (isAdmin) return ordered;
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return ordered;
    return ordered.filter((s) =>
      s.title.toLowerCase().includes(query) || s.subject.toLowerCase().includes(query)
    );
  }, [sessions, sessionSearch, isAdmin]);

  const timerProgress    = timerTotalSeconds > 0 ? (timeLeftSeconds / timerTotalSeconds) * 100 : 0;
  const taskTotal        = tasks.length;
  const taskDone         = tasks.filter((t) => t.done).length;
  const taskPending      = tasks.filter((t) => !t.done).length;
  const taskProgress     = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
  const ringRadius       = 104;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset   = ringCircumference * (1 - timerProgress / 100);

  // ─────────────────────────────────────────────────────────────
  // Timer helpers
  // ─────────────────────────────────────────────────────────────
  function keepSelectedOrNone(prev: number | null, src: StudySession[]) {
    return prev && src.some((s) => s.id === prev) ? prev : null;
  }
  function replaceSessionInList(updated: StudySession) {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }
  function startTimer() {
    if (!selectedSession || selectedSession.status === "completed") return;
    setIsTimerRunning(true);
  }
  function pauseTimer() {
    setIsTimerRunning(false);
    fatigueRequestedForSessionIdRef.current = null;
    void visionService.stopFatigueMonitor().catch(() => {});
  }
  function resetTimer() {
    if (!selectedSession) return;
    const total = Math.max(0, selectedSession.study_duration * 60);
    setTimerTotalSeconds(total);
    setTimeLeftSeconds(total);
    setIsTimerRunning(false);
    fatigueRequestedForSessionIdRef.current = null;
    void visionService.stopFatigueMonitor().catch(() => {});
    saveTimerState(selectedSession.id, { totalSeconds: total, timeLeftSeconds: total, isRunning: false, endAtMs: null });
  }

  const getStorageKey  = useCallback((id: number) => `${TIMER_STORAGE_PREFIX}${id}`, []);
  const saveTimerState = useCallback((id: number, state: StoredTimerState) => {
    window.localStorage.setItem(getStorageKey(id), JSON.stringify(state));
  }, [getStorageKey]);
  const readTimerState = useCallback((id: number): StoredTimerState | null => {
    const raw = window.localStorage.getItem(getStorageKey(id));
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredTimerState; } catch { return null; }
  }, [getStorageKey]);

  // ─────────────────────────────────────────────────────────────
  // Chatbot helpers
  // ─────────────────────────────────────────────────────────────
  const addMessage = useCallback((msg: Omit<ChatMsg, "id">) => {
  const newMsg = { ...msg, id: `${Date.now()}-${Math.random()}` };
  setMessages(prev => [...prev, newMsg]);

  // Sauvegarder en base seulement user et assistant
  if (msg.role === "user" || msg.role === "assistant") {
    fetch("http://localhost:8000/api/chat-history/save/", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        session_id: chatSessionId,
        role:       msg.role,
        text:       msg.text,
      }),
    }).catch(() => {});
  }
}, [chatSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Reset chat when session changes
  useEffect(() => {
  setMessages([]);
  setPdfStatus("");
  variations.current = { diagram: 1, workflow: 1 };

  if (!selectedSessionId) return;

  // Charger l'historique de la session
  fetch(`http://localhost:8000/api/chat-history/${chatSessionId}/`)
    .then(r => r.json())
    .then(data => {
      setMessages(data.map((m: any) => ({
        id:   String(m.id),
        role: m.role,
        text: m.content,
      })));
    })
    .catch(() => {});
}, [selectedSessionId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfStatus("Analyse en cours...");
    try {
      const data = await chatbotService.analyzePDF(file, chatSessionId);
      const msg  = data.message || data.error || "PDF analysé";
      setPdfStatus(msg);
      addMessage({ role: "system", text: msg });
      variations.current = { diagram: 1, workflow: 1 };
    } catch { setPdfStatus("Erreur lors de l'analyse du PDF"); }
  };

  const runAction = async (type: "summary" | "diagram" | "workflow") => {
    const labels = { summary: "Génère un résumé", diagram: "Génère un diagramme visuel", workflow: "Génère un workflow visuel" };
    const version = type !== "summary" ? variations.current[type as "diagram" | "workflow"] : 1;
    addMessage({ role: "user", text: labels[type] + (type !== "summary" ? ` (v${version})` : "") });
    setIsLoading(true);
    try {
      const data = await chatbotService.generate(type, chatSessionId, version);
      addMessage({ role: "assistant", text: data.result || data.error || "" });
      if (type === "diagram" || type === "workflow") {
        variations.current[type] = (variations.current[type] % 4) + 1;
      }
    } finally { setIsLoading(false); }
  };

  const askQuestion = async (q: string) => {
    if (!q.trim() || isLoading) return;
    addMessage({ role: "user", text: q });
    setIsLoading(true);
    try {
      const data = await chatbotService.answer(q, chatSessionId);
      addMessage({ role: "assistant", text: data.result || data.error || "" });
    } finally { setIsLoading(false); }
  };

  const handleSend = () => { askQuestion(question); setQuestion(""); };
  const handleKey  = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleMic = async () => {
    if (isRecording) { mediaRecorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: mimeType || "audio/webm" });
        setIsLoading(true);
        try {
          const data = await chatbotService.transcribe(blob, chatSessionId, variations.current.diagram);
          if (data.error) { addMessage({ role: "system", text: "Erreur : " + data.error }); return; }
          const badgeLabels: Record<string, string> = { diagram: "Diagramme", workflow: "Workflow", summary: "Résumé", answer: "Question" };
          addMessage({ role: "user", text: data.transcript, intent: data.intent, badge: badgeLabels[data.intent] });
          if (data.auto_executed && data.result) {
            addMessage({ role: "assistant", text: data.result });
            if (data.intent === "diagram" || data.intent === "workflow") {
              variations.current[data.intent] = (variations.current[data.intent] % 4) + 1;
            }
          } else {
            const res = await chatbotService.answer(data.transcript, chatSessionId);
            addMessage({ role: "assistant", text: res.result || res.error || "" });
          }
        } finally { setIsLoading(false); }
      };
      recorder.start(100);
      mediaRecorder.current = recorder;
      setIsRecording(true);
      addMessage({ role: "system", text: "Enregistrement en cours... Clique à nouveau pour arrêter." });
    } catch (e: unknown) {
      addMessage({ role: "system", text: "Accès micro refusé : " + (e as Error).message });
    }
  };

  const clearChatHistory = async () => {
  await chatbotService.clearHistory(chatSessionId);
  await fetch(`http://localhost:8000/api/chat-history/clear/${chatSessionId}/`, {
    method: "DELETE",
  }).catch(() => {});
  setMessages([]);
  setPdfStatus("");
  variations.current = { diagram: 1, workflow: 1 };
};

  // ─────────────────────────────────────────────────────────────
  // Session effects
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        if (isAdmin) {
          const res = await studysessionsService.listAllAdmin();
          if (!alive) return;
          const normalized = res.map(fromAdminSession);
          setSessions(normalized);
          setSelectedSessionId((prev) => keepSelectedOrNone(prev, normalized));
        } else {
          const res = await studysessionsService.listMine();
          if (!alive) return;
          setSessions(res);
          setSelectedSessionId((prev) => keepSelectedOrNone(prev, res));
        }
      } catch (err) {
        if (!alive) return;
        setError(formatDrfError((err as any)?.response?.data, "Could not load sessions."));
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedSession) { setTasks([]); setNewTaskTitle(""); setEditingTaskId(null); setEditingTaskTitle(""); return; }
    let alive = true; setError(null);
    void (async () => {
      try {
        const t = await studysessionsService.listTasks(selectedSession.id);
        if (!alive) return; setTasks(t);
      } catch (err) {
        if (!alive) return;
        setError(formatDrfError((err as any)?.response?.data, "Could not load session tasks."));
      }
    })();
    return () => { alive = false; };
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedSession) { setTimerTotalSeconds(0); setTimeLeftSeconds(0); setIsTimerRunning(false); setTimerInitializedForSessionId(null); return; }
    const total = Math.max(0, selectedSession.study_duration * 60);
    const stored = readTimerState(selectedSession.id);
    const shouldAutoStart = autoStartOnNextSessionRef.current;
    if (stored) {
      let left = Math.max(0, stored.timeLeftSeconds);
      let running = stored.isRunning;
      if (stored.isRunning && stored.endAtMs) { left = Math.max(0, Math.ceil((stored.endAtMs - Date.now()) / 1000)); running = left > 0; }
      if (selectedSession.status === "completed") { left = 0; running = false; }
      setTimerTotalSeconds(stored.totalSeconds || total); setTimeLeftSeconds(left); setIsTimerRunning(running);
    } else {
      const initialLeft = selectedSession.status === "completed" ? 0 : total;
      const running = shouldAutoStart && initialLeft > 0;
      setTimerTotalSeconds(total); setTimeLeftSeconds(initialLeft); setIsTimerRunning(running);
      saveTimerState(selectedSession.id, { totalSeconds: total, timeLeftSeconds: initialLeft, isRunning: running, endAtMs: running ? Date.now() + initialLeft * 1000 : null });
    }
    setTimerInitializedForSessionId(selectedSession.id);
    if (shouldAutoStart) autoStartOnNextSessionRef.current = false;
  }, [selectedSessionId, selectedSession, readTimerState, saveTimerState]);

  useEffect(() => {
    if (!selectedSession || !isTimerRunning || timeLeftSeconds <= 0) return;
    const id = window.setInterval(() => {
      setTimeLeftSeconds((prev) => { const next = Math.max(0, prev - 1); if (next === 0) setIsTimerRunning(false); return next; });
    }, 1000);
    return () => window.clearInterval(id);
  }, [selectedSession, isTimerRunning, timeLeftSeconds]);

  useEffect(() => {
    if (!selectedSession) return;
    saveTimerState(selectedSession.id, { totalSeconds: timerTotalSeconds, timeLeftSeconds, isRunning: isTimerRunning, endAtMs: isTimerRunning ? Date.now() + timeLeftSeconds * 1000 : null });
  }, [selectedSession, timerTotalSeconds, timeLeftSeconds, isTimerRunning, saveTimerState]);

  useEffect(() => {
    if (!selectedSession || isAdmin || timerInitializedForSessionId !== selectedSession.id) return;
    const targetStatus = timeLeftSeconds === 0 ? "completed" : "in_progress";
    if (selectedSession.status === targetStatus || statusSyncInFlightRef.current === selectedSession.id) return;
    statusSyncInFlightRef.current = selectedSession.id;
    void (async () => {
      try {
        const updated = await studysessionsService.update(selectedSession.id, { status: targetStatus });
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        if (targetStatus === "completed") await visionService.stopFatigueMonitor().catch(() => {});
      } catch { setError("Could not sync session status with timer."); }
      finally { statusSyncInFlightRef.current = null; }
    })();
  }, [selectedSession, timeLeftSeconds, isAdmin, timerInitializedForSessionId]);

  useEffect(() => {
    if (!selectedSession || isAdmin || timerInitializedForSessionId !== selectedSession.id || !isTimerRunning || selectedSession.status === "completed") return;
    if (fatigueRequestedForSessionIdRef.current === selectedSession.id) return;
    fatigueRequestedForSessionIdRef.current = selectedSession.id;
    void (async () => {
      try { const s = await visionService.getFatigueStatus(); if (s?.running) return; } catch {}
      try { await visionService.startFatigueMonitor(); } catch {}
    })();
  }, [selectedSession, isAdmin, isTimerRunning, timerInitializedForSessionId]);

  useEffect(() => {
    if (!selectedSession || isAdmin || timerInitializedForSessionId !== selectedSession.id || !isTimerRunning) {
      setShowTiredPopup(false); tiredDismissedForSessionIdRef.current = null; return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const status = await visionService.getFatigueStatus();
        if (!alive) return;
        if (!status?.running || !status.tired) { setShowTiredPopup(false); tiredDismissedForSessionIdRef.current = null; return; }
        if (tiredDismissedForSessionIdRef.current === selectedSession.id) return;
        setShowTiredPopup(true);
      } catch {}
    };
    void tick();
    const id = window.setInterval(() => void tick(), 8000);
    return () => { alive = false; window.clearInterval(id); };
  }, [selectedSession, isAdmin, isTimerRunning, timerInitializedForSessionId]);

  // ─────────────────────────────────────────────────────────────
  // Session CRUD
  // ─────────────────────────────────────────────────────────────
  function openCreateModal() { setFormState(EMPTY_FORM); setShowCreateModal(true); }
  function openEditModal(session: StudySession | null = selectedSession) {
    if (!session) return;
    setSelectedSessionId(session.id);
    setFormState({ title: session.title, subject: session.subject });
    setShowEditModal(true);
  }
  async function togglePinSession(session: StudySession) {
    try { const u = await studysessionsService.update(session.id, { pinned: !session.pinned }); replaceSessionInList(u); }
    catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not update pin status.")); }
  }
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null);
    const payload: StudySessionCreate = { ...formState, status: "in_progress", study_duration: 25, break_duration: 5, focusScore: 0, streakscore: 0 };
    try {
      const created = await studysessionsService.create(payload);
      setSessions((prev) => [created, ...prev]);
      autoStartOnNextSessionRef.current = true;
      setSelectedSessionId(created.id);
      setShowCreateModal(false);
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not create session.")); }
    finally { setSaving(false); }
  }
  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedSession) return; setSaving(true); setError(null);
    try {
      const updated = await studysessionsService.update(selectedSession.id, { title: formState.title, subject: formState.subject });
      replaceSessionInList(updated); setShowEditModal(false);
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not update session.")); }
    finally { setSaving(false); }
  }
  async function handleDelete(sessionId: number) {
    setError(null);
    try {
      await studysessionsService.delete(sessionId);
      setSessions((prev) => { const next = prev.filter((s) => s.id !== sessionId); setSelectedSessionId((cur) => (cur === sessionId ? next[0]?.id ?? null : cur)); return next; });
      setDeleteTargetSession(null);
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not delete session.")); }
  }

  // ─────────────────────────────────────────────────────────────
  // Task CRUD
  // ─────────────────────────────────────────────────────────────
  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedSession || !newTaskTitle.trim()) return;
    setTaskSaving(true); setError(null);
    try {
      const created = await studysessionsService.createTask(selectedSession.id, { title: newTaskTitle.trim() });
      setTasks((prev) => [created, ...prev]); setNewTaskTitle(""); setShowTaskAddModal(false);
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not add task.")); }
    finally { setTaskSaving(false); }
  }
  async function handleEditTask(taskId: number) {
    const task = tasks.find((t) => t.id === taskId); if (!task) return;
    setEditingTaskId(taskId); setEditingTaskTitle(task.title);
  }
  async function handleSaveTask() {
    if (!selectedSession || editingTaskId === null || !editingTaskTitle.trim()) return;
    setTaskSaving(true); setError(null);
    try {
      const updated = await studysessionsService.updateTask(selectedSession.id, editingTaskId, { title: editingTaskTitle.trim() });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t))); setEditingTaskId(null); setEditingTaskTitle("");
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not save task.")); }
    finally { setTaskSaving(false); }
  }
  async function handleToggleTaskDone(taskId: number) {
    if (!selectedSession) return;
    const task = tasks.find((t) => t.id === taskId); if (!task) return;
    try {
      const updated = await studysessionsService.updateTask(selectedSession.id, taskId, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not update task.")); }
  }
  async function handleDeleteTask(taskId: number) {
    if (!selectedSession) return; setError(null);
    try {
      await studysessionsService.deleteTask(selectedSession.id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (editingTaskId === taskId) { setEditingTaskId(null); setEditingTaskTitle(""); }
    } catch (err) { setError(formatDrfError((err as any)?.response?.data, "Could not delete task.")); }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <StudyBeeShell>
      {/* Tired popup */}
      {showTiredPopup && selectedSession && (
        <div className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4">
          <div role="alert" className="flex w-full max-w-xl items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-800">{t("study.tiredPopup.text")}</p>
            <button type="button"
              onClick={() => { tiredDismissedForSessionIdRef.current = selectedSession.id; setShowTiredPopup(false); }}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100">
              {t("study.tiredPopup.close")}
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 pb-10 pt-24 md:px-8">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className={`rounded-xl border border-surface-container-high bg-surface-container-low shadow-sm transition-all ${sidebarOpen ? "w-full p-4 md:w-[320px]" : "w-[64px] p-2"}`}>
          <button type="button" onClick={() => setSidebarOpen((c) => !c)}
            className="mb-3 flex w-full items-center justify-center rounded-lg bg-surface-container-high p-2 text-on-surface">
            <span className="material-symbols-outlined">{sidebarOpen ? "left_panel_close" : "left_panel_open"}</span>
          </button>

          {sidebarOpen && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold">{t("study.sessions.title")}</h2>
                {!isAdmin && (
                  <button type="button" onClick={openCreateModal}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    {t("study.sessions.newSession")}
                  </button>
                )}
              </div>

              {!isAdmin && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface px-3 py-2">
                  <span className="material-symbols-outlined text-base text-outline">search</span>
                  <input type="text" value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder={t("study.sessions.searchPlaceholder")}
                    className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" />
                  {sessionSearch && (
                    <button type="button" onClick={() => setSessionSearch("")}
                      className="rounded-full p-1 text-outline transition hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
              )}

              {loading && <p className="text-sm text-outline">{t("study.sessions.loading")}</p>}
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-outline">{isAdmin ? t("study.sessions.emptyAdmin") : t("study.sessions.empty")}</p>
              )}

              <div className="space-y-2">
                {displayedSessions.map((session, index) => {
                  const prev = displayedSessions[index - 1];
                  const showSep = index > 0 && prev?.pinned && !session.pinned;
                  return (
                    <div key={session.id}>
                      {showSep && (
                        <div className="my-2 flex items-center gap-2 px-1">
                          <span className="h-px flex-1 bg-outline-variant/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{t("study.sessions.otherSessions")}</span>
                          <span className="h-px flex-1 bg-outline-variant/40" />
                        </div>
                      )}
                      <div role="button" tabIndex={0}
                        onClick={() => { setOpenActionsForSessionId(null); setSelectedSessionId(session.id); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSessionId(session.id); } }}
                        className={`w-full rounded-lg border p-3 text-left transition ${selectedSessionId === session.id ? "border-primary bg-primary/10" : "border-surface-container-high bg-surface"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-on-surface"
                              onDoubleClick={(e) => { e.stopPropagation(); if (!isAdmin) openEditModal(session); }}>
                              {session.title}
                            </p>
                            <p className="text-xs text-outline">{session.subject}</p>
                          </div>
                          <div className="relative flex items-center gap-2">
                            {session.pinned && <span className="material-symbols-outlined text-sm text-primary">keep</span>}
                            <span className="text-xs text-outline">{t(`study.sessions.status.${session.status}`, { defaultValue: session.status })}</span>
                            {!isAdmin && (
                              <>
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); setOpenActionsForSessionId((p) => p === session.id ? null : session.id); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition hover:bg-surface-container-highest">
                                  <span className="material-symbols-outlined text-base">more_horiz</span>
                                </button>
                                {openActionsForSessionId === session.id && (
                                  <div className="absolute right-0 top-9 z-20 min-w-[140px] overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-low shadow-lg"
                                    onClick={(e) => e.stopPropagation()}>
                                    <button type="button"
                                      onClick={() => { void togglePinSession(session); setOpenActionsForSessionId(null); }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-on-surface transition hover:bg-surface-container-high">
                                      <span className="material-symbols-outlined text-base">keep</span>
                                      {session.pinned ? t("study.sessions.unpin") : t("study.sessions.pin")}
                                    </button>
                                    <button type="button"
                                      onClick={() => { setOpenActionsForSessionId(null); setDeleteTargetSession(session); }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50">
                                      <span className="material-symbols-outlined text-base">delete</span>
                                      {t("study.sessions.delete")}
                                    </button>
                                  </div>
                                )}
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

        {/* ── Main Content ─────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {!selectedSession && !loading && (
            <section className="rounded-xl bg-surface-container-low p-8 text-center">
              <h3 className="font-headline text-xl font-bold text-on-surface">{t("study.emptyState.title")}</h3>
              <p className="mt-2 text-sm text-outline">{t("study.emptyState.subtitle")}</p>
            </section>
          )}

          {selectedSession && (
            <section className="grid gap-6 lg:grid-cols-[minmax(260px,0.72fr)_minmax(620px,1.95fr)]">

              {/* ── Left column: Timer + Tasks ─────────────────── */}
              <div className="space-y-6 lg:max-w-[360px]">

                {/* Timer */}
                <article className="rounded-2xl bg-surface-container-low p-6 text-center shadow-sm ring-1 ring-outline-variant/10">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant/80">
                    {t("study.deepFocusMode")}
                  </p>
                  <div className="relative mx-auto mb-4 h-56 w-56">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240">
                      <circle cx="120" cy="120" r={ringRadius} fill="transparent" stroke="currentColor" strokeWidth="10" className="text-outline-variant/40" />
                      <circle cx="120" cy="120" r={ringRadius} fill="transparent" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={ringCircumference} strokeDashoffset={ringDashOffset} className="text-primary transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">{formatTimer(timeLeftSeconds)}</p>
                      <p className="mt-1 text-[11px] font-medium text-on-surface-variant/80">{t("study.minutesRemaining")}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{t("study.breakLabel", { minutes: selectedSession.break_duration })}</p>
                  {!isAdmin && selectedSession.status !== "completed" && (
                    <div className="mt-5 flex items-center justify-center gap-3">
                      {!isTimerRunning ? (
                        <button type="button" onClick={startTimer}
                          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99]">
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          {t("study.startSession")}
                        </button>
                      ) : (
                        <button type="button" onClick={pauseTimer}
                          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99]">
                          <span className="material-symbols-outlined text-[18px]">pause</span>
                          {t("study.pauseSession")}
                        </button>
                      )}
                      <button type="button" onClick={resetTimer}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant shadow-sm ring-1 ring-outline-variant/10 transition hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                      </button>
                    </div>
                  )}
                </article>

                {/* Task progress */}
                {taskTotal > 0 && (
                  <article className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-on-surface">{t("study.todo.taskProgress")}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{taskProgress}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${taskProgress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-outline">{t("study.todo.taskProgressLabel", { done: taskDone, total: taskTotal })}</p>
                  </article>
                )}

                {/* Tasks */}
                <article className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface">{t("study.todo.title")}</h3>
                      <p className="mt-1 text-sm text-outline">{t("study.todo.helpText")}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowTaskAddModal(true)}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-outline/40 bg-surface px-4 py-4 text-sm font-semibold text-on-surface transition hover:border-primary/60 hover:bg-primary/5">
                    <span className="material-symbols-outlined text-base text-primary">add</span>
                    {t("study.todo.addTask")}
                  </button>
                  {tasks.length > 0 && (
                    <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm">
                      <p className="text-sm font-semibold text-on-surface">{t("study.todo.pendingLabel")}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{taskPending} {t("study.todo.pending")}</span>
                    </div>
                  )}
                  {tasks.length === 0 ? (
                    <p className="rounded-lg border border-surface-container-high bg-surface px-3 py-4 text-sm text-on-surface-variant">{t("study.todo.empty")}</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-4 rounded-full border border-surface-container-high bg-surface px-4 py-4 shadow-sm">
                          <button type="button" onClick={() => void handleToggleTaskDone(task.id)}
                            className={`flex h-11 w-11 items-center justify-center rounded-full border p-2 transition ${task.done ? "border-primary bg-primary/10 text-primary" : "border-surface-container-high text-on-surface hover:border-primary"}`}>
                            <span className="material-symbols-outlined text-base">{task.done ? "check" : "radio_button_unchecked"}</span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${task.done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{task.title}</p>
                          </div>
                          <div className="relative flex items-center">
                            <button type="button" onClick={() => setOpenMenuForTaskId(openMenuForTaskId === task.id ? null : task.id)}
                              className="rounded-full p-2 text-on-surface transition hover:bg-surface-container-high">
                              <span className="material-symbols-outlined text-base">more_vert</span>
                            </button>
                            {openMenuForTaskId === task.id && (
                              <div className="absolute right-0 top-full z-10 mt-2 w-32 rounded-lg border border-surface-container-high bg-surface shadow-lg">
                                <button type="button"
                                  onClick={() => { handleEditTask(task.id); setOpenMenuForTaskId(null); setShowTaskEditModal(true); }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface transition hover:bg-surface-container-high first:rounded-t-lg">
                                  <span className="material-symbols-outlined text-base">edit</span>Edit
                                </button>
                                <button type="button"
                                  onClick={() => { void handleDeleteTask(task.id); setOpenMenuForTaskId(null); }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 last:rounded-b-lg">
                                  <span className="material-symbols-outlined text-base">delete</span>Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>

              {/* ── Right column: Chatbot ─────────────────────── */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-container-high/50 bg-surface-container-low shadow-lg">

                {/* Chatbot header */}
                <header className="flex items-center justify-between border-b border-surface-container-highest/30 bg-surface-container-high/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-on-surface">StudyBee Explainer</h2>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        {selectedSession.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                    <button type="button" title="Upload PDF" onClick={() => fileInputRef.current?.click()}
                      className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                      <span className="material-symbols-outlined">attach_file</span>
                    </button>
                    <button type="button" title="Paramètres voix" onClick={() => setShowVoice((v) => !v)}
                      className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                      <span className="material-symbols-outlined">record_voice_over</span>
                    </button>
                    <button type="button" title="Effacer" onClick={clearChatHistory}
                      className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest">
                      <span className="material-symbols-outlined">delete_sweep</span>
                    </button>
                  </div>
                </header>

                {/* PDF status */}
                {pdfStatus && (
                  <div className="border-b border-surface-container-highest/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">{pdfStatus}</div>
                )}

                {/* Voice settings panel */}
                {showVoice && (
                  <div className="space-y-3 border-b border-surface-container-highest/20 bg-surface-container-high/30 p-4">
                    <select value={voiceSettings.voice}
                      onChange={(e) => setVoiceSettings((s) => ({ ...s, voice: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {VOICES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      {(["stability", "similarity_boost", "style", "speed"] as const).map((key) => (
                        <div key={key}>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">
                            {key.replace("_", " ")} : {voiceSettings[key].toFixed(1)}
                          </label>
                          <input type="range" min={key === "speed" ? 0.5 : 0} max={key === "speed" ? 2 : 1} step={0.1}
                            value={voiceSettings[key]}
                            onChange={(e) => setVoiceSettings((s) => ({ ...s, [key]: +e.target.value }))}
                            className="w-full accent-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="hide-scrollbar flex-1 space-y-6 overflow-y-auto p-6" style={{ maxHeight: "60vh" }}>
                  {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="space-y-2 text-center">
                        <span className="material-symbols-outlined text-4xl text-outline/30">chat</span>
                        <p className="text-sm text-outline">
                          Upload un PDF ou pose une question sur <strong>{selectedSession.subject}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} voiceSettings={voiceSettings} />
                  ))}
                  {isLoading && (
                    <div className="flex max-w-[85%] gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                        <span className="material-symbols-outlined text-sm text-on-secondary-container">smart_toy</span>
                      </div>
                      <div className="rounded-tr-xl rounded-b-xl bg-white p-4 shadow-sm">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary/40"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input footer */}
                <footer className="border-t border-surface-container-high/50 bg-surface-container-lowest p-4">
                  <div className="relative">
                    <textarea rows={2} value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={`Ask StudyBee about ${selectedSession.subject}...`}
                      disabled={isLoading}
                      className="w-full resize-none rounded-xl border-none bg-surface-container-high p-4 pr-24 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button type="button" onClick={toggleMic} disabled={isLoading}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${isRecording ? "animate-pulse bg-red-500 text-white" : "bg-surface-container-highest text-outline hover:text-primary"}`}>
                        <span className="material-symbols-outlined text-[18px]">{isRecording ? "stop" : "mic"}</span>
                      </button>
                      <button type="button" onClick={handleSend} disabled={isLoading || !question.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-white shadow transition-all hover:scale-110 active:scale-95 disabled:opacity-40">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { label: "Résumé",    icon: "summarize",    type: "summary"  as const },
                      { label: "Diagramme", icon: "account_tree", type: "diagram"  as const },
                      { label: "Workflow",  icon: "mediation",    type: "workflow" as const },
                    ].map(({ label, icon, type }) => (
                      <button key={type} type="button" onClick={() => runAction(type)} disabled={isLoading}
                        className="flex items-center gap-1.5 rounded-full bg-secondary-container/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-secondary-container transition-all hover:bg-secondary-container disabled:opacity-40">
                        <span className="material-symbols-outlined text-[14px]">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </footer>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Modals ───────────────────────────────────────────────── */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {showCreateModal ? t("study.modals.newSessionTitle") : t("study.modals.editSessionTitle")}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <input required value={formState.title} onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                placeholder={t("study.modals.titlePlaceholder")}
                className="w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15" />
              <input required value={formState.subject} onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
                placeholder={t("study.modals.subjectPlaceholder")}
                className="w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15" />
              <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">{t("study.modals.timerFixed")}</p>
              {showEditModal && <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">{t("study.modals.statusAutomatic")}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" disabled={saving} onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low disabled:opacity-60">
                  {t("admin.common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:shadow-md disabled:opacity-50">
                  {saving ? t("admin.common.saving") : showCreateModal ? t("study.modals.create") : t("study.modals.update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">{t("study.todo.addTask")}</h2>
            <form onSubmit={handleCreateTask}>
              <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t("study.todo.addTaskPlaceholder")} autoFocus
                className="mt-4 w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15" />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowTaskAddModal(false); setNewTaskTitle(""); }}
                  className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                  {t("study.todo.cancel")}
                </button>
                <button type="submit" disabled={taskSaving || !newTaskTitle.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-50">
                  {taskSaving ? t("admin.common.saving") : t("study.todo.addTask")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskEditModal && editingTaskId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">{t("study.todo.editTask", { title: "" })}</h2>
            <input value={editingTaskTitle} onChange={(e) => setEditingTaskTitle(e.target.value)}
              placeholder={t("study.todo.addTaskPlaceholder")}
              className="mt-4 w-full rounded-lg border border-surface-container-high bg-surface px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus-visible:ring-4 focus-visible:ring-primary/15" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowTaskEditModal(false); setEditingTaskId(null); setEditingTaskTitle(""); }}
                className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                {t("study.todo.cancel")}
              </button>
              <button type="button" onClick={async () => { await handleSaveTask(); setShowTaskEditModal(false); }}
                disabled={!editingTaskTitle.trim() || taskSaving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-50">
                {taskSaving ? t("admin.common.saving") : t("study.todo.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant/10">
            <h2 className="font-headline text-xl font-bold text-on-surface">{t("study.delete.title")}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">{t("study.delete.confirm", { title: deleteTargetSession.title })}</p>
            <p className="mt-1 text-xs text-outline">{t("study.delete.warning")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTargetSession(null)}
                className="rounded-lg border border-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {t("admin.common.cancel")}
              </button>
              <button type="button" onClick={() => void handleDelete(deleteTargetSession.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                {t("study.delete.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudyBeeShell>
  );
}