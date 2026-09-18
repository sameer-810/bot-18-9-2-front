import { createResourceHooks } from "@/modules/common/createResourceHooks";
import { tenantApi } from "../api/tenantApi";

const tenantHooks = createResourceHooks("tenants", tenantApi);

export const TENANT_KEYS = tenantHooks.KEYS;
export const useTenants = tenantHooks.useList;
export const useTenant = tenantHooks.useDetail;
export const useCreateTenant = tenantHooks.useCreate;
export const useUpdateTenant = tenantHooks.useUpdate;
export const useDeleteTenant = tenantHooks.useDelete;
