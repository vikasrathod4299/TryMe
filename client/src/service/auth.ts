import axiosClient from "@/lib/axios-client";

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await axiosClient.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const register = async (data: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}) => {
  const response = await axiosClient.post("/auth/register", data);
  return response.data;
};

export const logout = async ({ refresh_token }: { refresh_token: string }) => {
  const response = await axiosClient.post("/auth/logout", {
    refresh_token,
  });
  return response.data;
};
