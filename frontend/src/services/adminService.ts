import axios from "axios";
import API_URL from "./api";

export type AdminStats = {
  users_total: number;
  users_staff: number;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  class_level: string | null;
  speciality: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
};

export type AdminUserCreate = {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  date_of_birth: string; // YYYY-MM-DD
  class_level: string;
  speciality?: string;
  parent_email: string;
  parent_phone: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
};

export type AdminUserUpdate = Partial<Omit<AdminUserCreate, "password">> & {
  password?: string;
};

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.get(`${baseUrl}admin/stats/`);
    return response.data as AdminStats;
  },

  listUsers: async (): Promise<AdminUser[]> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.get(`${baseUrl}admin/users/`);
    return response.data as AdminUser[];
  },

  getUser: async (id: number): Promise<AdminUser> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.get(`${baseUrl}admin/users/${id}/`);
    return response.data as AdminUser;
  },

  createUser: async (data: AdminUserCreate): Promise<AdminUser> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.post(`${baseUrl}admin/users/`, data);
    return response.data as AdminUser;
  },

  updateUser: async (id: number, data: AdminUserUpdate): Promise<AdminUser> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.patch(`${baseUrl}admin/users/${id}/`, data);
    return response.data as AdminUser;
  },

  deleteUser: async (id: number): Promise<void> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    await axios.delete(`${baseUrl}admin/users/${id}/`);
  },
};
