export type UsageDay = {
  /** `YYYY-MM-DD` in the tenant's timezone. */
  date: string;
  messagesIn: number;
  messagesOut: number;
  aiCalls: number;
  aiFailures: number;
  inputTokens: number;
  outputTokens: number;
};

export type UsageTotals = Omit<UsageDay, "date">;

export type TenantUsage = {
  /** Oldest first, zero-filled. */
  days: UsageDay[];
  totals: UsageTotals;
};
