import axiosClient from "@/lib/axios-client";

export const login = async ({email, password}:{email:string; password:string }) => {
  const response = await axiosClient.post("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export const register = async (username: string, password: string) => {
  const response = await axiosClient.post("/auth/register", {
    username,
    password,
  });
  return response.data;
}

export const logout = async () => {
  const response = await axiosClient.post("/auth/logout");
  return response.data;
}
