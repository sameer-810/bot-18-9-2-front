import type { AuthUser, Role } from "@/modules/auth/authSlice";

export type User = AuthUser;

export type CreateUserPayload = {
  name: string;
  email: string;
  /** Minimum 12 characters. */
  password: string;
  role: Role;
  /** Required from an admin for owner/staff; ignored (forced) for an owner. */
  tenantId?: string;
};

export type UpdateUserPayload = {
  name?: string;
  role?: Role;
  isActive?: boolean;
  password?: string;
};

/** Mirrors the backend password rule. */
export const MIN_PASSWORD = 12;
