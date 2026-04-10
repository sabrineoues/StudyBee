import axios from "axios";
import API_URL from "./api";

export type JournalEntry = {
  id: number;
  title?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type JournalEntryCreate = {
  title?: string;
  content: string;
};

export type JournalEntryUpdate = Partial<JournalEntryCreate>;

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

// Note: backend journal endpoints may not be implemented yet.
// This service is kept for compatibility / future use.
export const journalService = {
  listMine: async (): Promise<JournalEntry[]> => {
    const response = await axios.get(`${baseUrl()}journal/`);
    return response.data as JournalEntry[];
  },

  create: async (data: JournalEntryCreate): Promise<JournalEntry> => {
    const response = await axios.post(`${baseUrl()}journal/`, data);
    return response.data as JournalEntry;
  },

  update: async (id: number, data: JournalEntryUpdate): Promise<JournalEntry> => {
    const response = await axios.patch(`${baseUrl()}journal/${id}/`, data);
    return response.data as JournalEntry;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${baseUrl()}journal/${id}/`);
  },
};
