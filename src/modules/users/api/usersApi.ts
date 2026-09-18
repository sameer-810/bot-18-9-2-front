import { http, type ApiEnvelope } from "@/shared/api/http";
import type { CreateUserPayload, UpdateUserPayload, User } from "../types";

/** Admin: every user. Owner: the users of their own tenant. */
export async function listUsers() {
  const res = await http.get<ApiEnvelope<User[]>>("/users");
  return res.data.data;
}

export async function createUser(payload: CreateUserPayload) {
  const res = await http.post<ApiEnvelope<User>>("/users", payload);
  return res.data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await http.patch<ApiEnvelope<User>>(`/users/${id}`, payload);
  return res.data.data;
}
