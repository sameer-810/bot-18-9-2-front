import { Badge } from "@/shared/components/Badge";
import { WHATSAPP_STATUS } from "../constants";
import type { WhatsappStatus } from "../types";

export function WhatsappStatusBadge({
  status,
  className,
}: {
  status: WhatsappStatus | undefined;
  className?: string;
}) {
  const meta = status ? WHATSAPP_STATUS[status] : undefined;
  if (!meta) return <Badge className={className}>{status ?? "Unknown"}</Badge>;
  return (
    <Badge tone={meta.tone} className={className}>
      <span
        aria-hidden
        className={
          status === "connected"
            ? "h-1.5 w-1.5 rounded-full bg-current"
            : status === "connecting" || status === "pairing"
              ? "h-1.5 w-1.5 animate-pulse rounded-full bg-current"
              : "h-1.5 w-1.5 rounded-full bg-current opacity-50"
        }
      />
      {meta.label}
    </Badge>
  );
}
