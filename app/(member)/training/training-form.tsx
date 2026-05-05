"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logTraining } from "./actions";
import { cn } from "@/lib/utils";

const PARTS = [
  { id: "chest", label: "胸" },
  { id: "back", label: "背中" },
  { id: "legs", label: "脚" },
  { id: "shoulders", label: "肩" },
  { id: "arms", label: "腕" },
  { id: "abs", label: "腹筋" },
  { id: "cardio", label: "有酸素" },
  { id: "fullbody", label: "全身" },
  { id: "recovery", label: "リカバリー" },
] as const;

const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

export function TrainingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [memo, setMemo] = useState("");

  function togglePart(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function onSubmit() {
    if (selected.length === 0) {
      toast.error("部位を1つ以上選んでください");
      return;
    }
    const labels = PARTS.filter((p) => selected.includes(p.id)).map((p) => p.label);
    const content = memo.trim() ? `${labels.join("、")}（${memo.trim()}）` : labels.join("、");

    startTransition(async () => {
      const result = await logTraining({ content, duration_min: duration });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("トレーニングを記録しました（+2 XP）");
      setSelected([]);
      setMemo("");
      setDuration(60);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>今日鍛えた部位（複数OK）</Label>
        <div className="flex flex-wrap gap-2">
          {PARTS.map((p) => {
            const active = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePart(p.id)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium ring-1 transition",
                  active
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>所要時間</Label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={cn(
                "h-10 rounded-md text-sm font-medium ring-1 transition",
                duration === d
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
              )}
            >
              {d} 分
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">
          メモ <span className="text-xs font-normal text-zinc-400">（任意）</span>
        </Label>
        <input
          id="memo"
          type="text"
          maxLength={200}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: ベンチ 60kg 8回×3セット"
          className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
        />
      </div>

      <Button type="button" onClick={onSubmit} size="lg" disabled={isPending}>
        {isPending ? "記録中…" : "記録する"}
      </Button>
    </div>
  );
}
