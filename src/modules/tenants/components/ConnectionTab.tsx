import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link2Off, Plug, PowerOff, Timer } from "lucide-react";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { Callout } from "@/shared/components/Callout";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Field } from "@/shared/components/Field";
import { dangerBtnCls, inputCls, primaryBtnCls, secondaryBtnCls } from "@/shared/lib/formStyles";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import {
  useConnectWhatsapp,
  useDisconnectWhatsapp,
  useLogoutWhatsapp,
  useWhatsappConnection,
} from "../hooks/useWhatsapp";
import { PROVIDER_LABELS, WHATSAPP_STATUS } from "../constants";
import { WhatsappStatusBadge } from "./WhatsappStatusBadge";
import { normalizePhone, PHONE_RE } from "../lib/timezones";
import type { Tenant, WhatsappConnection } from "../types";

/** WhatsApp pairing codes live for about two minutes. */
const PAIRING_TTL_MS = 2 * 60 * 1000;

/** "ABCD1234" → "ABCD-1234", the way WhatsApp itself prints it. */
function formatPairingCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : code.toUpperCase();
}

/** Seconds left on the current pairing code, ticking once a second. */
function usePairingCountdown(issuedAt: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!issuedAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [issuedAt]);
  if (!issuedAt) return null;
  const issued = new Date(issuedAt).getTime();
  if (Number.isNaN(issued)) return null;
  return Math.max(0, Math.round((issued + PAIRING_TTL_MS - now) / 1000));
}

