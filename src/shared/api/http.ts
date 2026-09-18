import axios from "axios";
import { store } from "@/app/store";
import { clearAuth } from "@/modules/auth/authSlice";

// Must include the /api prefix, e.g. https://your-api.onrender.com/api
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5010/api",
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const hasToken = Boolean(store.getState().auth.accessToken);
      if (hasToken) store.dispatch(clearAuth());
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  },
);

/** Pagination block on list responses. */
export type ListMeta = { page: number; limit: number; total: number };

/** Success envelope: `{ success: true, data, meta?, message? }`. */
export type ApiEnvelope<T> = {
  success: true;
  data: T;
  meta?: ListMeta;
  message?: string;
};

/** A page of records plus whatever the server said about the rest. */
export type Paged<T> = { items: T[]; meta: ListMeta };

export type ListQuery = { page?: number; limit?: number; search?: string };

/**
 * Normalise a list response into `Paged`. The meta block is optional in the
 * contract, so a response without one is treated as a single complete page.
 */
export function toPaged<T>(body: ApiEnvelope<T[]>, query?: ListQuery): Paged<T> {
  const items = body.data ?? [];
  return {
    items,
    meta: body.meta ?? {
      page: query?.page ?? 1,
      limit: query?.limit ?? items.length,
      total: items.length,
    },
  };
}

/** Whether another page exists after `meta`. */
export function hasMorePages(meta: ListMeta | undefined, receivedOnPage: number): boolean {
  if (!meta) return false;
  if (typeof meta.total === "number") return meta.page * meta.limit < meta.total;
  return receivedOnPage >= meta.limit;
}

type ApiValidationIssue = {
  path?: string | Array<string | number>;
  field?: string;
  message?: string;
};
type ApiErrorResponse = {
  success?: false;
  error?: { code?: string; message?: string; details?: ApiValidationIssue[] };
};

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      const first = data.error.details?.[0];
      if (first?.message) {
        const rawWhere =
          first.field ?? (Array.isArray(first.path) ? first.path.join(".") : first.path);
        // The API reports "body.agent.temperature"; the request section means nothing to a user.
        const where = rawWhere?.replace(/^(body|query|params)\./, "");
        // Name the field when the server did, so "must be at least 12 characters"
        // is not left to guess which input it means.
        return where ? `${where}: ${first.message}` : first.message;
      }
      return String(data.error.message);
    }
    if (err.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
}

export type { ApiValidationIssue };
