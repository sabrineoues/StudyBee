import axios from "axios";
import API_URL from "./api";

export type TodoItem = {
  id: number;
  title: string;
  done: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TodoItemCreate = {
  title: string;
  done?: boolean;
};

export type TodoItemUpdate = Partial<TodoItemCreate>;

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

// Note: backend todolist endpoints may not be implemented yet.
// This service is kept for compatibility / future use.
export const todolistService = {
  listMine: async (): Promise<TodoItem[]> => {
    const response = await axios.get(`${baseUrl()}todolist/`);
    return response.data as TodoItem[];
  },

  create: async (data: TodoItemCreate): Promise<TodoItem> => {
    const response = await axios.post(`${baseUrl()}todolist/`, data);
    return response.data as TodoItem;
  },

  update: async (id: number, data: TodoItemUpdate): Promise<TodoItem> => {
    const response = await axios.patch(`${baseUrl()}todolist/${id}/`, data);
    return response.data as TodoItem;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${baseUrl()}todolist/${id}/`);
  },
};
