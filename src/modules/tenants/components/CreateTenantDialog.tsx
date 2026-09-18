import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/modules/common/FormDialog";
import { Field } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { inputCls } from "@/shared/lib/formStyles";
import { useCreateTenant } from "../hooks/useTenants";
import { TimezoneInput } from "./TimezoneInput";
import { browserTimezone, normalizePhone, PHONE_RE } from "../lib/timezones";
import type { Tenant } from "../types";

const schema = z.object({
  name: z.string().trim().min(2, "Business name is required"),
  ownerName: z.string().trim().max(120).optional(),
  timezone: z.string().trim().optional(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || PHONE_RE.test(normalizePhone(v)), {
      message: "Digits with country code, e.g. 919876543210",
    }),
});
type FormValues = z.infer<typeof schema>;

export function CreateTenantDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tenant: Tenant) => void;
}) {
  const createMutation = useCreateTenant();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", ownerName: "", timezone: browserTimezone(), phoneNumber: "" },
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) {
      form.reset({ name: "", ownerName: "", timezone: browserTimezone(), phoneNumber: "" });
    }
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    try {
      const phone = values.phoneNumber ? normalizePhone(values.phoneNumber) : "";
      const tenant = await createMutation.mutateAsync({
        name: values.name,
        ...(values.ownerName ? { ownerName: values.ownerName } : {}),
        ...(values.timezone ? { timezone: values.timezone } : {}),
        ...(phone ? { whatsapp: { phoneNumber: phone } } : {}),
      });
      toast.success(`${tenant.name} created`);
      onOpenChange(false);
      onCreated(tenant);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New tenant"
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={createMutation.isPending}
      submitLabel="Create tenant"
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <Field label="Business name *" error={errors.name?.message} className="sm:col-span-2">
          <input className={inputCls} autoFocus {...form.register("name")} />
        </Field>
        <Field label="Owner name" error={errors.ownerName?.message}>
          <input className={inputCls} {...form.register("ownerName")} />
        </Field>
        <Field label="Timezone" error={errors.timezone?.message}>
          <TimezoneInput {...form.register("timezone")} />
        </Field>
        <Field
          label="WhatsApp number"
          error={errors.phoneNumber?.message}
          hint="With country code, digits only. You can add it later."
          className="sm:col-span-2"
        >
          <input
            className={`${inputCls} font-mono tabular-nums`}
            inputMode="tel"
            placeholder="919876543210"
            {...form.register("phoneNumber")}
          />
        </Field>
        {/* Lets Enter submit from any field. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </FormDialog>
  );
}
