import { Bot, UserRound } from "lucide-react";
import { cn, formatDateTime, formatTime } from "@/lib/utils";
import { unsupportedLabel } from "../lib/display";
import type { Message } from "../types";

/**
 * One message. Inbound (the customer) sits left; everything the business sent
 * sits right, labelled by who sent it — the assistant ("AI") or a person on the
 * business phone ("You") — because that difference is the whole point of
 * reviewing a thread.
 */
export function MessageBubble({ message, showSender }: { message: Message; showSender: boolean }) {
  const outgoing = message.role !== "user";
  const isAi = message.role === "assistant";
  const unsupported = message.kind === "unsupported";

  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%]",
          outgoing ? "rounded-br-md" : "rounded-bl-md",
          !outgoing && "border border-border bg-card text-foreground",
          isAi && "bg-primary/10 text-foreground dark:bg-primary/20",
          message.role === "owner" && "bg-secondary text-secondary-foreground",
        )}
      >
        {outgoing ? (
          <p
            className={cn(
              "mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
              isAi ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isAi ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
            {isAi ? "AI" : "You"}
          </p>
        ) : (
          showSender &&
          message.senderName && (
            <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground">
              {message.senderName}
            </p>
          )
        )}

        {unsupported && (
          <p className="font-mono text-xs italic text-muted-foreground">
            {unsupportedLabel(message)}
          </p>
        )}
        {message.text && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        )}
        {!unsupported && !message.text && (
          <p className="text-xs italic text-muted-foreground">(empty message)</p>
        )}

        <p
          className="mt-1 text-right font-mono text-[10px] tabular-nums text-muted-foreground"
          title={formatDateTime(message.createdAt)}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
