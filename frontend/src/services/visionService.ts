import axios from "axios";
import API_URL from "./api";

export type FatigueStatus = {
  running: boolean;
  blinks_per_minute: number;
  tired: boolean;
  camera_index: number;
  face_detected: boolean;
  window_started_at?: number;
  updated_at: number;
  error?: string;
};

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

export const visionService = {
  startFatigueMonitor: async (opts?: { camera?: number }): Promise<FatigueStatus> => {
    const camera = opts?.camera ?? 0;
    const response = await axios.get(`${baseUrl()}vision/fatigue/start/`, {
      params: { camera },
    });
    return response.data as FatigueStatus;
  },

  getFatigueStatus: async (): Promise<FatigueStatus> => {
    const response = await axios.get(`${baseUrl()}vision/fatigue/status/`);
    return response.data as FatigueStatus;
  },

  stopFatigueMonitor: async (): Promise<{ stopped: boolean }> => {
    const response = await axios.get(`${baseUrl()}vision/fatigue/stop/`);
    return response.data as { stopped: boolean };
  },
};
