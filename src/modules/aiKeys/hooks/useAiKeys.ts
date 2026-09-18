import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addAiKey, listAiKeys, removeAiKey } from "../api/aiKeysApi";
import type { AddAiKeyPayload, AiKeyList } from "../types";

export const aiKeysKey = (tenantId: string) => ["tenants", "ai-keys", tenantId] as const;

/**
 * The tenant's keys.
 *
 * A resting key wakes up by itself, so while one is cooling the list is polled
 * once a minute — otherwise the badge would claim "Resting until 14:05" long
 * after 14:05. Nothing else changes without a click here, so an idle list is
 * left alone.
 */
export function useAiKeys(tenantId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeysKey(tenantId ?? ""),
    queryFn: () => listAiKeys(tenantId as string),
    enabled: Boolean(tenantId) && (options?.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: (query) =>
      (query.state.data as AiKeyList | undefined)?.keys.some((k) => k.cooling) ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useAddAiKey(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddAiKeyPayload) => addAiKey(tenantId, payload),
    // The list carries more than the new row — `usingPlatformKeys` flips on the
    // first key — so refetch it rather than pushing the item in by hand.
    onSuccess: () => qc.invalidateQueries({ queryKey: aiKeysKey(tenantId) }),
  });
}

export function useRemoveAiKey(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => removeAiKey(tenantId, keyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: aiKeysKey(tenantId) }),
  });
}
