import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connect, disconnect, getConnection, logout } from "../api/whatsappApi";
import { ACTIVE_CONNECTION_STATES } from "../constants";
import { TENANT_KEYS } from "./useTenants";
import type { WhatsappConnection } from "../types";

export const whatsappKey = (tenantId: string) => ["tenants", "whatsapp", tenantId] as const;

/**
 * Live connection state.
 *
 * Polls every 3s while the backend is connecting or waiting for the pairing
 * code — that is when the code appears, refreshes and gets accepted — and every
 * 30s otherwise, which is enough to notice a dropped session.
 */
export function useWhatsappConnection(tenantId: string | undefined) {
  return useQuery({
    queryKey: whatsappKey(tenantId ?? ""),
    queryFn: () => getConnection(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: 0,
    refetchInterval: (query) => {
      const status = (query.state.data as WhatsappConnection | undefined)?.status;
      return status && ACTIVE_CONNECTION_STATES.includes(status) ? 3_000 : 30_000;
    },
    refetchIntervalInBackground: false,
  });
}

function useConnectionMutation<TVars>(
  tenantId: string,
  fn: (vars: TVars) => ReturnType<typeof connect>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      qc.setQueryData(whatsappKey(tenantId), result.connection);
      // Status is also shown on the tenant record and in lists.
      void qc.invalidateQueries({ queryKey: TENANT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useConnectWhatsapp(tenantId: string) {
  return useConnectionMutation(tenantId, (phoneNumber?: string) => connect(tenantId, phoneNumber));
}

export function useDisconnectWhatsapp(tenantId: string) {
  return useConnectionMutation(tenantId, () => disconnect(tenantId));
}

export function useLogoutWhatsapp(tenantId: string) {
  return useConnectionMutation(tenantId, () => logout(tenantId));
}
