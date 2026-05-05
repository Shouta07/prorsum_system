"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "1m", label: "1ヶ月", days: 30 },
  { key: "3m", label: "3ヶ月", days: 90 },
  { key: "6m", label: "6ヶ月", days: 180 },
  { key: "1y", label: "1年", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function WeightChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  const [range, setRange] = useState<RangeKey>("1m");
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;

  const filtered = useMemo(() => {
    if (data.length === 0) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
    return data
      .filter((d) => d.date >= cutoffStr)
      .map((d) => ({
        ...d,
        label: days <= 90 ? d.date.slice(5).replace("-", "/") : d.date.slice(2, 7).replace("-", "/"),
      }));
  }, [data, days]);

  const min = filtered.length ? Math.min(...filtered.map((d) => d.weight_kg)) : 0;
  const max = filtered.length ? Math.max(...filtered.map((d) => d.weight_kg)) : 0;
  const pad = Math.max((max - min) * 0.2, 0.5);
  const first = filtered[0]?.weight_kg;
  const last = filtered[filtered.length - 1]?.weight_kg;
  const delta = first != null && last != null ? +(last - first).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-zinc-500">直近 {RANGES.find((r) => r.key === range)?.label}</p>
          <p className="text-2xl font-bold text-zinc-900">{last != null ? `${last} kg` : "—"}</p>
        </div>
        {delta != null && (
          <p
            className={`text-sm font-semibold ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-rose-500" : "text-zinc-500"}`}
          >
            {delta > 0 ? "+" : ""}
            {delta} kg
          </p>
        )}
      </div>

      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={cn(
              "h-8 flex-1 rounded-md text-xs font-medium ring-1 transition",
              range === r.key
                ? "bg-zinc-900 text-white ring-zinc-900"
                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-44 items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-400">
          まだ記録がありません
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                interval={Math.max(0, Math.floor(filtered.length / 5) - 1)}
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
                contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
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
      )}
    </div>
  );
}
