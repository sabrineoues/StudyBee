import API_URL from "./api";

export const getUsers = async () => {
  const res = await fetch(API_URL + "users/");
  return res.json();
};
