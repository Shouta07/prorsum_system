import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (isDemoMode()) redirect("/");

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
  if (avatar) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <OnboardingForm />
    </main>
  );
}
