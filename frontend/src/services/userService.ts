import axios from "axios";

import API_URL from "./api";

const ACCESS_TOKEN_KEY = "studybee_access_token";
const REFRESH_TOKEN_KEY = "studybee_refresh_token";
const USER_KEY = "studybee_user";
const AUTH_CHANGED_EVENT = "studybee-auth-changed";

let cachedUserRaw: string | null = null;
let cachedUser: SignInResponse["user"] | null = null;

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function setAxiosAuthToken(token: string | null) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

// Always attach the latest token (covers refresh/HMR/stale defaults)
if (!(axios.defaults as unknown as { __studybeeAuthInterceptor?: boolean }).__studybeeAuthInterceptor) {
  (axios.defaults as unknown as { __studybeeAuthInterceptor?: boolean }).__studybeeAuthInterceptor = true;
  axios.interceptors.request.use((config) => {
    if (typeof window === "undefined") return config;
    const token = safeGetItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

// Restore token on app load (best-effort)
if (typeof window !== "undefined") {
  const token = safeGetItem(ACCESS_TOKEN_KEY);
  if (token) setAxiosAuthToken(token);
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;

  study_level?: "secondary" | "university";

  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  class_level: string;
  speciality: string;
  parent_email: string;
  parent_phone: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignInResponse {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_staff?: boolean;
    is_superuser?: boolean;
  };
}

export interface PasswordResetRequestResponse {
  detail?: string;
  debug_reset_url?: string;
}

export interface PasswordResetConfirmData {
  uidb64: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export const userService = {
  subscribeAuth: (listener: () => void) => {
    if (typeof window === "undefined") return () => {};

    const onAuthChanged = () => listener();

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("storage", onAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  },

  getAccessToken: () => {
    return safeGetItem(ACCESS_TOKEN_KEY);
  },

  isSignedIn: () => {
    return Boolean(safeGetItem(ACCESS_TOKEN_KEY));
  },

  getUser: () => {
    if (typeof window === "undefined") return null;
    const raw = safeGetItem(USER_KEY);
    if (raw === cachedUserRaw) return cachedUser;

    cachedUserRaw = raw;
    if (!raw) {
      cachedUser = null;
      return null;
    }

    try {
      cachedUser = JSON.parse(raw) as SignInResponse["user"];
      return cachedUser;
    } catch {
      cachedUser = null;
      return null;
    }
  },

  isAdmin: () => {
    const user = userService.getUser();
    return Boolean(user?.is_staff || user?.is_superuser);
  },

  hydrateUser: async (opts?: { force?: boolean }) => {
    if (typeof window === "undefined") return null;
    if (!userService.isSignedIn()) return null;

    const existing = userService.getUser();
    if (!opts?.force && existing && (typeof existing.is_staff === "boolean" || typeof existing.is_superuser === "boolean")) {
      return existing;
    }

    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    let response;
    try {
      response = await axios.get(`${baseUrl}me/`);
    } catch (err) {
      const maybeAny = err as { response?: { status?: number } };
      const status = maybeAny?.response?.status;
      if (status === 401) {
        userService.signOut();
      }
      throw err;
    }

    const me = response.data as SignInResponse["user"];

    safeSetItem(USER_KEY, JSON.stringify(me));
    notifyAuthChanged();

    return me;
  },

  signUp: async (data: SignUpData) => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.post(`${baseUrl}sign-up/`, data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<PasswordResetRequestResponse> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.post(`${baseUrl}password-reset/`, { email });
    return response.data as PasswordResetRequestResponse;
  },

  confirmPasswordReset: async (data: PasswordResetConfirmData): Promise<{ detail?: string }> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.post(`${baseUrl}password-reset/confirm/`, data);
    return response.data as { detail?: string };
  },

  signIn: async (data: SignInData): Promise<SignInResponse> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.post(`${baseUrl}sign-in/`, data);
    const payload = response.data as SignInResponse;

    if (typeof window !== "undefined") {
      safeSetItem(ACCESS_TOKEN_KEY, payload.access);
      safeSetItem(REFRESH_TOKEN_KEY, payload.refresh);
      if (payload.user) {
        safeSetItem(USER_KEY, JSON.stringify(payload.user));
      } else {
        safeRemoveItem(USER_KEY);
      }
    }
    setAxiosAuthToken(payload.access);
    notifyAuthChanged();

    return payload;
  },

  signOut: () => {
    if (typeof window !== "undefined") {
      safeRemoveItem(ACCESS_TOKEN_KEY);
      safeRemoveItem(REFRESH_TOKEN_KEY);
      safeRemoveItem(USER_KEY);
    }
    setAxiosAuthToken(null);
    notifyAuthChanged();
  },
};
