"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1, "名前を入力してください").max(20, "20文字以内で入力してください"),
});

type Result = { ok: true } | { ok: false; error: string };

export async function createAvatar(input: { name: string }): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error } = await supabase.from("avatars").insert({
    member_id: user.id,
    name: parsed.data.name,
  });
  if (error) return { ok: false, error: error.message };

  redirect("/");
}
