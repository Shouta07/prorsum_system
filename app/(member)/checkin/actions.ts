"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import type { CheckinType } from "@/lib/types/database";

const schema = z.object({ type: z.enum(["personal", "self"]) });

type Result =
  | { ok: true; data: { points: number; leveledUp: boolean; newLevel: number } }
  | { ok: false; error: string };

export async function checkIn(input: { type: CheckinType }): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "不正な入力です" };

  if (isDemoMode()) {
    const points = parsed.data.type === "personal" ? 10 : 3;
    return { ok: true, data: { points, leveledUp: false, newLevel: 3 } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: before } = await supabase
    .from("members")
    .select("current_level")
    .eq("user_id", user.id)
    .single();
  const beforeLevel = before?.current_level ?? 1;

  const { data: inserted, error } = await supabase
    .from("check_ins")
    .insert({ member_id: user.id, type: parsed.data.type })
    .select("points_awarded")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "今日はすでにチェックイン済みです" };
    }
    return { ok: false, error: error.message };
  }

  const { data: after } = await supabase
    .from("members")
    .select("current_level")
    .eq("user_id", user.id)
    .single();
  const newLevel = after?.current_level ?? beforeLevel;

  revalidatePath("/");

  return {
    ok: true,
    data: {
      points: inserted.points_awarded,
      leveledUp: newLevel > beforeLevel,
      newLevel,
    },
  };
}
