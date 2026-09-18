import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { Field } from "@/shared/components/Field";
import { Switch } from "@/shared/components/Switch";
import { Callout } from "@/shared/components/Callout";
import { inputCls, primaryBtnCls, secondaryBtnCls } from "@/shared/lib/formStyles";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import { AiKeysSection } from "@/modules/aiKeys/components/AiKeysSection";
import { useUpdateTenant } from "../hooks/useTenants";
import { KNOWLEDGE_BASE_MAX } from "../constants";
import { TimezoneInput } from "./TimezoneInput";
import { normalizePhone, PHONE_RE } from "../lib/timezones";
import type { AgentConfig, Tenant, UpdateTenantPayload } from "../types";

/** One number per line → digits-only list, blanks dropped. */
function parseNumberList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => normalizePhone(l))
    .filter(Boolean);
}

const numberList = z.string().superRefine((text, ctx) => {
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    if (!PHONE_RE.test(normalizePhone(line))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Line ${i + 1}: "${line.trim()}" is not a number with country code (8–15 digits).`,
      });
    }
  });
});

/** Blank = platform default. Otherwise a whole, non-negative number. */
const optionalInt = () =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), {
      message: "Leave blank for the platform default, or enter a whole number",
    });

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const schema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(120),
  ownerName: z.string().trim().max(120),
  timezone: z.string().trim(),
  // Validated on submit, and only for admins — owners never see or send it.
  slug: z.string().trim(),
  isActive: z.boolean(),
  enabled: z.boolean(),
  agentName: z.string().trim().max(80),
  instructions: z.string(),
  knowledgeBase: z
    .string()
    .max(KNOWLEDGE_BASE_MAX, `Knowledge base is limited to ${KNOWLEDGE_BASE_MAX} characters`),
  model: z.string().trim().max(100),
  temperature: z.number({ invalid_type_error: "Pick a temperature" }).min(0).max(2),
  replyScope: z.enum(["everyone", "allowlist"]),
  allowlist: numberList,
  blocklist: numberList,
  replyInGroups: z.boolean(),
  historyLimit: optionalInt(),
  humanTakeoverMinutes: optionalInt(),
});
type FormValues = z.infer<typeof schema>;

function toFormValues(t: Tenant): FormValues {
  const a = t.agent;
  return {
    name: t.name ?? "",
    ownerName: t.ownerName ?? "",
    timezone: t.timezone ?? "",
    slug: t.slug ?? "",
    isActive: t.isActive ?? true,
    enabled: a?.enabled ?? false,
    agentName: a?.name ?? "",
    instructions: a?.instructions ?? "",
    knowledgeBase: a?.knowledgeBase ?? "",
    model: a?.model ?? "",
    temperature: typeof a?.temperature === "number" ? a.temperature : 0.7,
    replyScope: a?.replyScope ?? "everyone",
    allowlist: (a?.allowlist ?? []).join("\n"),
    blocklist: (a?.blocklist ?? []).join("\n"),
    replyInGroups: a?.replyInGroups ?? false,
    historyLimit: a?.historyLimit == null ? "" : String(a.historyLimit),
    humanTakeoverMinutes: a?.humanTakeoverMinutes == null ? "" : String(a.humanTakeoverMinutes),
  };
}

const toNullableInt = (v: string): number | null => (v.trim() === "" ? null : Number(v));
const sameList = (a: string[], b: string[]) => a.join("\n") === b.join("\n");

/**
 * Only what changed goes to the server. Sending the whole agent object would
 * overwrite a concurrent edit (another tab, the owner and an admin at once) for
 * fields this user never touched.
 */
function buildPayload(v: FormValues, t: Tenant, isAdmin: boolean): UpdateTenantPayload {
  const payload: UpdateTenantPayload = {};
  if (v.name !== t.name) payload.name = v.name;
  if (v.ownerName !== (t.ownerName ?? "")) payload.ownerName = v.ownerName;
  if (v.timezone !== (t.timezone ?? "")) payload.timezone = v.timezone;
  if (isAdmin) {
    if (v.slug !== t.slug) payload.slug = v.slug;
    if (v.isActive !== t.isActive) payload.isActive = v.isActive;
  }

  const a = t.agent;
  const agent: Partial<AgentConfig> = {};
  if (v.enabled !== a.enabled) agent.enabled = v.enabled;
  if (v.agentName !== (a.name ?? "")) agent.name = v.agentName;
  if (v.instructions !== (a.instructions ?? "")) agent.instructions = v.instructions;
  if (v.knowledgeBase !== (a.knowledgeBase ?? "")) agent.knowledgeBase = v.knowledgeBase;
  if (v.model !== (a.model ?? "")) agent.model = v.model;
  if (v.temperature !== a.temperature) agent.temperature = v.temperature;
  if (v.replyScope !== a.replyScope) agent.replyScope = v.replyScope;
  const allow = parseNumberList(v.allowlist);
  if (!sameList(allow, a.allowlist ?? [])) agent.allowlist = allow;
  const block = parseNumberList(v.blocklist);
  if (!sameList(block, a.blocklist ?? [])) agent.blocklist = block;
  if (v.replyInGroups !== a.replyInGroups) agent.replyInGroups = v.replyInGroups;
  const history = toNullableInt(v.historyLimit);
  if (history !== (a.historyLimit ?? null)) agent.historyLimit = history;
  const takeover = toNullableInt(v.humanTakeoverMinutes);
  if (takeover !== (a.humanTakeoverMinutes ?? null)) agent.humanTakeoverMinutes = takeover;

  if (Object.keys(agent).length > 0) payload.agent = agent;
  return payload;
}

export function AgentTab({ tenant }: { tenant: Tenant }) {
  const { canManageTenant, isAdmin } = usePermissions();
  const updateMutation = useUpdateTenant();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(tenant),
  });
  const { errors, isDirty } = form.formState;

  // Pick up server-side changes, but never discard edits in progress.
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toFormValues(tenant));
  }, [tenant, form]);

  const kbLength = form.watch("knowledgeBase")?.length ?? 0;
  const temperature = form.watch("temperature");
  const replyScope = form.watch("replyScope");
  const allowlistText = form.watch("allowlist");

  async function onSubmit(values: FormValues) {
    if (isAdmin && values.slug !== tenant.slug && !SLUG_RE.test(values.slug)) {
      form.setError("slug", { message: "Lowercase letters, digits and single hyphens" });
      return;
    }
    const payload = buildPayload(values, tenant, isAdmin);
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to save — no changes");
      form.reset(toFormValues(tenant));
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({ id: tenant.id, payload });
      form.reset(toFormValues(updated));
      toast.success("Agent settings saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-4xl space-y-4">
      {!canManageTenant && (
        <Callout>You can view these settings. Only the owner or an admin can change them.</Callout>
      )}

      <fieldset disabled={!canManageTenant} className="space-y-4">
        <section className="pg-tile space-y-4">
          <Controller
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <Switch
                id="agent-enabled"
                checked={field.value}
                onChange={field.onChange}
                disabled={!canManageTenant}
                label="AI agent enabled"
                description="When off, messages are still recorded but nobody gets an automatic reply."
              />
            )}
          />
        </section>

        <section className="pg-tile space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Assistant</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How the assistant introduces itself and what it knows about the business.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Assistant name" error={errors.agentName?.message}>
              <input
                className={inputCls}
                placeholder="e.g. Asha from Sharma Dental"
                {...form.register("agentName")}
              />
            </Field>
            <Field
              label="Model"
              error={errors.model?.message}
              hint="Leave blank to use the platform default."
            >
              <input
                className={`${inputCls} font-mono`}
                placeholder="platform default"
                {...form.register("model")}
              />
            </Field>
            <Field
              label="Instructions"
              error={errors.instructions?.message}
              hint="Tone, what to help with, what never to say, when to hand over to a person."
              className="sm:col-span-2"
            >
              <textarea
                rows={6}
                className={inputCls}
                placeholder="You are the friendly front desk of… Answer briefly. If someone wants to book, ask for their name and preferred time."
                {...form.register("instructions")}
              />
            </Field>
            <Field
              label="Knowledge base"
              error={errors.knowledgeBase?.message}
              hint="Prices, opening hours, services, FAQs, policies — plain text the assistant may quote."
              className="sm:col-span-2"
              aside={
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    kbLength > KNOWLEDGE_BASE_MAX
                      ? "text-destructive"
                      : kbLength > KNOWLEDGE_BASE_MAX * 0.9
                        ? "text-warning"
                        : "text-muted-foreground",
                  )}
                >
                  {kbLength.toLocaleString("en-IN")} / {KNOWLEDGE_BASE_MAX.toLocaleString("en-IN")}
                </span>
              }
            >
              <textarea
                rows={14}
                className={`${inputCls} font-mono text-xs leading-relaxed`}
                {...form.register("knowledgeBase")}
              />
            </Field>
            <Field
              label="Temperature"
              error={errors.temperature?.message}
              hint="Lower is more consistent and literal; higher is more varied."
              className="sm:col-span-2"
              aside={
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {Number.isFinite(temperature) ? temperature.toFixed(1) : "-"}
                </span>
              }
            >
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                className="w-full accent-primary"
                {...form.register("temperature", { valueAsNumber: true })}
              />
              <span className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>0 precise</span>
                <span>1</span>
                <span>2 creative</span>
              </span>
            </Field>
          </div>
        </section>

        {/* Which keys the model above runs on — hidden for staff, who get a 403. */}
        <AiKeysSection tenantId={tenant.id} />

        <section className="pg-tile space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Who gets replies</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One number per line, digits with country code (e.g. 919876543210).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reply scope" className="sm:col-span-2">
              <select className={inputCls} {...form.register("replyScope")}>
                <option value="everyone">Everyone who messages (except the blocklist)</option>
                <option value="allowlist">Only numbers on the allowlist</option>
              </select>
            </Field>
            {replyScope === "allowlist" && parseNumberList(allowlistText ?? "").length === 0 && (
              <Callout tone="warning" className="sm:col-span-2">
                The allowlist is empty, so the assistant will not reply to anyone.
              </Callout>
            )}
            <Field
              label="Allowlist"
              error={errors.allowlist?.message}
              hint={
                replyScope === "allowlist"
                  ? "Only these numbers get replies."
                  : "Used only when the scope is allowlist."
              }
            >
              <textarea
                rows={5}
                className={`${inputCls} font-mono tabular-nums`}
                placeholder={"919876543210\n447700900123"}
                {...form.register("allowlist")}
              />
            </Field>
            <Field
              label="Blocklist"
              error={errors.blocklist?.message}
              hint="Never reply to these numbers."
            >
              <textarea
                rows={5}
                className={`${inputCls} font-mono tabular-nums`}
                placeholder="919000000000"
                {...form.register("blocklist")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Controller
                control={form.control}
                name="replyInGroups"
                render={({ field }) => (
                  <Switch
                    id="agent-groups"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={!canManageTenant}
                    label="Reply in group chats"
                    description="Off by default — an assistant answering every group message is rarely wanted."
                  />
                )}
              />
            </div>
          </div>
        </section>

        <section className="pg-tile space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Memory and hand-over</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Blank uses the platform default.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="History limit (messages)"
              error={errors.historyLimit?.message}
              hint="How many recent messages the assistant reads before replying."
            >
              <input
                inputMode="numeric"
                placeholder="platform default"
                className={`${inputCls} font-mono tabular-nums`}
                {...form.register("historyLimit")}
              />
            </Field>
            <Field
              label="Human takeover (minutes)"
              error={errors.humanTakeoverMinutes?.message}
              hint="When you reply yourself from the phone, the assistant stays quiet in that chat for this long."
            >
              <input
                inputMode="numeric"
                placeholder="platform default"
                className={`${inputCls} font-mono tabular-nums`}
                {...form.register("humanTakeoverMinutes")}
              />
            </Field>
          </div>
        </section>

        <section className="pg-tile space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Business</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business name *" error={errors.name?.message}>
              <input className={inputCls} {...form.register("name")} />
            </Field>
            <Field label="Owner name" error={errors.ownerName?.message}>
              <input className={inputCls} {...form.register("ownerName")} />
            </Field>
            <Field
              label="Timezone"
              error={errors.timezone?.message}
              hint="Used for opening hours and daily usage."
            >
              <TimezoneInput {...form.register("timezone")} />
            </Field>
            {isAdmin && (
              <Field label="Slug" error={errors.slug?.message} hint="Admin only.">
                <input className={`${inputCls} font-mono`} {...form.register("slug")} />
              </Field>
            )}
            {isAdmin && (
              <div className="sm:col-span-2">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="tenant-active"
                      checked={field.value}
                      onChange={field.onChange}
                      label="Tenant active"
                      description="Suspending a tenant stops its agent and blocks its users. Admin only."
                    />
                  )}
                />
              </div>
            )}
          </div>
        </section>
      </fieldset>

      {canManageTenant && (
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background py-3 md:static md:border-0 md:bg-transparent md:py-0">
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
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </form>
  );
}
