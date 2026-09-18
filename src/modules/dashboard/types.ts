import type { UsageDay } from "@/modules/usage/types";

export type RecentConversation = {
  id: string;
  tenantId: string;
  tenantName: string;
  contactName: string | null;
  phoneNumber: string | null;
  lastMessageAt: string | null;
};

export type DashboardMetrics = {
  tenants: { total: number; active: number; connected: number };
  today: { messagesIn: number; messagesOut: number; aiCalls: number; aiFailures: number };
  last7Days: UsageDay[];
  recentConversations: RecentConversation[];
};
