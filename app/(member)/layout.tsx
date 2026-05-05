import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();

  if (!demo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: avatar } = await supabase
      .from("avatars")
      .select("member_id")
      .eq("member_id", user.id)
      .maybeSingle();
    if (!avatar) redirect("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      {demo && <DemoBanner />}
      <div className="flex-1 pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
