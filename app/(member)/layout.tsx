import Link from "next/link";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  let isStaff = false;

  if (!demo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: avatar }, { data: profile }] = await Promise.all([
      supabase
        .from("avatars")
        .select("member_id")
        .eq("member_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    isStaff = profile?.role === "trainer" || profile?.role === "admin";
    if (!avatar && !isStaff) redirect("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      {demo && <DemoBanner />}
      {!demo && isStaff && (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2 text-xs text-zinc-700">
          <span>会員モード</span>
          <Link
            href="/trainer"
            className="inline-flex items-center gap-1 font-bold text-emerald-600"
          >
            <Users size={12} />
            トレーナー画面へ
          </Link>
        </div>
      )}
      <div className="flex-1 pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
