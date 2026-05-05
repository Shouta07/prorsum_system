"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock, Flame, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PARTS } from "@/lib/exercises";
import type { CheckinType } from "@/lib/types/database";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export type CalendarTraining = {
  id: string;
  date: string;
  parts: string[];
  duration_min: number;
  total_volume_kg: number;
  is_cardio: boolean;
  exercise_sets: {
    id: string;
    exercise_name: string;
    weight_kg: number | null;
    reps: number | null;
    sets: number | null;
  }[];
};

type DayInfo = {
  checkins: Set<CheckinType>;
  trainings: CalendarTraining[];
  has_cardio: boolean;
  total_volume_kg: number;
};

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

function buildDayInfo(
  checkins: { date: string; type: CheckinType }[],
  trainings: CalendarTraining[],
): Record<string, DayInfo> {
  const map: Record<string, DayInfo> = {};
  function ensure(date: string): DayInfo {
    if (!map[date]) {
      map[date] = {
        checkins: new Set(),
        trainings: [],
        has_cardio: false,
        total_volume_kg: 0,
      };
    }
    return map[date];
  }
  for (const c of checkins) ensure(c.date).checkins.add(c.type);
  for (const t of trainings) {
    const info = ensure(t.date);
    info.trainings.push(t);
    info.total_volume_kg += t.total_volume_kg;
    if (t.is_cardio) info.has_cardio = true;
  }
  return map;
}

function dayCellClass(info: DayInfo | undefined, isToday: boolean, isSelected: boolean) {
  const has = (t: CheckinType) => info?.checkins.has(t);
  let bg = "";
  if (has("personal") && has("self")) bg = "bg-violet-500 text-white";
  else if (has("personal")) bg = "bg-emerald-500 text-white";
  else if (has("self")) bg = "bg-sky-200 text-zinc-900";

  const trainingBorder = info && info.trainings.length > 0 ? "ring-2 ring-sky-500 ring-inset" : "";

  return cn(
    "relative aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition",
    bg,
    !bg && "text-zinc-700",
    trainingBorder,
    isToday && !bg && "outline outline-2 outline-emerald-400 outline-offset-[-2px]",
    isSelected && "shadow-md scale-[1.05]",
  );
}

function partLabel(id: string) {
  return PARTS.find((p) => p.id === id)?.label ?? id;
}

