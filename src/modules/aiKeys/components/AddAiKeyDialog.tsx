import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/modules/common/FormDialog";
import { Field } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { inputCls } from "@/shared/lib/formStyles";
import { useAddAiKey } from "../hooks/useAiKeys";
import { AI_KEY_LABEL_MAX, AI_KEY_MAX, AI_KEY_MIN, GEMINI_KEY_URL } from "../types";

const schema = z.object({
  label: z
    .string()
    .trim()
    .max(AI_KEY_LABEL_MAX, `Keep the label under ${AI_KEY_LABEL_MAX} characters`),
  apiKey: z
    .string()
    .trim()
    .min(AI_KEY_MIN, "That does not look like an API key")
    .max(AI_KEY_MAX, "That is longer than any Gemini key"),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = { label: "", apiKey: "" };

export function AddAiKeyDialog({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMutation = useAddAiKey(tenantId);
  // Google's refusal explains what is wrong with the key ("API key not valid",
  // "billing disabled"), so it belongs in the dialog next to the field the user
  // must fix, not in a toast that disappears while they read it.
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(empty);
    setServerError(null);
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    if (addMutation.isPending) return;
    setServerError(null);
    try {
      // The key is passed straight to the request — never logged, and never put
      // anywhere it could end up in an error report.
      await addMutation.mutateAsync({
        ...(values.label ? { label: values.label } : {}),
        apiKey: values.apiKey,
      });
      form.reset(empty);
      onOpenChange(false);
      toast.success("API key added");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a Gemini API key"
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={addMutation.isPending}
      submitLabel="Add key"
      error={serverError}
    >
      <form
        className="grid grid-cols-1 gap-4"
        // The dialog is mounted from the Agent tab, whose own form wraps it in
        // the React tree; without this, submitting here would also save the tab.
        onSubmit={(e) => {
          e.stopPropagation();
          void form.handleSubmit(onSubmit)(e);
        }}
        noValidate
      >
        <Field
          label="Label"
          error={errors.label?.message}
          hint="Optional — how you will recognise this key later, e.g. “Main key”."
        >
          <input
            className={inputCls}
            autoComplete="off"
            placeholder="Main key"
            {...form.register("label")}
          />
        </Field>
        <Field
          label="API key *"
          error={errors.apiKey?.message}
          hint={
            <>
              Create one free at{" "}
              <a
                href={GEMINI_KEY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
              . It is encrypted when saved, and only its last four characters are shown afterwards.
            </>
          }
        >
          <input
            type="password"
            className={`${inputCls} font-mono`}
            autoComplete="off"
            spellCheck={false}
            placeholder="AIza…"
            {...form.register("apiKey")}
          />
        </Field>

        {addMutation.isPending && (
          <p aria-live="polite" className="text-xs text-muted-foreground">
            Checking the key with Google — this takes a few seconds.
          </p>
        )}

        {/* Lets Enter submit from any field. */}
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
      </form>
    </FormDialog>
  );
}
