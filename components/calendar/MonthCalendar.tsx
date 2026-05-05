"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { CheckinType } from "@/lib/types/database";

type DayMap = Record<string, Set<CheckinType>>;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthBounds(year: number, month0: number) {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 0);
  return { start, end };
}

function buildGrid(year: number, month0: number) {
  const { start, end } = monthBounds(year, month0);
  const leading = start.getDay();
  const trailing = 6 - end.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) days.push(null);
  for (let d = 1; d <= end.getDate(); d++) days.push(new Date(year, month0, d));
  for (let i = 0; i < trailing; i++) days.push(null);
  return days;
}

function buildDayMap(rows: { date: string; type: CheckinType }[]): DayMap {
  const map: DayMap = {};
  for (const r of rows) {
    if (!map[r.date]) map[r.date] = new Set();
    map[r.date].add(r.type);
  }
  return map;
}

function dayClass(types: Set<CheckinType> | undefined, isToday: boolean) {
  const has = (t: CheckinType) => types?.has(t);
  let bg = "";
  if (has("personal") && has("self")) bg = "bg-violet-500 text-white";
  else if (has("personal")) bg = "bg-emerald-500 text-white";
  else if (has("self")) bg = "bg-sky-200 text-zinc-900";
  return cn(
    "aspect-square flex items-center justify-center text-sm rounded-lg",
    bg,
    !bg && "text-zinc-700",
    isToday && !bg && "ring-2 ring-emerald-400",
    isToday && bg && "ring-2 ring-zinc-900",
  );
}

export function MonthCalendar({
  initialYear,
  initialMonth0,
  initialCheckins,
}: {
  initialYear: number;
  initialMonth0: number;
  initialCheckins: { date: string; type: CheckinType }[];
}) {
  const [year, setYear] = useState(initialYear);
  const [month0, setMonth0] = useState(initialMonth0);
  const [dayMap, setDayMap] = useState<DayMap>(() => buildDayMap(initialCheckins));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (year === initialYear && month0 === initialMonth0) return;
    startTransition(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setDayMap({});
        return;
      }
      const supabase = createClient();
      const { start, end } = monthBounds(year, month0);
      const { data } = await supabase
        .from("check_ins")
        .select("date, type")
        .gte("date", ymd(start))
        .lte("date", ymd(end));
      setDayMap(buildDayMap(data ?? []));
    });
  }, [year, month0, initialYear, initialMonth0]);

  const todayStr = ymd(new Date());
  const grid = buildGrid(year, month0);

  function shift(delta: number) {
    let m = month0 + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth0(m);
    setYear(y);
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
      <header className="flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          aria-label="前月"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-zinc-900">
          {year}年 {month0 + 1}月
          {isPending && <span className="ml-2 text-xs text-zinc-400">読込中…</span>}
        </h2>
        <button
          type="button"
          onClick={() => shift(1)}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          aria-label="翌月"
        >
          <ChevronRight size={20} />
        </button>
      </header>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "text-center text-xs",
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-500",
            )}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) =>
          d ? (
            <div key={i} className={dayClass(dayMap[ymd(d)], ymd(d) === todayStr)}>
              {d.getDate()}
            </div>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
      <footer className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-500" /> パーソナル
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-sky-200" /> 自主トレ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-violet-500" /> 両方
        </span>
      </footer>
    </section>
  );
}
