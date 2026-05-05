import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MemberHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email ?? "あなた";

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-8">
      <header>
        <p className="text-sm text-zinc-500">ようこそ</p>
        <h1 className="text-2xl font-bold text-zinc-900">{displayName} さん</h1>
      </header>
      <section className="rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600 ring-1 ring-zinc-100">
        Phase 0 ログイン確認用ホームです。次フェーズでアバター・チェックイン・カレンダーを実装します。
      </section>
    </main>
  );
}
