/* ── Cognitive Training — API Service Layer ─────────────────────────────── */

import axios from "axios";
import API_URL from "./api";
import type {
  CognitiveTask,
  CognitiveProfile,
  CognitiveSessionSummary,
  HistoryResponse,
  LeaderboardEntry,
  SessionStartResponse,
  SessionCompleteRequest,
  SessionCompleteResponse,
} from "./cognitiveTypes";

function base() {
  const u = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return `${u}cognitive/`;
}

export const cognitiveService = {
  /* ── Tasks ──────────────────────────────────────────────────────────── */

  listTasks: async (): Promise<CognitiveTask[]> => {
    const r = await axios.get(`${base()}tasks/`);
    return r.data as CognitiveTask[];
  },

  getTask: async (slug: string): Promise<CognitiveTask> => {
    const r = await axios.get(`${base()}tasks/${slug}/`);
    return r.data as CognitiveTask;
  },

  /* ── Sessions ───────────────────────────────────────────────────────── */

  startSession: async (taskSlug: string): Promise<SessionStartResponse> => {
    const r = await axios.post(`${base()}sessions/start/`, { task: taskSlug });
    return r.data as SessionStartResponse;
  },

  completeSession: async (
    sessionId: number,
    data: SessionCompleteRequest
  ): Promise<SessionCompleteResponse> => {
    const r = await axios.post(`${base()}sessions/${sessionId}/complete/`, data);
    return r.data as SessionCompleteResponse;
  },

  listSessions: async (
    taskSlug?: string,
    limit = 50
  ): Promise<CognitiveSessionSummary[]> => {
    const params: Record<string, string | number> = { limit };
    if (taskSlug) params.task = taskSlug;
    const r = await axios.get(`${base()}sessions/`, { params });
    return r.data as CognitiveSessionSummary[];
  },

  /* ── Profile ────────────────────────────────────────────────────────── */

  getProfile: async (): Promise<CognitiveProfile> => {
    const r = await axios.get(`${base()}profile/`);
    return r.data as CognitiveProfile;
  },

  getHistory: async (
    taskSlug: string,
    days = 30
  ): Promise<HistoryResponse> => {
    const r = await axios.get(`${base()}profile/history/`, {
      params: { task: taskSlug, days },
    });
    return r.data as HistoryResponse;
  },

  getLeaderboard: async (
    taskSlug: string,
    limit = 20
  ): Promise<LeaderboardEntry[]> => {
    const r = await axios.get(`${base()}profile/leaderboard/`, {
      params: { task: taskSlug, limit },
    });
    return r.data as LeaderboardEntry[];
  },
};
