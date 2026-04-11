import axios from "axios";

import API_URL from "./api";

export type RatingsSummary = {
  average: number;
  count: number;
  my_rating: number | null;
};

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

export const ratingsService = {
  getSummary: async (): Promise<RatingsSummary> => {
    const response = await axios.get(`${baseUrl()}ratings/`);
    return response.data as RatingsSummary;
  },

  setMyRating: async (rating: number): Promise<RatingsSummary> => {
    const response = await axios.post(`${baseUrl()}ratings/`, { rating });
    return response.data as RatingsSummary;
  },
};
