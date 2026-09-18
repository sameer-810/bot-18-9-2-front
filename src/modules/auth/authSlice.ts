import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

/**
 * - `admin` — platform operator, sees every tenant.
 * - `owner` — runs one tenant (business); may manage its agent, channel and users.
 * - `staff` — belongs to one tenant; read-only except pausing the AI in a chat.
 */
export type Role = "admin" | "owner" | "staff";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

const STORAGE_KEY = "waagent.auth";

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, user: null };
    const parsed = JSON.parse(raw) as AuthState;
    return { accessToken: parsed.accessToken ?? null, user: parsed.user ?? null };
  } catch {
    return { accessToken: null, user: null };
  }
}

function persist(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / blocked storage: the session still works until reload.
  }
}

const slice = createSlice({
  name: "auth",
  initialState: loadState(),
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      persist(state);
    },
    /** Refresh the cached profile from `/auth/me` without touching the token. */
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      persist(state);
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { setAuth, setUser, clearAuth } = slice.actions;
export default slice.reducer;
