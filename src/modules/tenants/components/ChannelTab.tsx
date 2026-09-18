import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { Field } from "@/shared/components/Field";
import { Callout } from "@/shared/components/Callout";
import { inputCls, primaryBtnCls, secondaryBtnCls } from "@/shared/lib/formStyles";
import { useUpdateTenant } from "../hooks/useTenants";
import { PROVIDER_LABELS } from "../constants";
import { normalizePhone, PHONE_RE } from "../lib/timezones";
import type { Tenant, UpdateTenantPayload, WhatsappProvider } from "../types";

const schema = z
  .object({
    provider: z.enum(["baileys", "cloud_api"]),
    phoneNumber: z
      .string()
      .trim()
      .refine((v) => !v || PHONE_RE.test(normalizePhone(v)), {
        message: "Digits with country code, e.g. 919876543210",
      }),
    phoneNumberId: z.string().trim(),
    businessAccountId: z.string().trim(),
    accessToken: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.provider !== "cloud_api") return;
    if (!v.phoneNumberId) {
      ctx.addIssue({ code: "custom", path: ["phoneNumberId"], message: "Required for Cloud API" });
    }
  });
type FormValues = z.infer<typeof schema>;

function toFormValues(t: Tenant): FormValues {
  return {
    provider: t.whatsapp?.provider ?? "baileys",
    phoneNumber: t.whatsapp?.phoneNumber ?? "",
    phoneNumberId: t.whatsapp?.cloudApi?.phoneNumberId ?? "",
    businessAccountId: t.whatsapp?.cloudApi?.businessAccountId ?? "",
    // Write-only on the server: never pre-filled, blank means "keep what is saved".
    accessToken: "",
  };
}

const PROVIDER_HELP: Record<WhatsappProvider, string> = {
  baileys:
    "Links the business's existing WhatsApp app as a linked device. Free and quick to set up, but unofficial — the number can be banned.",
  cloud_api:
    "Meta's official WhatsApp Business Platform. Needs a Meta business account, a registered number and an access token. No ban risk from the connector itself.",
};

export function ChannelTab({ tenant }: { tenant: Tenant }) {
  const updateMutation = useUpdateTenant();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(tenant),
  });
  const { errors, isDirty } = form.formState;
  const provider = form.watch("provider");
  const savedProvider = tenant.whatsapp?.provider ?? "baileys";
  const hasAccessToken = Boolean(tenant.whatsapp?.cloudApi?.hasAccessToken);

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toFormValues(tenant));
  }, [tenant, form]);

  async function onSubmit(v: FormValues) {
    if (v.provider === "cloud_api" && !hasAccessToken && !v.accessToken) {
      form.setError("accessToken", { message: "An access token is required for Cloud API" });
      return;
    }

    const saved = toFormValues(tenant);
    const whatsapp: NonNullable<UpdateTenantPayload["whatsapp"]> = {};
    if (v.provider !== saved.provider) whatsapp.provider = v.provider;
    const phone = normalizePhone(v.phoneNumber);
    if (phone !== saved.phoneNumber) whatsapp.phoneNumber = phone;

    const cloudApi: NonNullable<NonNullable<UpdateTenantPayload["whatsapp"]>["cloudApi"]> = {};
    if (v.phoneNumberId !== saved.phoneNumberId) cloudApi.phoneNumberId = v.phoneNumberId;
    if (v.businessAccountId !== saved.businessAccountId) {
      cloudApi.businessAccountId = v.businessAccountId;
    }
    if (v.accessToken) cloudApi.accessToken = v.accessToken;
    if (Object.keys(cloudApi).length > 0) whatsapp.cloudApi = cloudApi;

    if (Object.keys(whatsapp).length === 0) {
      toast.info("Nothing to save — no changes");
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({ id: tenant.id, payload: { whatsapp } });
      form.reset(toFormValues(updated));
      toast.success(
        whatsapp.provider
          ? "Channel saved. Reconnect on the Connection tab to use the new provider."
          : "Channel saved",
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-4">
      <section className="pg-tile space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Provider</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How this business's WhatsApp messages reach the agent.
          </p>
        </div>

        <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["baileys", "cloud_api"] as const).map((p) => (
            <label
              key={p}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                provider === p ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
              )}
            >
              <input
                type="radio"
                value={p}
                className="mt-0.5 h-4 w-4 accent-primary"
                {...form.register("provider")}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {PROVIDER_LABELS[p]}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {PROVIDER_HELP[p]}
                </span>
              </span>
            </label>
          ))}
        </div>

        <Callout tone={provider !== savedProvider ? "warning" : "neutral"}>
          Switching providers requires reconnecting. After saving, open the Connection tab,
          disconnect the current session and press Connect again.
        </Callout>

        <Field
          label="WhatsApp number"
          error={errors.phoneNumber?.message}
          hint="Digits with country code, no + or spaces."
        >
          <input
            inputMode="tel"
            placeholder="919876543210"
            className={`${inputCls} font-mono tabular-nums`}
            {...form.register("phoneNumber")}
          />
        </Field>
      </section>

      {provider === "cloud_api" && (
        <section className="pg-tile space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Cloud API credentials</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              From Meta Business Suite → WhatsApp Manager → API setup.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone number ID *" error={errors.phoneNumberId?.message}>
              <input
                className={`${inputCls} font-mono tabular-nums`}
                autoComplete="off"
                {...form.register("phoneNumberId")}
              />
            </Field>
            <Field label="Business account ID" error={errors.businessAccountId?.message}>
              <input
                className={`${inputCls} font-mono tabular-nums`}
                autoComplete="off"
                {...form.register("businessAccountId")}
              />
            </Field>
            <Field
              label={hasAccessToken ? "Access token" : "Access token *"}
              error={errors.accessToken?.message}
              hint={
                hasAccessToken
                  ? "A token is saved. Leave blank to keep it, or paste a new one to replace it."
                  : "A permanent system-user token. Once saved it is never shown again."
              }
              className="sm:col-span-2"
            >
              <input
                type="password"
                autoComplete="new-password"
                placeholder={hasAccessToken ? "•••••••• saved" : "Paste access token"}
                className={`${inputCls} font-mono`}
                {...form.register("accessToken")}
              />
            </Field>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={!isDirty || updateMutation.isPending}
          onClick={() => form.reset(toFormValues(tenant))}
          className={secondaryBtnCls}
        >
          Discard
        </button>
        <button type="submit" disabled={updateMutation.isPending} className={primaryBtnCls}>
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving…" : "Save channel"}
        </button>
      </div>
    </form>
  );
}
