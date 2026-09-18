import type { ReactNode } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An in-page notice. Colour is status here, as everywhere: warning for "this
 * can go wrong", danger for "this has gone wrong", neutral for plain guidance.
 */
export function Callout({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: "neutral" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "warning" ? AlertTriangle : tone === "danger" ? OctagonAlert : Info;
  return (
    <div
      role={tone === "neutral" ? "note" : "alert"}
      className={cn(
        "flex gap-3 rounded-lg border px-3 py-2.5 text-sm",
        tone === "warning" && "border-warning/40 bg-warning/10 text-foreground",
        tone === "danger" && "border-destructive/30 bg-destructive/10 text-foreground",
        tone === "neutral" && "border-border bg-muted/40 text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
          tone === "neutral" && "text-muted-foreground",
        )}
      />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
