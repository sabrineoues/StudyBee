import axios from "axios";

import API_URL from "./api";

export type StudentProfileMe = {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  date_of_birth: string | null;
  class_level: string;
  speciality: string;
  parent_email: string;
  parent_phone: string;
  language?: string | null;
  camera_access_enabled?: boolean;
  microphone_access_enabled?: boolean;
};

export type StudentProfileMeUpdate = Partial<{
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  class_level: string;
  speciality: string;
  parent_email: string;
  parent_phone: string;
  language: string;
  camera_access_enabled: boolean;
  microphone_access_enabled: boolean;
}>;

type Listener = () => void;

let cachedAvatarUrl: string | null = null;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener failures
    }
  });
}

function setCachedProfile(profile: StudentProfileMe | null) {
  cachedAvatarUrl = profile?.avatar_url ? String(profile.avatar_url) : null;
  emitChange();
}

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

export const profileService = {
  subscribeProfile: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getCachedAvatarUrl: () => cachedAvatarUrl,

  clearCachedAvatarUrl: () => {
    cachedAvatarUrl = null;
    emitChange();
  },

  getMe: async (): Promise<StudentProfileMe> => {
    const response = await axios.get(`${baseUrl()}profile/`);
    const data = response.data as StudentProfileMe;
    setCachedProfile(data);
    return data;
  },

  updateMe: async (data: StudentProfileMeUpdate): Promise<StudentProfileMe> => {
    const response = await axios.patch(`${baseUrl()}profile/`, data);
    const updated = response.data as StudentProfileMe;
    setCachedProfile(updated);
    return updated;
  },

  uploadAvatar: async (avatar: File): Promise<StudentProfileMe> => {
    const form = new FormData();
    form.append("avatar", avatar);

    const response = await axios.patch(`${baseUrl()}profile/avatar/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const updated = response.data as StudentProfileMe;
    setCachedProfile(updated);
    return updated;
  },

  deleteMe: async (): Promise<void> => {
    await axios.delete(`${baseUrl()}profile/`);
    setCachedProfile(null);
  },
};
