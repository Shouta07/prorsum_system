import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { DemoBanner } from "@/components/demo-banner";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();

  if (!demo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || (profile.role !== "trainer" && profile.role !== "admin")) {
      redirect("/");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      {demo && <DemoBanner switchHref="/" switchLabel="会員画面へ" />}
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h1 className="text-base font-bold text-zinc-900">トレーナー</h1>
        <nav className="flex gap-3">
          <Link
            href="/trainer"
            className="inline-flex items-center gap-1 text-xs text-zinc-700"
          >
            <Users size={14} />
            会員一覧
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-zinc-500"
          >
            <Home size={14} />
            会員モード
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
