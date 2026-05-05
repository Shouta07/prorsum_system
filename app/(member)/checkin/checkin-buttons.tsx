"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dumbbell, Flame } from "lucide-react";
import { LevelUpModal } from "@/components/level-up-modal";
import { checkIn } from "./actions";
import type { CheckinType } from "@/lib/types/database";

export function CheckinButtons() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingType, setPendingType] = useState<CheckinType | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);

  function handleClick(type: CheckinType) {
    setPendingType(type);
    startTransition(async () => {
      const result = await checkIn({ type });
      setPendingType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`+${result.data.points} XP！`);
      if (result.data.leveledUp) {
        setLevelUp({ level: result.data.newLevel });
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => handleClick("personal")}
          disabled={isPending}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
        >
          <Flame size={32} strokeWidth={2.5} />
          <span className="text-base font-bold">パーソナルジムに行った</span>
          <span className="text-xs opacity-90">
            {pendingType === "personal" && isPending ? "記録中…" : "+10 XP"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleClick("self")}
          disabled={isPending}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-sky-500 text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
        >
          <Dumbbell size={32} strokeWidth={2.5} />
          <span className="text-base font-bold">自主トレした</span>
          <span className="text-xs opacity-90">
            {pendingType === "self" && isPending ? "記録中…" : "+3 XP"}
          </span>
        </button>
      </div>
      <LevelUpModal
        open={levelUp != null}
        level={levelUp?.level ?? 1}
        onClose={() => setLevelUp(null)}
      />
    </>
  );
}
