import { createResourceApi } from "@/modules/common/createResourceApi";
import type { CreateTenantPayload, Tenant, TenantListQuery, UpdateTenantPayload } from "../types";

export const tenantApi = createResourceApi<
  Tenant,
  TenantListQuery,
  CreateTenantPayload,
  UpdateTenantPayload
>("/tenants");