export function ConnectionTab({ tenant }: { tenant: Tenant }) {
  const { canManageTenant } = usePermissions();
  const { data: conn, isLoading, error } = useWhatsappConnection(tenant.id);
  const connectMutation = useConnectWhatsapp(tenant.id);
  const disconnectMutation = useDisconnectWhatsapp(tenant.id);
  const logoutMutation = useLogoutWhatsapp(tenant.id);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const savedNumber = conn?.phoneNumber || tenant.whatsapp?.phoneNumber || "";
  const [phone, setPhone] = useState(savedNumber);
  const [phoneTouched, setPhoneTouched] = useState(false);
  useEffect(() => {
    if (!phoneTouched) setPhone(savedNumber);
  }, [savedNumber, phoneTouched]);

  const status = conn?.status ?? tenant.whatsapp?.status ?? "disconnected";
  const provider = conn?.provider ?? tenant.whatsapp?.provider ?? "baileys";
  const statusMeta = WHATSAPP_STATUS[status];
  const busy = status === "connecting" || status === "pairing";
  const pending =
    connectMutation.isPending || disconnectMutation.isPending || logoutMutation.isPending;

  async function onConnect() {
    const normalized = normalizePhone(phone);
    if (provider === "baileys" && !normalized) {
      toast.error("Enter the WhatsApp number to link, with country code.");
      return;
    }
    if (normalized && !PHONE_RE.test(normalized)) {
      toast.error("The number must be 8–15 digits including the country code.");
      return;
    }
    try {
      const result = await connectMutation.mutateAsync(
        normalized && normalized !== savedNumber ? normalized : undefined,
      );
      setPhoneTouched(false);
      if (result.message) toast.info(result.message);
      else toast.success("Connecting to WhatsApp…");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onDisconnect() {
    try {
      const result = await disconnectMutation.mutateAsync(undefined);
      toast.success(result.message ?? "Disconnected");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onUnlink() {
    try {
      const result = await logoutMutation.mutateAsync(undefined);
      toast.success(result.message ?? "Device unlinked");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
    setConfirmUnlink(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <section className="pg-tile space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">WhatsApp connection</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{PROVIDER_LABELS[provider]}</p>
            </div>
            <WhatsappStatusBadge status={status} />
          </div>

          {error ? (
            <Callout tone="danger" title="Could not load the connection">
              {getApiErrorMessage(error)}
            </Callout>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Checking connection…" : statusMeta.description}
            </p>
          )}

          <Field
            label="WhatsApp number"
            hint="Digits with country code, no + or spaces — e.g. 919876543210."
          >
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneTouched(true);
              }}
              disabled={!canManageTenant || busy || status === "connected"}
              inputMode="tel"
              placeholder="919876543210"
              className={`${inputCls} font-mono tabular-nums`}
            />
          </Field>

          {canManageTenant ? (
            <div className="flex flex-wrap gap-2">
              {status !== "connected" && !busy && (
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={pending}
                  className={primaryBtnCls}
                >
                  <Plug className="h-4 w-4" />
                  {connectMutation.isPending
                    ? "Connecting…"
                    : conn?.connectedJid
                      ? "Reconnect"
                      : "Connect"}
                </button>
              )}
              {(status === "connected" || busy) && (
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={pending}
                  className={secondaryBtnCls}
                >
                  <PowerOff className="h-4 w-4" />
                  {busy ? "Cancel" : disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                </button>
              )}
              {status !== "logged_out" && (
                <button
                  type="button"
                  onClick={() => setConfirmUnlink(true)}
                  disabled={pending}
                  className={dangerBtnCls}
                >
                  <Link2Off className="h-4 w-4" />
                  Unlink device
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only the business owner or a platform admin can change the connection.
            </p>
          )}
        </section>

        {conn && status === "pairing" && conn.pairingCode && <PairingCodePanel conn={conn} />}

        {conn && conn.qr && !conn.pairingCode && status !== "connected" && (
          <section className="pg-tile space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Scan to link</h2>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {/* White quiet zone regardless of theme — scanners need the contrast. */}
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={conn.qr} size={220} level="M" />
              </div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Open WhatsApp on the phone that owns this number.</li>
                <li>
                  Go to <strong className="text-foreground">Settings → Linked devices</strong>.
                </li>
                <li>
                  Tap <strong className="text-foreground">Link a device</strong> and scan this code.
                </li>
                <li>The code refreshes automatically — keep this page open.</li>
              </ol>
            </div>
          </section>
        )}
      </div>

      <div className="space-y-4 lg:col-span-5">
        <section className="pg-panel divide-y divide-border">
          <div className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Session details
          </div>
          <dl className="divide-y divide-border/60 text-sm">
            <DetailRow label="Linked account">
              {conn?.connectedJid ? (
                <span className="break-all font-mono text-xs">{conn.connectedJid}</span>
              ) : (
                "-"
              )}
            </DetailRow>
            <DetailRow label="Last connected">
              <TimeValue value={conn?.lastConnectedAt ?? tenant.whatsapp?.lastConnectedAt} />
            </DetailRow>
            <DetailRow label="Last disconnected">
              <TimeValue value={conn?.lastDisconnectAt ?? tenant.whatsapp?.lastDisconnectAt} />
            </DetailRow>
            <DetailRow label="Disconnect reason">
              {conn?.lastDisconnectReason || tenant.whatsapp?.lastDisconnectReason || "-"}
            </DetailRow>
          </dl>
        </section>

        {provider === "baileys" && (
          <Callout tone="warning" title="Unofficial connector">
            WhatsApp Web linking is not an official WhatsApp API. WhatsApp can restrict or
            permanently ban numbers that use it, especially new numbers or ones that send bulk or
            unsolicited messages. Use a number you can afford to lose, or switch to the Official
            Cloud API on the Channel tab.
          </Callout>
        )}
      </div>

      <ConfirmDialog
        open={confirmUnlink}
        title="Unlink this device?"
        message="The session is removed from the phone's Linked devices. The agent stops replying, and connecting again needs a new pairing code."
        confirmLabel="Unlink"
        isPending={logoutMutation.isPending}
        onCancel={() => setConfirmUnlink(false)}
        onConfirm={onUnlink}
      />
    </div>
  );
}

function PairingCodePanel({ conn }: { conn: WhatsappConnection }) {
  const secondsLeft = usePairingCountdown(conn.pairingCodeIssuedAt);
  const code = formatPairingCode(conn.pairingCode ?? "");

  return (
    <section className="pg-tile space-y-4 border-primary/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Pairing code</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {secondsLeft === null ? (
            "Expires in about 2 minutes"
          ) : secondsLeft > 0 ? (
            <>
              Expires in{" "}
              <span className="font-mono tabular-nums text-foreground">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </span>
            </>
          ) : (
            "Refreshing…"
          )}
        </span>
      </div>

      <p
        aria-live="polite"
        className="select-all break-all text-center font-mono text-4xl font-semibold tracking-[0.18em] text-foreground sm:text-5xl"
      >
        {code}
      </p>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>Open WhatsApp on the phone that owns this number.</li>
        <li>
          Go to <strong className="text-foreground">Settings → Linked devices</strong>.
        </li>
        <li>
          Tap <strong className="text-foreground">Link a device</strong>.
        </li>
        <li>
          Tap <strong className="text-foreground">Link with phone number instead</strong>.
        </li>
        <li>Enter the code above.</li>
      </ol>

      <p className="text-xs text-muted-foreground">
        The code expires in about 2 minutes. A new one appears here automatically — there is no need
        to reload.
      </p>
    </section>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

function TimeValue({ value }: { value: string | null | undefined }) {
  if (!value) return <>-</>;
  return (
    <span title={formatDateTime(value)} className="font-mono text-xs tabular-nums">
      {formatRelative(value)}
    </span>
  );
}
