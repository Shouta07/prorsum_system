import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isDemoMode,
  DEMO_MEMBERS,
  getDemoTrainings,
  getDemoWeights,
  getDemoCheckins,
} from "@/lib/demo";
import { TrainingForm } from "@/app/(member)/training/training-form";
import { PARTS } from "@/lib/exercises";

export const dynamic = "force-dynamic";

function formatDate(d: string) {
  return d.slice(5).replace("-", "/");
}

function partLabel(s: string) {
  return PARTS.find((p) => p.id === s)?.label ?? s;
}

function formatSet(weight: number | null, reps: number | null, sets: number | null) {
  const out: string[] = [];
  if (weight != null && weight > 0) out.push(`${weight}kg`);
  if (reps != null) out.push(`${reps}回`);
  if (sets != null && sets > 1) out.push(`${sets}セット`);
  return out.join(" × ");
}

export default async function TrainerMemberDetail({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  let displayName: string;
  let level: number;
  let xp: number;
  let recentTrainings: {
    id: string;
    date: string;
    parts: string[];
    duration_min: number;
    total_volume_kg: number;
    exercise_sets: {
      id: string;
      exercise_name: string;
      weight_kg: number | null;
      reps: number | null;
      sets: number | null;
    }[];
  }[];
  let lastWeight: number | null;
  let lastCheckin: string | null;

  if (isDemoMode()) {
    const m = DEMO_MEMBERS.find((x) => x.user_id === memberId);
    if (!m) notFound();
    displayName = m.display_name;
    level = m.current_level;
    xp = m.current_xp;
    lastWeight = m.last_weight;
    lastCheckin = m.last_visit;
    recentTrainings = getDemoTrainings()
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        date: t.date,
        parts: t.parts,
        duration_min: t.duration_min,
        total_volume_kg: t.total_volume_kg,
        exercise_sets: t.exercise_sets,
      }));
  } else {
    const supabase = await createClient();
    const [{ data: profile }, { data: member }, { data: trainings }, { data: lastW }, { data: lastC }] =
      await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", memberId).single(),
        supabase.from("members").select("current_xp, current_level").eq("user_id", memberId).single(),
        supabase
          .from("trainings")
          .select(
            "id, date, content, duration_min, exercise_sets ( id, exercise_name, weight_kg, reps, sets )",
          )
          .eq("member_id", memberId)
          .order("date", { ascending: false })
          .limit(5),
        supabase
          .from("weights")
          .select("weight_kg")
          .eq("member_id", memberId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("check_ins")
          .select("date")
          .eq("member_id", memberId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    if (!profile) notFound();
    displayName = profile.display_name;
    level = member?.current_level ?? 1;
    xp = member?.current_xp ?? 0;
    lastWeight = lastW?.weight_kg ?? null;
    lastCheckin = lastC?.date ?? null;
    type RawTraining = {
      id: string;
      date: string;
      content: string;
      duration_min: number;
      exercise_sets:
        | {
            id: string;
            exercise_name: string;
            weight_kg: number | null;
            reps: number | null;
            sets: number | null;
          }[]
        | null;
    };
    recentTrainings = ((trainings ?? []) as RawTraining[]).map((t) => ({
      id: t.id,
      date: t.date,
      parts: t.content.split(/[、,（]/)[0].split(/[、,]/).map((s) => s.trim()).filter(Boolean),
      duration_min: t.duration_min,
      total_volume_kg: (t.exercise_sets ?? []).reduce(
        (s, e) => s + (e.weight_kg ?? 0) * (e.reps ?? 0) * (e.sets ?? 1),
        0,
      ),
      exercise_sets: t.exercise_sets ?? [],
    }));
  }

  // Stats from demo (or future supabase fetch). Keep simple for trainer view.
  const checkinThisMonth = isDemoMode() ? getDemoCheckins().length : 0;
  const weightTrend = isDemoMode() ? getDemoWeights(30) : [];

  return (
    <main className="flex flex-col gap-4 px-4 py-5">
      <Link href="/trainer" className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <ChevronLeft size={14} />
        会員一覧
      </Link>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <p className="text-xs text-zinc-500">会員</p>
        <h2 className="text-xl font-bold text-zinc-900">{displayName}</h2>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <Stat label="レベル" value={`Lv.${level}`} />
          <Stat label="XP" value={String(xp)} />
          <Stat label="今月来店" value={`${checkinThisMonth}回`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
          {lastCheckin && (
            <span className="rounded bg-zinc-100 px-2 py-0.5">最終来店 {formatDate(lastCheckin)}</span>
          )}
          {lastWeight != null && (
            <span className="rounded bg-zinc-100 px-2 py-0.5">直近体重 {lastWeight} kg</span>
          )}
          {weightTrend.length > 1 && (
            <span className="rounded bg-zinc-100 px-2 py-0.5">
              30日変化 {(weightTrend[weightTrend.length - 1].weight_kg - weightTrend[0].weight_kg).toFixed(1)} kg
            </span>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <h3 className="pb-3 text-sm font-bold text-zinc-700">代理でトレーニングを記録</h3>
        <TrainingForm onBehalfOf={{ user_id: memberId, display_name: displayName }} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-bold text-zinc-700">直近のトレーニング</h3>
        {recentTrainings.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400 ring-1 ring-zinc-100">
            記録なし
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentTrainings.map((t) => (
              <li key={t.id} className="rounded-xl bg-white p-3 ring-1 ring-zinc-100">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-zinc-900">{formatDate(t.date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {t.duration_min}分
                  </span>
                </div>
                {t.parts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.parts.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700"
                      >
                        {partLabel(p)}
                      </span>
                    ))}
                  </div>
                )}
                {t.exercise_sets.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs">
                    {t.exercise_sets.slice(0, 4).map((e) => (
                      <li key={e.id} className="flex justify-between">
                        <span className="text-zinc-700">{e.exercise_name}</span>
                        <span className="tabular-nums text-zinc-500">
                          {formatSet(e.weight_kg, e.reps, e.sets)}
                        </span>
                      </li>
                    ))}
                    {t.exercise_sets.length > 4 && (
                      <li className="text-zinc-400">他 {t.exercise_sets.length - 4} 種目</li>
                    )}
                  </ul>
                )}
                {t.total_volume_kg > 0 && (
                  <p className="mt-1 text-right text-[11px] font-bold text-emerald-600">
                    合計 {t.total_volume_kg.toLocaleString()} kg
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-2 py-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="text-sm font-bold text-zinc-900">{value}</p>
    </div>
  );
}