export function MonthCalendar({
  initialYear,
  initialMonth0,
  initialCheckins,
  initialTrainings = [],
}: {
  initialYear: number;
  initialMonth0: number;
  initialCheckins: { date: string; type: CheckinType }[];
  initialTrainings?: CalendarTraining[];
}) {
  const [year, setYear] = useState(initialYear);
  const [month0, setMonth0] = useState(initialMonth0);
  const [checkins, setCheckins] = useState(initialCheckins);
  const [trainings, setTrainings] = useState(initialTrainings);
  const [selectedDate, setSelectedDate] = useState<string | null>(ymd(new Date()));
  const [isPending, startTransition] = useTransition();

  const dayInfo = useMemo(() => buildDayInfo(checkins, trainings), [checkins, trainings]);

  useEffect(() => {
    if (year === initialYear && month0 === initialMonth0) return;
    startTransition(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setCheckins([]);
        setTrainings([]);
        return;
      }
      const supabase = createClient();
      const { start, end } = monthBounds(year, month0);
      const [{ data: cdata }, { data: tdata }] = await Promise.all([
        supabase
          .from("check_ins")
          .select("date, type")
          .gte("date", ymd(start))
          .lte("date", ymd(end)),
        supabase
          .from("trainings")
          .select(
            "id, date, content, duration_min, exercise_sets ( id, exercise_name, weight_kg, reps, sets )",
          )
          .gte("date", ymd(start))
          .lte("date", ymd(end)),
      ]);
      setCheckins(cdata ?? []);
      type RawTraining = {
        id: string;
        date: string;
        content: string;
        duration_min: number;
        exercise_sets: {
          id: string;
          exercise_name: string;
          weight_kg: number | null;
          reps: number | null;
          sets: number | null;
        }[] | null;
      };
      const mapped: CalendarTraining[] = ((tdata ?? []) as RawTraining[]).map((t) => {
        const sets = t.exercise_sets ?? [];
        const total = sets.reduce(
          (s, e) => s + (e.weight_kg ?? 0) * (e.reps ?? 0) * (e.sets ?? 1),
          0,
        );
        const isCardio = /有酸素|cardio|ランニング|バイク|ローイング/.test(t.content);
        return {
          id: t.id,
          date: t.date,
          parts: t.content.split(/[、,]/).map((s) => s.trim()).filter(Boolean),
          duration_min: t.duration_min,
          total_volume_kg: total,
          is_cardio: isCardio,
          exercise_sets: sets,
        };
      });
      setTrainings(mapped);
    });
  }, [year, month0, initialYear, initialMonth0]);

  const todayStr = ymd(new Date());
  const grid = buildGrid(year, month0);

  function shift(delta: number) {
    let m = month0 + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setMonth0(m);
    setYear(y);
    setSelectedDate(null);
  }

  const selectedInfo = selectedDate ? dayInfo[selectedDate] : undefined;

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
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
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const dayStr = ymd(d);
            const info = dayInfo[dayStr];
            const isSelected = selectedDate === dayStr;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : dayStr)}
                className={dayCellClass(info, dayStr === todayStr, isSelected)}
              >
                <span>{d.getDate()}</span>
                {info?.has_cardio && (
                  <span className="absolute bottom-0.5 right-0.5 inline-block size-1.5 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
        </div>

        <footer className="mt-3 flex flex-wrap gap-2.5 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded bg-emerald-500" /> パーソナル
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded bg-sky-200" /> 自主
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded bg-violet-500" /> 両方
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded ring-2 ring-sky-500 ring-inset" /> トレ
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-orange-500" /> 有酸素
          </span>
        </footer>
      </div>

      {selectedDate && (
        <DayDetail dateStr={selectedDate} info={selectedInfo} />
      )}
    </section>
  );
}

function DayDetail({ dateStr, info }: { dateStr: string; info: DayInfo | undefined }) {
  const md = dateStr.slice(5).replace("-", "/");
  const empty =
    !info ||
    (info.checkins.size === 0 && info.trainings.length === 0);

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
      <header className="flex items-center justify-between pb-2">
        <p className="text-sm font-bold text-zinc-900">{md} の記録</p>
        {info && info.total_volume_kg > 0 && (
          <p className="text-sm font-bold text-emerald-600">
            合計 {info.total_volume_kg.toLocaleString()} kg
          </p>
        )}
      </header>

      {empty && (
        <p className="py-2 text-sm text-zinc-400">この日の記録はありません</p>
      )}

      {info && info.checkins.size > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {info.checkins.has("personal") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
              <Flame size={12} /> パーソナル
            </span>
          )}
          {info.checkins.has("self") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700">
              <Dumbbell size={12} /> 自主
            </span>
          )}
        </div>
      )}

      {info && info.trainings.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          {info.trainings.map((t) => (
            <div key={t.id} className="rounded-lg bg-zinc-50 p-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 pb-1.5">
                <div className="flex flex-wrap gap-1">
                  {t.parts.map((p) => (
                    <span
                      key={p}
                      className="inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-zinc-200"
                    >
                      {partLabel(p)}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {t.duration_min}分
                </span>
              </div>
              {t.exercise_sets.length > 0 ? (
                <ul className="text-xs text-zinc-700 space-y-0.5">
                  {t.exercise_sets.map((e) => (
                    <li key={e.id} className="flex justify-between">
                      <span>{e.exercise_name}</span>
                      <span className="tabular-nums text-zinc-500">
                        {formatSet(e.weight_kg, e.reps, e.sets)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-400">種目の記録なし</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSet(weight: number | null, reps: number | null, sets: number | null) {
  const parts: string[] = [];
  if (weight != null && weight > 0) parts.push(`${weight}kg`);
  if (reps != null) parts.push(`${reps}回`);
  if (sets != null && sets > 1) parts.push(`${sets}セット`);
  return parts.join(" × ");
}
