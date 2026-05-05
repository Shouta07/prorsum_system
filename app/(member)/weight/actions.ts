"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

const schema = z.object({
  weight_kg: z.number().min(20, "20kg 以上で入力してください").max(250, "250kg 以下で入力してください"),
});

type Result = { ok: true } | { ok: false; error: string };

export async function logWeight(input: { weight_kg: number }): Promise<Result> {
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

  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error } = await supabase
    .from("weights")
    .upsert(
      { member_id: user.id, date, weight_kg: parsed.data.weight_kg },
      { onConflict: "member_id,date" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/weight");
  revalidatePath("/");
  return { ok: true };
}
