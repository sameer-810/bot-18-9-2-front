import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/modules/common/FormDialog";
import { Field } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { inputCls } from "@/shared/lib/formStyles";
import { ROLE_LABELS, usePermissions } from "@/modules/auth/hooks/usePermissions";
import type { Role } from "@/modules/auth/authSlice";
import type { Tenant } from "@/modules/tenants/types";
import { useCreateUser, useUpdateUser } from "../hooks/useUsers";
import { MIN_PASSWORD, type User } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email"),
  role: z.enum(["admin", "owner", "staff"]),
  tenantId: z.string().optional(),
  password: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const ROLE_HELP: Record<Role, string> = {
  admin: "Operates the platform: every tenant, every user.",
  owner: "Runs one business: agent, channel, connection and its users.",
  staff: "Reads conversations and can pause the AI in a chat. Cannot change settings.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  value: User | null;
  /** Admin only — the businesses a new owner/staff user can belong to. */
  tenants: Tenant[];
}

export function UserDialog({ open, onOpenChange, mode, value, tenants }: Props) {
  const { isAdmin, user: me } = usePermissions();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isPending = createMutation.isPending || updateMutation.isPending;

  /** An owner may only create owners and staff, and only for their own tenant. */
  const roleOptions: Role[] = isAdmin ? ["admin", "owner", "staff"] : ["owner", "staff"];
  const editingSelf = mode === "edit" && value?.id === me?.id;

  const empty: FormValues = {
    name: "",
    email: "",
    role: "staff",
    tenantId: "",
    password: "",
  };

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });
  const { errors } = form.formState;
  const role = form.watch("role");

  useEffect(() => {
    if (!open) return;
    form.reset(
      mode === "edit" && value
        ? {
            name: value.name,
            email: value.email,
            role: value.role,
            tenantId: value.tenantId ?? "",
            password: "",
          }
        : { name: "", email: "", role: "staff", tenantId: "", password: "" },
    );
  }, [open, mode, value, form]);

  async function onSubmit(data: FormValues) {
    const password = data.password ?? "";
    if ((mode === "create" || password) && password.length < MIN_PASSWORD) {
      form.setError("password", {
        message: `Password must be at least ${MIN_PASSWORD} characters`,
      });
      return;
    }

    try {
      if (mode === "create") {
        if (isAdmin && data.role !== "admin" && !data.tenantId) {
          form.setError("tenantId", { message: "Choose the business this user belongs to" });
          return;
        }
        await createMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password,
          role: data.role,
          // Admins pick the tenant; for an owner the server forces their own.
          ...(isAdmin && data.role !== "admin" && data.tenantId ? { tenantId: data.tenantId } : {}),
        });
        toast.success("User created");
      } else if (value) {
        await updateMutation.mutateAsync({
          id: value.id,
          payload: {
            ...(data.name !== value.name ? { name: data.name } : {}),
            ...(data.role !== value.role && !editingSelf ? { role: data.role } : {}),
            ...(password ? { password } : {}),
          },
        });
        toast.success("User updated");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const tenantName = (id: string | null | undefined) =>
    tenants.find((t) => t.id === id)?.name ?? (id ? "Unknown business" : "—");

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "New user" : "Edit user"}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isPending}
      submitLabel={mode === "create" ? "Create user" : "Save changes"}
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <Field label="Full name *" error={errors.name?.message} className="sm:col-span-2">
          <input className={inputCls} autoComplete="off" {...form.register("name")} />
        </Field>
        <Field
          label="Email *"
          error={errors.email?.message}
          hint={mode === "edit" ? "Email cannot be changed." : undefined}
        >
          <input
            type="email"
            className={inputCls}
            autoComplete="off"
            disabled={mode === "edit"}
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Role *"
          error={errors.role?.message}
          hint={editingSelf ? "You cannot change your own role." : ROLE_HELP[role]}
        >
          <select
            className={inputCls}
            disabled={editingSelf || (mode === "edit" && !roleOptions.includes(value!.role))}
            {...form.register("role")}
          >
            {/* Keep an out-of-range current role visible rather than silently changing it. */}
            {mode === "edit" && value && !roleOptions.includes(value.role) && (
              <option value={value.role}>{ROLE_LABELS[value.role]}</option>
            )}
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>

        {isAdmin && role !== "admin" && (
          <Field
            label={mode === "create" ? "Business *" : "Business"}
            error={errors.tenantId?.message}
            hint={
              mode === "edit" ? "A user's business cannot be changed after creation." : undefined
            }
            className="sm:col-span-2"
          >
            {mode === "create" ? (
              <select className={inputCls} {...form.register("tenantId")}>
                <option value="">Choose a business…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <input className={inputCls} value={tenantName(value?.tenantId)} disabled readOnly />
            )}
          </Field>
        )}

        <Field
          label={mode === "create" ? "Password *" : "Reset password"}
          error={errors.password?.message}
          className="sm:col-span-2"
        >
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            placeholder={
              mode === "edit" ? "Leave blank to keep" : `At least ${MIN_PASSWORD} characters`
            }
            {...form.register("password")}
          />
        </Field>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </FormDialog>
  );
}
