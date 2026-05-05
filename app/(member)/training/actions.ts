"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

const schema = z.object({
  content: z.string().min(1, "内容を入力してください").max(500, "500文字以内"),
  duration_min: z.number().int().min(1).max(360),
});

type Result = { ok: true } | { ok: false; error: string };

export async function logTraining(input: {
  content: string;
  duration_min: number;
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

  const { error } = await supabase.from("trainings").insert({
    member_id: user.id,
    content: parsed.data.content,
    duration_min: parsed.data.duration_min,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/training");
  revalidatePath("/");
  return { ok: true };
}
