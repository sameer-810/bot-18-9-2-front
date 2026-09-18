import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function createResourceHooks<
  TItem,
  TListQuery extends object,
  TCreatePayload extends object,
  TUpdatePayload extends object,
  TListResult,
>(
  key: string,
  api: {
    list: (query: TListQuery) => Promise<TListResult>;
    getById: (id: string) => Promise<TItem>;
    create: (payload: TCreatePayload) => Promise<TItem>;
    update: (id: string, payload: TUpdatePayload) => Promise<TItem>;
    remove: (id: string) => Promise<void>;
  },
) {
  const KEYS = {
    all: [key] as const,
    lists: () => [...KEYS.all, "list"] as const,
    list: (filters: TListQuery) => [...KEYS.lists(), filters] as const,
    details: () => [...KEYS.all, "detail"] as const,
    detail: (id: string) => [...KEYS.details(), id] as const,
  };

  /** `enabled: false` holds the request back until the caller has what it needs. */
  function useList(query: TListQuery, options?: { enabled?: boolean }) {
    return useQuery({
      queryKey: KEYS.list(query),
      queryFn: () => api.list(query),
      enabled: options?.enabled ?? true,
      // Keep the current page on screen while the next search result loads,
      // rather than flashing an empty table on every keystroke.
      placeholderData: keepPreviousData,
    });
  }

  function useDetail(id: string | undefined) {
    return useQuery({
      queryKey: KEYS.detail(id ?? ""),
      queryFn: () => api.getById(id as string),
      enabled: Boolean(id),
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.create,
      onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: TUpdatePayload }) =>
        api.update(id, payload),
      onSuccess: (item, { id }) => {
        qc.setQueryData(KEYS.detail(id), item);
        return qc.invalidateQueries({ queryKey: KEYS.all });
      },
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.remove,
      onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
    });
  }

  return { KEYS, useList, useDetail, useCreate, useUpdate, useDelete };
}
