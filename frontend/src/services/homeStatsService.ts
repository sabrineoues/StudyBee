import axios from "axios";

import API_URL from "./api";

export type HomeStats = {
  students_supported: number;
  study_minutes_guided: number;
  study_hours_guided: number;
};

function getBaseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

export const homeStatsService = {
  get: async (): Promise<HomeStats> => {
    const response = await axios.get(`${getBaseUrl()}home-stats/`);
    return response.data as HomeStats;
  },
};
