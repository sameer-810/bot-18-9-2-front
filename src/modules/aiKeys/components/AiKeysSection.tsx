import { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { Badge } from "@/shared/components/Badge";
import { Callout } from "@/shared/components/Callout";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { secondaryBtnCls } from "@/shared/lib/formStyles";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import { useAiKeys, useRemoveAiKey } from "../hooks/useAiKeys";
import { GEMINI_KEY_URL, type AiKey } from "../types";
import { AddAiKeyDialog } from "./AddAiKeyDialog";

/** Active, resting or broken — the three states an owner can act on. */
function KeyStatus({ aiKey }: { aiKey: AiKey }) {
  if (!aiKey.readable) return <Badge tone="danger">Unreadable</Badge>;
  if (aiKey.cooling) {
    return (
      <Badge tone="warning">
        {aiKey.coolingUntil ? `Resting until ${formatTime(aiKey.coolingUntil)}` : "Resting"}
      </Badge>
    );
  }
  return <Badge tone="success">Active</Badge>;
}

/**
 * A business's own Gemini keys.
 *
 * Staff never see this: the API refuses them with a 403, and these are billing
 * credentials besides.
 */
export function AiKeysSection({ tenantId }: { tenantId: string }) {
  const { canManageTenant } = usePermissions();
  const { data, isLoading, error } = useAiKeys(tenantId, { enabled: canManageTenant });
  const removeMutation = useRemoveAiKey(tenantId);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AiKey | null>(null);

  if (!canManageTenant) return null;

  const keys = data?.keys ?? [];
  const maxKeys = data?.maxKeys ?? 0;
  const atLimit = Boolean(data) && keys.length >= maxKeys;

  async function onDelete() {
    if (!pendingDelete) return;
    try {
      await removeMutation.mutateAsync(pendingDelete.id);
      toast.success("API key removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
    setPendingDelete(null);
  }

  return (
    <section className="pg-tile space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Gemini API keys</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Google counts its free daily quota per key, so every key you add raises how many
            messages this business can answer in a day.{" "}
            <a
              href={GEMINI_KEY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Create a free key
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={isLoading || atLimit}
          title={atLimit ? `This business already holds the maximum of ${maxKeys} keys` : undefined}
          className={secondaryBtnCls}
        >
          <Plus className="h-4 w-4" />
          Add key
        </button>
      </div>

      {error ? (
        <Callout tone="danger" title="Could not load the keys">
          {getApiErrorMessage(error)}
        </Callout>
      ) : null}

      {data?.usingPlatformKeys ? (
        <Callout title="Using the platform's shared keys">
          This business has no key of its own, so it shares the platform's{" "}
          <span className="font-mono tabular-nums">{data.platformKeyCount}</span>{" "}
          {data.platformKeyCount === 1 ? "key" : "keys"} with every other business. Adding its own
          key gives it a daily quota nobody else draws on.
        </Callout>
      ) : null}

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg border border-border" />
      ) : keys.length > 0 ? (
        <ul className="pg-panel divide-y divide-border">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {k.label || "Untitled key"}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{k.hint}</span> · Added {formatDate(k.createdAt)}
                </p>
              </div>
              <KeyStatus aiKey={k} />
              <button
                type="button"
                onClick={() => setPendingDelete(k)}
                aria-label={`Remove ${k.label || "key"} ${k.hint}`}
                title="Remove"
                className="pg-tap flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {!k.readable && (
                <p className="w-full text-xs text-destructive">
                  The server can no longer decrypt this key, so the agent skips it. Remove it and
                  add the key again.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {keys.length > 0 && (
        <p className="text-xs text-muted-foreground">
          When a key hits its daily quota the agent carries on with the next one and rests the tired
          key — about a minute, then ten minutes, then six hours if it keeps failing. Keys are
          stored encrypted and never shown again, only their last four characters.
        </p>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground">
          This business holds the maximum of{" "}
          <span className="font-mono tabular-nums">{maxKeys}</span> keys. Remove one before adding
          another.
        </p>
      )}

      {/*
        Both dialogs go to the body rather than staying where they are written.
        This section sits inside the Agent tab's <form>, and a dialog nested in a
        form submits it on every footer click — Cancel included.
      */}
      {createPortal(
        <>
          <AddAiKeyDialog tenantId={tenantId} open={addOpen} onOpenChange={setAddOpen} />
          <ConfirmDialog
            open={Boolean(pendingDelete)}
            title="Remove this API key?"
            message={
              keys.length === 1
                ? "It is the only key this business has, so the agent falls back to the platform's shared keys and their shared daily quota."
                : "The agent stops using it immediately and answers with the remaining keys. The key itself stays valid in Google AI Studio."
            }
            confirmLabel="Remove"
            isPending={removeMutation.isPending}
            onCancel={() => setPendingDelete(null)}
            onConfirm={onDelete}
          />
        </>,
        document.body,
      )}
    </section>
  );
}
