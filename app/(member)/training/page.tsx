import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, getDemoTrainings } from "@/lib/demo";
import { FeedbackBubble } from "@/components/feedback/FeedbackBubble";
import { PARTS } from "@/lib/exercises";
import { TrainingForm } from "./training-form";

export const dynamic = "force-dynamic";

type ExerciseSet = {
  id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  sets: number | null;
};

type TrainingRow = {
  id: string;
  date: string;
  parts: string[];
  memo: string | null;
  duration_min: number;
  total_volume_kg: number;
  exercise_sets: ExerciseSet[];
  feedbacks: {
    id: string;
    type: "comment" | "like";
    content: string | null;
    trainer_name: string;
    read_at: string | null;
    created_at: string;
  }[];
};

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

function parseContent(content: string): { parts: string[]; memo: string | null } {
  const m = content.match(/^(.*?)（(.+)）$/);
  if (m) {
    return {
      parts: m[1].split(/[、,]/).map((s) => s.trim()).filter(Boolean),
      memo: m[2],
    };
  }
  return {
    parts: content.split(/[、,]/).map((s) => s.trim()).filter(Boolean),
    memo: null,
  };
}

export default async function TrainingPage() {
  let trainings: TrainingRow[];

  if (isDemoMode()) {
    trainings = getDemoTrainings().map((t) => ({
      id: t.id,
      date: t.date,
      parts: t.parts,
      memo: t.memo,
      duration_min: t.duration_min,
      total_volume_kg: t.total_volume_kg,
      exercise_sets: t.exercise_sets,
      feedbacks: t.feedbacks,
    }));
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data } = await supabase
      .from("trainings")
      .select(
        "id, date, content, duration_min, exercise_sets ( id, exercise_name, weight_kg, reps, sets ), feedbacks ( id, type, content, read_at, created_at, trainer_id, profiles!feedbacks_trainer_id_fkey ( display_name ) )",
      )
      .eq("member_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    type RawFeedback = {
      id: string;
      type: "comment" | "like";
      content: string | null;
      read_at: string | null;
      created_at: string;
      profiles: { display_name: string } | null;
    };
    type RawTraining = {
      id: string;
      date: string;
      content: string;
      duration_min: number;
      exercise_sets: ExerciseSet[] | null;
      feedbacks: RawFeedback[] | null;
    };

    trainings = ((data ?? []) as unknown as RawTraining[]).map((t) => {
      const sets = t.exercise_sets ?? [];
      const total = sets.reduce(
        (s, e) => s + (e.weight_kg ?? 0) * (e.reps ?? 0) * (e.sets ?? 1),
        0,
      );
      const { parts, memo } = parseContent(t.content);
      return {
        id: t.id,
        date: t.date,
        parts,
        memo,
        duration_min: t.duration_min,
        total_volume_kg: total,
        exercise_sets: sets,
        feedbacks: (t.feedbacks ?? []).map((f) => ({
          id: f.id,
          type: f.type,
          content: f.content,
          trainer_name: f.profiles?.display_name ?? "トレーナー",
          read_at: f.read_at,
          created_at: f.created_at,
        })),
      };
    });
  }

  return (
    <main className="flex flex-col gap-5 px-4 py-5">
      <header>
        <h1 className="text-xl font-bold text-zinc-900">トレーニング</h1>
        <p className="mt-1 text-sm text-zinc-500">記録するごとに +2 XP</p>
      </header>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <TrainingForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-sm font-bold text-zinc-700">これまでの記録</h2>
        {trainings.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400 ring-1 ring-zinc-100">
            まだ記録がありません
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {trainings.map((t) => (
              <li key={t.id} className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
                <div className="flex items-center justify-between pb-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-900">{formatDate(t.date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {t.duration_min} 分
                  </span>
                </div>
                {t.parts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pb-2">
                    {t.parts.map((p) => (
                      <span
                        key={p}
                        className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                      >
                        {partLabel(p)}
                      </span>
                    ))}
                  </div>
                )}
                {t.exercise_sets.length > 0 && (
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <ul className="space-y-0.5 text-sm">
                      {t.exercise_sets.map((e) => (
                        <li key={e.id} className="flex justify-between">
                          <span className="text-zinc-800">{e.exercise_name}</span>
                          <span className="tabular-nums text-zinc-500">
                            {formatSet(e.weight_kg, e.reps, e.sets)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {t.total_volume_kg > 0 && (
                      <p className="pt-2 text-right text-xs font-bold text-emerald-600">
                        合計 {t.total_volume_kg.toLocaleString()} kg
                      </p>
                    )}
                  </div>
                )}
                {t.memo && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-600">{t.memo}</p>
                )}
                {t.feedbacks.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
                    {t.feedbacks.map((f) => (
                      <FeedbackBubble
                        key={f.id}
                        type={f.type}
                        content={f.content}
                        trainerName={f.trainer_name}
                        createdAt={formatDate(f.created_at)}
                        unread={f.type === "comment" && f.read_at == null}
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
