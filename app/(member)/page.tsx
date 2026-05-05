import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvatarCard } from "@/components/avatar/AvatarCard";
import { MonthCalendar, type CalendarTraining } from "@/components/calendar/MonthCalendar";
import { FeedbackBubble } from "@/components/feedback/FeedbackBubble";
import {
  isDemoMode,
  DEMO_AVATAR,
  DEMO_MEMBER,
  getDemoCheckins,
  getDemoTrainings,
  getDemoUnreadFeedbacks,
} from "@/lib/demo";
import { isExerciseCardio } from "@/lib/exercises";

export const dynamic = "force-dynamic";

type UnreadFeedback = {
  id: string;
  trainer_name: string;
  content: string;
  created_at: string;
  training_excerpt: string;
};

function formatDate(d: string) {
  return d.slice(5).replace("-", "/");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function MemberHome() {
  const demo = isDemoMode();
  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();

  if (demo) {
    const trainings: CalendarTraining[] = getDemoTrainings()
      .filter((t) => t.date >= ymd(new Date(year, month0, 1)))
      .map((t) => ({
        id: t.id,
        date: t.date,
        parts: t.parts,
        duration_min: t.duration_min,
        total_volume_kg: t.total_volume_kg,
        is_cardio: t.is_cardio,
        exercise_sets: t.exercise_sets.map((e) => ({
          id: e.id,
          exercise_name: e.exercise_name,
          weight_kg: e.weight_kg,
          reps: e.reps,
          sets: e.sets,
        })),
      }));
    return (
      <main className="flex flex-col gap-4 px-4 py-5">
        <AvatarCard
          name={DEMO_AVATAR.name}
          skin={DEMO_AVATAR.current_skin}
          state={DEMO_AVATAR.state}
          currentXp={DEMO_MEMBER.current_xp}
        />
        <MonthCalendar
          initialYear={year}
          initialMonth0={month0}
          initialCheckins={getDemoCheckins()}
          initialTrainings={trainings}
        />
        <UnreadSection items={getDemoUnreadFeedbacks()} />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthStart = `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month0 + 1, 0);
  const monthEndStr = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;

  const [
    { data: avatar },
    { data: member },
    { data: checkins },
    { data: trainingsRaw },
    { data: unreadRaw },
  ] = await Promise.all([
    supabase
      .from("avatars")
      .select("name, current_skin, state")
      .eq("member_id", user.id)
      .single(),
    supabase
      .from("members")
      .select("current_xp, current_level")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("check_ins")
      .select("date, type")
      .gte("date", monthStart)
      .lte("date", monthEndStr),
    supabase
      .from("trainings")
      .select(
        "id, date, content, duration_min, exercise_sets ( id, exercise_name, weight_kg, reps, sets )",
      )
      .eq("member_id", user.id)
      .gte("date", monthStart)
      .lte("date", monthEndStr),
    supabase
      .from("feedbacks")
      .select(
        "id, content, created_at, profiles!feedbacks_trainer_id_fkey ( display_name ), trainings!inner ( member_id, content )",
      )
      .eq("type", "comment")
      .is("read_at", null)
      .eq("trainings.member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (!avatar) redirect("/onboarding");

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
  const trainings: CalendarTraining[] = ((trainingsRaw ?? []) as unknown as RawTraining[]).map(
    (t) => {
      const sets = t.exercise_sets ?? [];
      const total = sets.reduce(
        (s, e) => s + (e.weight_kg ?? 0) * (e.reps ?? 0) * (e.sets ?? 1),
        0,
      );
      const isCardio = sets.some((e) => isExerciseCardio(e.exercise_name));
      return {
        id: t.id,
        date: t.date,
        parts: t.content.split(/[、,]/).map((s) => s.trim()).filter(Boolean),
        duration_min: t.duration_min,
        total_volume_kg: total,
        is_cardio: isCardio,
        exercise_sets: sets,
      };
    },
  );

  type RawUnread = {
    id: string;
    content: string | null;
    created_at: string;
    profiles: { display_name: string } | null;
    trainings: { content: string } | null;
  };
  const unread: UnreadFeedback[] = ((unreadRaw ?? []) as unknown as RawUnread[])
    .filter((f) => f.content != null)
    .map((f) => ({
      id: f.id,
      trainer_name: f.profiles?.display_name ?? "トレーナー",
      content: f.content as string,
      created_at: f.created_at,
      training_excerpt: f.trainings?.content.slice(0, 24) ?? "",
    }));

  return (
    <main className="flex flex-col gap-4 px-4 py-5">
      <AvatarCard
        name={avatar.name}
        skin={avatar.current_skin}
        state={avatar.state}
        currentXp={member?.current_xp ?? 0}
      />
      <MonthCalendar
        initialYear={year}
        initialMonth0={month0}
        initialCheckins={checkins ?? []}
        initialTrainings={trainings}
      />
      <UnreadSection items={unread} />
    </main>
  );
}

function UnreadSection({ items }: { items: UnreadFeedback[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-zinc-700">トレーナーからのメッセージ</h2>
        <Link href="/training" className="inline-flex items-center text-xs text-emerald-600">
          すべて見る
          <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        {items.map((f) => (
          <FeedbackBubble
            key={f.id}
            type="comment"
            content={f.content}
            trainerName={f.trainer_name}
            createdAt={formatDate(f.created_at)}
            unread
          />
        ))}
      </div>
    </section>
  );
}
