import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayLabel } from "@/lib/utils";
import type { UsageDay } from "../types";

// Inbound in cobalt (the product's one accent), outbound in a desaturated teal so
// the pair is distinguishable without either reading as an alarm; AI calls as a
// neutral line over the bars. Failures are not charted — they are a count to act
// on, shown in a stat tile in the colour that means "act".
const IN_COLOR = "#1C50C8";
const OUT_COLOR = "#0D9488";
const AI_COLOR = "#94A3B8";

const SERIES_LABELS: Record<string, string> = {
  messagesIn: "Messages in",
  messagesOut: "Messages out",
  aiCalls: "AI calls",
};

export function UsageChart({ days, height = "h-64" }: { days: UsageDay[]; height?: string }) {
  const empty = days.every((d) => !d.messagesIn && !d.messagesOut && !d.aiCalls);
  if (empty) {
    return (
      <div className={`flex ${height} items-center justify-center text-sm text-muted-foreground`}>
        No messages in this period yet
      </div>
    );
  }

  const data = days.map((d) => ({ ...d, label: formatDayLabel(d.date) }));

  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent) / 0.10)" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: unknown, name: unknown) => [
              value as number,
              SERIES_LABELS[String(name)] ?? String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(v) => SERIES_LABELS[String(v)] ?? String(v)}
          />
          <Bar dataKey="messagesIn" fill={IN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="messagesOut" fill={OUT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="aiCalls"
            stroke={AI_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
