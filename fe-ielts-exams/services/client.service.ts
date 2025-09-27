// services/auth.service.ts

import { clientService } from "@/lib/axios";
import { parseAxiosError } from "@/lib/errorHandler";
import axios from "axios";

export async function login(email: string, password: string): Promise<any> {
  try {
    const res = await axios.post('/api/auth/login', { username: email, password });
    return res?.data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}

export async function logout(): Promise<any> {
  try {
    await axios.post('/api/auth/logout');
    return true;
  } catch (error) {
    return parseAxiosError(error);
  }
}

export async function getMe(): Promise<any> {
  try {
    const dataRes = await clientService.get('/api/user/profile');
    return dataRes?.data;
  } catch (error) {
    return parseAxiosError(error);
  }
}
