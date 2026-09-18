import { http, type ApiEnvelope } from "@/shared/api/http";
import type { AuthUser } from "@/modules/auth/authSlice";

export type LoginResponse = { accessToken: string; user: AuthUser };

export async function login(email: string, password: string) {
  const res = await http.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  return res.data.data;
}

export async function getMe() {
  const res = await http.get<ApiEnvelope<AuthUser>>("/auth/me");
  return res.data.data;
}
