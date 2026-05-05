"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logWeight } from "./actions";

export function WeightForm({
  todayValue,
  lastKnownValue,
}: {
  todayValue: number | null;
  lastKnownValue: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = todayValue ?? lastKnownValue ?? 70.0;
  const [weight, setWeight] = useState<number>(initial);

  function adjust(delta: number) {
    setWeight((w) => +(Math.max(20, Math.min(250, w + delta))).toFixed(1));
  }

  function onSubmit() {
    if (!Number.isFinite(weight) || weight < 20 || weight > 250) {
      toast.error("20〜250kg の範囲で入力してください");
      return;
    }
    startTransition(async () => {
      const result = await logWeight({ weight_kg: weight });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(todayValue != null ? "体重を更新しました" : "体重を記録しました（+1 XP）");
      router.refresh();
    });
  }

  const status =
    todayValue != null
      ? `今日は ${todayValue} kg で記録済み（更新できます）`
      : lastKnownValue != null
        ? `前回: ${lastKnownValue} kg`
        : "今日の体重を記録しよう";

  const QUICK = [-1, -0.5, -0.1, 0.1, 0.5, 1];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>今日の体重</Label>
        <p className="text-xs text-zinc-500">{status}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => adjust(-0.1)}
          aria-label="0.1 減らす"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:bg-zinc-200"
        >
          <Minus size={20} />
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={Number.isFinite(weight) ? weight : ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setWeight(Number.isFinite(v) ? v : 0);
            }}
            className="w-24 bg-transparent text-center text-3xl font-bold tabular-nums text-zinc-900 outline-none"
          />
          <span className="text-sm text-zinc-500">kg</span>
        </div>
        <button
          type="button"
          onClick={() => adjust(0.1)}
          aria-label="0.1 増やす"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:bg-zinc-200"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => adjust(q)}
            className="h-8 rounded-md bg-white text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            {q > 0 ? `+${q}` : q}
          </button>
        ))}
      </div>

      <Button type="button" onClick={onSubmit} disabled={isPending} size="lg">
        {isPending ? "記録中…" : todayValue != null ? "更新する" : "記録する"}
      </Button>
    </div>
  );
}
