import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
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
