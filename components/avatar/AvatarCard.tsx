import { AvatarImage } from "./AvatarImage";
import { xpToNextLevel } from "@/lib/xp/rules";
import type { AvatarState } from "@/lib/types/database";

export function AvatarCard({
  name,
  skin,
  state,
  currentXp,
}: {
  name: string;
  skin: string;
  state: AvatarState;
  currentXp: number;
}) {
  const { level, xpIntoLevel, xpForNextLevel, remaining } = xpToNextLevel(currentXp);
  const progress =
    xpForNextLevel == null ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  const stateMessage =
    state === "lonely"
      ? "ひさしぶり…"
      : state === "celebrating"
        ? "やった！レベルアップ！"
        : "今日もいっしょに頑張ろう";

  return (
    <section className="flex flex-col items-center gap-3 px-5 py-6 bg-gradient-to-b from-white to-zinc-50 rounded-2xl">
      <AvatarImage skin={skin} state={state} className="w-40 h-40" />
      <div className="text-center">
        <p className="text-xs text-zinc-500">{stateMessage}</p>
        <p className="text-lg font-bold text-zinc-900">{name}</p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-700">Lv.{level}</span>
          <span className="text-zinc-500">
            {remaining == null ? "MAX" : `あと ${remaining} XP で Lv.${level + 1}`}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
