import axios from "axios";

import API_URL from "./api";

const PROFILE_AVATAR_KEY = "studybee_avatar_url";
const PROFILE_CHANGED_EVENT = "studybee-profile-changed";

function notifyProfileChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}

function setCachedAvatarUrl(url: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (url) window.localStorage.setItem(PROFILE_AVATAR_KEY, url);
    else window.localStorage.removeItem(PROFILE_AVATAR_KEY);
  } catch {
    // ignore
  }
  notifyProfileChanged();
}

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
  language?: "en" | "fr";
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
  language: "en" | "fr";
}>;

export const profileService = {
  subscribeProfile: (listener: () => void) => {
    if (typeof window === "undefined") return () => {};

    const onChange = () => listener();
    window.addEventListener(PROFILE_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  },

  getCachedAvatarUrl: () => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(PROFILE_AVATAR_KEY);
    } catch {
      return null;
    }
  },

  clearCachedAvatarUrl: () => {
    setCachedAvatarUrl(null);
  },

  getMe: async (): Promise<StudentProfileMe> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.get(`${baseUrl}profile/`);
    const data = response.data as StudentProfileMe;
    setCachedAvatarUrl(data.avatar_url ?? null);
    return data;
  },

  uploadAvatar: async (file: File): Promise<StudentProfileMe> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const form = new FormData();
    form.append("avatar", file);
    const response = await axios.patch(`${baseUrl}profile/avatar/`, form);
    const data = response.data as StudentProfileMe;
    setCachedAvatarUrl(data.avatar_url ?? null);
    return data;
  },

  updateMe: async (data: StudentProfileMeUpdate): Promise<StudentProfileMe> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.patch(`${baseUrl}profile/`, data);
    const out = response.data as StudentProfileMe;
    setCachedAvatarUrl(out.avatar_url ?? null);
    return out;
  },

  deleteMe: async (): Promise<void> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    await axios.delete(`${baseUrl}profile/`);
    setCachedAvatarUrl(null);
  },
};
