import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarCard } from "@/components/avatar/AvatarCard";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import {
  isDemoMode,
  DEMO_AVATAR,
  DEMO_MEMBER,
  getDemoCheckins,
} from "@/lib/demo";

export default async function MemberHome() {
  const demo = isDemoMode();
  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();

  if (demo) {
    return (
      <main className="flex flex-col gap-4 px-4 py-5">
        <AvatarCard
          name={DEMO_AVATAR.name}
          skin={DEMO_AVATAR.current_skin}
          state={DEMO_AVATAR.state}
          currentXp={DEMO_MEMBER.current_xp}
        />
        <MonthCalendar
          initialYear={year}
          initialMonth0={month0}
          initialCheckins={getDemoCheckins()}
        />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthStart = `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month0 + 1, 0);
  const monthEndStr = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

  const [{ data: avatar }, { data: member }, { data: checkins }] = await Promise.all([
    supabase
      .from("avatars")
      .select("name, current_skin, state")
      .eq("member_id", user.id)
      .single(),
    supabase
      .from("members")
      .select("current_xp, current_level")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("check_ins")
      .select("date, type")
      .gte("date", monthStart)
      .lte("date", monthEndStr),
  ]);

  if (!avatar) redirect("/onboarding");

  return (
    <main className="flex flex-col gap-4 px-4 py-5">
      <AvatarCard
        name={avatar.name}
        skin={avatar.current_skin}
        state={avatar.state}
        currentXp={member?.current_xp ?? 0}
      />
      <MonthCalendar
        initialYear={year}
        initialMonth0={month0}
        initialCheckins={checkins ?? []}
      />
    </main>
  );
}
