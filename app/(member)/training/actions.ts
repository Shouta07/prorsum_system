"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

const exerciseSchema = z.object({
  exercise_name: z.string().min(1).max(60),
  weight_kg: z.number().min(0).max(500).nullable(),
  reps: z.number().int().min(0).max(500).nullable(),
  sets: z.number().int().min(1).max(20),
});

const schema = z.object({
  content: z.string().min(1, "内容を入力してください").max(500, "500文字以内"),
  duration_min: z.number().int().min(1).max(360),
  memberId: z.string().uuid().optional(),
  exercises: z.array(exerciseSchema).max(30).optional(),
});

type Result = { ok: true } | { ok: false; error: string };

export async function logTraining(input: {
  content: string;
  duration_min: number;
  memberId?: string;
  exercises?: {
    exercise_name: string;
    weight_kg: number | null;
    reps: number | null;
    sets: number;
  }[];
}): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  }

  if (isDemoMode()) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  let targetMemberId = user.id;
  if (parsed.data.memberId && parsed.data.memberId !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "trainer" && profile?.role !== "admin") {
      return { ok: false, error: "他の会員の代理入力はトレーナーのみ可能です" };
    }
    targetMemberId = parsed.data.memberId;
  }

  const { data: training, error } = await supabase
    .from("trainings")
    .insert({
      member_id: targetMemberId,
      content: parsed.data.content,
      duration_min: parsed.data.duration_min,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const exercises = parsed.data.exercises ?? [];
  if (exercises.length > 0) {
    const { error: e2 } = await supabase.from("exercise_sets").insert(
      exercises.map((e, i) => ({
        training_id: training.id,
        exercise_name: e.exercise_name,
        weight_kg: e.weight_kg,
        reps: e.reps,
        sets: e.sets,
        position: i,
      })),
    );
    if (e2) return { ok: false, error: e2.message };
  }

  revalidatePath("/training");
  revalidatePath("/");
  if (parsed.data.memberId) {
    revalidatePath(`/trainer/${parsed.data.memberId}`);
  }
  return { ok: true };
}
