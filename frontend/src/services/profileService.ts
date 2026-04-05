import axios from "axios";

import API_URL from "./api";

export type StudentProfileMe = {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  class_level: string;
  speciality: string;
  parent_email: string;
  parent_phone: string;
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
}>;

export const profileService = {
  getMe: async (): Promise<StudentProfileMe> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.get(`${baseUrl}profile/`);
    return response.data as StudentProfileMe;
  },

  updateMe: async (data: StudentProfileMeUpdate): Promise<StudentProfileMe> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    const response = await axios.patch(`${baseUrl}profile/`, data);
    return response.data as StudentProfileMe;
  },

  deleteMe: async (): Promise<void> => {
    const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
    await axios.delete(`${baseUrl}profile/`);
  },
};
