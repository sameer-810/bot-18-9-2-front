import { http, toPaged, type ApiEnvelope, type ListQuery } from "@/shared/api/http";

/**
 * CRUD client for a REST collection that speaks the standard envelope. List
 * calls always resolve to `{ items, meta }`, whether or not the server sent a
 * meta block.
 */
export function createResourceApi<
  TItem,
  TListQuery extends ListQuery,
  TCreatePayload extends object,
  TUpdatePayload extends object = Partial<TCreatePayload>,
>(resourcePath: string) {
  return {
    async list(query: TListQuery) {
      const res = await http.get<ApiEnvelope<TItem[]>>(resourcePath, { params: query });
      return toPaged(res.data, query);
    },
    async getById(id: string) {
      const res = await http.get<ApiEnvelope<TItem>>(`${resourcePath}/${id}`);
      return res.data.data;
    },
    async create(payload: TCreatePayload) {
      const res = await http.post<ApiEnvelope<TItem>>(resourcePath, payload);
      return res.data.data;
    },
    async update(id: string, payload: TUpdatePayload) {
      const res = await http.patch<ApiEnvelope<TItem>>(`${resourcePath}/${id}`, payload);
      return res.data.data;
    },
    async remove(id: string) {
      await http.delete(`${resourcePath}/${id}`);
    },
  };
}
