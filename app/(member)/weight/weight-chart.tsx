"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function WeightChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  const labeled = data.map((d) => ({
    ...d,
    label: d.date.slice(5).replace("-", "/"),
  }));

  if (labeled.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-400">
        まだ記録がありません
      </div>
    );
  }

  const min = Math.min(...labeled.map((d) => d.weight_kg));
  const max = Math.max(...labeled.map((d) => d.weight_kg));
  const pad = Math.max((max - min) * 0.2, 0.5);

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={labeled} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            interval={Math.max(0, Math.floor(labeled.length / 5) - 1)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[+(min - pad).toFixed(1), +(max + pad).toFixed(1)]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 12,
            }}
            formatter={(v) => [`${v} kg`, "体重"]}
          />
          <Area
            type="monotone"
            dataKey="weight_kg"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#weightFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
