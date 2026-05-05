import type { AvatarState, CheckinType } from "@/lib/types/database";

export function isDemoMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export const DEMO_PROFILE = { display_name: "デモユーザー" };

export const DEMO_AVATAR: { name: string; current_skin: string; state: AvatarState } = {
  name: "ジムくん",
  current_skin: "level-3",
  state: "normal",
};

export const DEMO_MEMBER = { current_xp: 110, current_level: 3 };

export function getDemoCheckins(): { date: string; type: CheckinType }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const offsets: { offset: number; type: CheckinType }[] = [
    { offset: -1, type: "self" },
    { offset: -3, type: "personal" },
    { offset: -5, type: "self" },
    { offset: -7, type: "personal" },
    { offset: -10, type: "personal" },
    { offset: -12, type: "self" },
    { offset: -14, type: "personal" },
  ];
  return offsets
    .map(({ offset, type }) => {
      const day = today + offset;
      if (day < 1) return null;
      const d = new Date(year, month, day);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return { date: `${d.getFullYear()}-${m}-${dd}`, type };
    })
    .filter((x): x is { date: string; type: CheckinType } => x != null);
}
