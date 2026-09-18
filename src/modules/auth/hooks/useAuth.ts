import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getMe, login } from "@/modules/auth/api/authApi";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setUser } from "@/modules/auth/authSlice";

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

/**
 * Re-reads the signed-in profile once per session.
 *
 * The cached user in localStorage can be stale — a role changed or a tenant
 * reassigned since the last login — and every permission check in the UI reads
 * from it. A 401 here is handled by the http interceptor (sign-out).
 */
export function useSyncMe() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: Boolean(token),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) dispatch(setUser(query.data));
  }, [query.data, dispatch]);

  return query;
}
