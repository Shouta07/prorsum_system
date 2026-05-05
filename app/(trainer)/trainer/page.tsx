import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, DEMO_MEMBERS } from "@/lib/demo";

export const dynamic = "force-dynamic";

type MemberRow = {
  user_id: string;
  display_name: string;
  current_level: number;
  current_xp: number;
  last_visit: string | null;
  last_weight: number | null;
};

function relativeDays(dateStr: string | null): string {
  if (!dateStr) return "未来店";
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  if (diff < 7) return `${diff}日前`;
  return `${Math.floor(diff / 7)}週間前`;
}

export default async function TrainerHome() {
  let members: MemberRow[];

  if (isDemoMode()) {
    members = DEMO_MEMBERS;
  } else {
    const supabase = await createClient();
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("role", "member");
    const ids = (profilesData ?? []).map((p) => p.id);
    if (ids.length === 0) {
      members = [];
    } else {
      const [{ data: membersData }, { data: lastCheckins }, { data: lastWeights }] =
        await Promise.all([
          supabase
            .from("members")
            .select("user_id, current_level, current_xp")
            .in("user_id", ids),
          supabase
            .from("check_ins")
            .select("member_id, date")
            .in("member_id", ids)
            .order("date", { ascending: false }),
          supabase
            .from("weights")
            .select("member_id, weight_kg, date")
            .in("member_id", ids)
            .order("date", { ascending: false }),
        ]);

      const lastVisitMap = new Map<string, string>();
      for (const c of lastCheckins ?? []) {
        if (!lastVisitMap.has(c.member_id)) lastVisitMap.set(c.member_id, c.date);
      }
      const lastWeightMap = new Map<string, number>();
      for (const w of lastWeights ?? []) {
        if (!lastWeightMap.has(w.member_id)) lastWeightMap.set(w.member_id, w.weight_kg);
      }
      const memberMap = new Map(
        (membersData ?? []).map((m) => [
          m.user_id,
          { current_level: m.current_level, current_xp: m.current_xp },
        ]),
      );

      members = (profilesData ?? []).map((p) => {
        const m = memberMap.get(p.id);
        return {
          user_id: p.id,
          display_name: p.display_name,
          current_level: m?.current_level ?? 1,
          current_xp: m?.current_xp ?? 0,
          last_visit: lastVisitMap.get(p.id) ?? null,
          last_weight: lastWeightMap.get(p.id) ?? null,
        };
      });
    }
  }

  return (
    <main className="flex flex-col gap-4 px-4 py-5">
      <header>
        <h2 className="text-lg font-bold text-zinc-900">会員一覧</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {members.length} 名の会員。タップで詳細・代理記録ができます。
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.user_id}>
            <Link
              href={`/trainer/${m.user_id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-zinc-100 hover:bg-zinc-50"
            >
              <div className="flex flex-col gap-1">
                <p className="font-bold text-zinc-900">{m.display_name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                    Lv.{m.current_level}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flame size={11} />
                    {relativeDays(m.last_visit)}
                  </span>
                  {m.last_weight != null && (
                    <span className="tabular-nums">{m.last_weight} kg</span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
