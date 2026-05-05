import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, getDemoTrainings } from "@/lib/demo";
import { FeedbackBubble } from "@/components/feedback/FeedbackBubble";
import { TrainingForm } from "./training-form";

export const dynamic = "force-dynamic";

type TrainingRow = {
  id: string;
  date: string;
  content: string;
  duration_min: number;
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

export default async function TrainingPage() {
  let trainings: TrainingRow[];

  if (isDemoMode()) {
    trainings = getDemoTrainings();
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data } = await supabase
      .from("trainings")
      .select(
        "id, date, content, duration_min, feedbacks ( id, type, content, read_at, created_at, trainer_id, profiles!feedbacks_trainer_id_fkey ( display_name ) )",
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
    type RawTraining = Omit<TrainingRow, "feedbacks"> & { feedbacks: RawFeedback[] | null };

    trainings = ((data ?? []) as unknown as RawTraining[]).map((t) => ({
      id: t.id,
      date: t.date,
      content: t.content,
      duration_min: t.duration_min,
      feedbacks: (t.feedbacks ?? []).map((f) => ({
        id: f.id,
        type: f.type,
        content: f.content,
        trainer_name: f.profiles?.display_name ?? "トレーナー",
        read_at: f.read_at,
        created_at: f.created_at,
      })),
    }));
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
              <li
                key={t.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100"
              >
                <div className="flex items-center justify-between pb-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-900">{formatDate(t.date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {t.duration_min} 分
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                  {t.content}
                </p>
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
